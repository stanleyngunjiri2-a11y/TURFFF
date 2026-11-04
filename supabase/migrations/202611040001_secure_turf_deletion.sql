BEGIN;

-- ============================================================
-- TURFF: SECURE SUPERADMIN TURF DELETION
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_turf_listing(
    p_turf_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_image_urls text[];
    v_turf_name text;
BEGIN

    -- 1. Require authenticated superadmin.
    IF auth.uid() IS NULL
       OR NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Superadmin access is required.';
    END IF;

    IF p_turf_id IS NULL THEN
        RAISE EXCEPTION 'A valid turf ID is required.';
    END IF;

    -- 2. Lock the turf during the deletion operation.
    SELECT name
    INTO v_turf_name
    FROM public.turfs
    WHERE id = p_turf_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'This turf listing does not exist.';
    END IF;

    -- 3. Preserve historical bookings.
    IF EXISTS (
        SELECT 1
        FROM public.bookings
        WHERE turf_id = p_turf_id
    ) THEN
        RAISE EXCEPTION
            'This turf cannot be deleted because it has booking history. Deactivate the listing instead.';
    END IF;

    -- 4. Preserve subscription and payment history.
    IF EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE turf_id = p_turf_id
    ) THEN
        RAISE EXCEPTION
            'This turf cannot be deleted because it has subscription or payment history. Deactivate the listing instead.';
    END IF;

    -- 5. Capture image URLs before cascading database deletion.
    SELECT COALESCE(
        array_agg(image_url),
        ARRAY[]::text[]
    )
    INTO v_image_urls
    FROM public.turf_images
    WHERE turf_id = p_turf_id;

    -- 6. Delete turf.
    -- turf_images records are removed through ON DELETE CASCADE.
    DELETE FROM public.turfs
    WHERE id = p_turf_id;

    RETURN jsonb_build_object(
        'success', true,
        'turf_name', v_turf_name,
        'image_urls', v_image_urls
    );

END;
$$;

-- Restrict function execution.
REVOKE ALL ON FUNCTION public.delete_turf_listing(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.delete_turf_listing(uuid)
TO authenticated;

-- ============================================================
-- STORAGE CLEANUP POLICY
-- Only superadmins may delete objects from turf-images.
-- ============================================================

DROP POLICY IF EXISTS
    "Superadmins can delete turf images"
ON storage.objects;

CREATE POLICY "Superadmins can delete turf images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'turf-images'
    AND (SELECT public.is_superadmin())
);

COMMIT;
