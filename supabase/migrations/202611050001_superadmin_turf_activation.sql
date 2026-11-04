BEGIN;

-- ============================================================
-- TURFF: SECURE SUPERADMIN TURF ACTIVATION / DEACTIVATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_turf_listing_active(
    p_turf_id uuid,
    p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_review_status public.turf_review_status;
BEGIN

    -- Require authenticated superadmin.
    IF auth.uid() IS NULL
       OR NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Superadmin access is required.';
    END IF;

    IF p_turf_id IS NULL OR p_is_active IS NULL THEN
        RAISE EXCEPTION 'Valid turf details are required.';
    END IF;

    -- Lock the listing during the operation.
    SELECT review_status
    INTO v_review_status
    FROM public.turfs
    WHERE id = p_turf_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turf listing not found.';
    END IF;

    -- Only approved listings can be activated or deactivated.
    IF v_review_status <> 'approved' THEN
        RAISE EXCEPTION 'Only approved turf listings can be activated or deactivated.';
    END IF;

    -- Reactivation requires a currently valid subscription.
    IF p_is_active = true
       AND NOT public.has_active_subscription(p_turf_id) THEN
        RAISE EXCEPTION
            'This turf cannot be reactivated because it does not have an active subscription.';
    END IF;

    UPDATE public.turfs
    SET
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_turf_id;

END;
$$;

REVOKE ALL ON FUNCTION public.set_turf_listing_active(uuid, boolean)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_turf_listing_active(uuid, boolean)
TO authenticated;

COMMIT;
