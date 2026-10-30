-- ============================================================
-- TURFF: Owner Onboarding and Superadmin Approval
-- Migration: 202610300001
--
-- Features:
--   1. Owner applications
--   2. Application RLS
--   3. Protected owner approval
--   4. Secure turf_owner role assignment
--
-- IMPORTANT:
-- Review the migration and confirm the target Supabase project
-- before applying it to the database.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Application status
-- ------------------------------------------------------------

CREATE TYPE public.owner_application_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

-- ------------------------------------------------------------
-- 2. Owner applications
-- ------------------------------------------------------------

CREATE TABLE public.owner_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    business_name text NOT NULL
        CHECK (
            char_length(trim(business_name)) BETWEEN 2 AND 150
        ),

    phone text NOT NULL
        CHECK (
            char_length(trim(phone)) BETWEEN 7 AND 25
        ),

    county text NOT NULL
        CHECK (
            char_length(trim(county)) BETWEEN 2 AND 100
        ),

    town text NOT NULL
        CHECK (
            char_length(trim(town)) BETWEEN 2 AND 100
        ),

    address text NOT NULL DEFAULT ''
        CHECK (char_length(address) <= 500),

    experience text NOT NULL DEFAULT ''
        CHECK (char_length(experience) <= 2000),

    message text NOT NULL DEFAULT ''
        CHECK (char_length(message) <= 3000),

    status public.owner_application_status
        NOT NULL DEFAULT 'pending',

    rejection_reason text,

    reviewed_by uuid
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    reviewed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT owner_application_review_consistency
        CHECK (
            (
                status = 'pending'
                AND reviewed_at IS NULL
            )
            OR
            (
                status IN ('approved', 'rejected')
                AND reviewed_at IS NOT NULL
            )
        )
);

CREATE INDEX owner_applications_user_idx
    ON public.owner_applications (user_id, created_at DESC);

CREATE INDEX owner_applications_status_idx
    ON public.owner_applications (status, created_at ASC);

-- A user may have application history, but cannot have
-- multiple pending applications simultaneously.

CREATE UNIQUE INDEX owner_applications_one_pending_per_user
    ON public.owner_applications (user_id)
    WHERE status = 'pending';

-- ------------------------------------------------------------
-- 3. Enable Row Level Security
-- ------------------------------------------------------------

ALTER TABLE public.owner_applications
    ENABLE ROW LEVEL SECURITY;

-- Applicants can see their own applications.
-- Superadmins can see all applications.

CREATE POLICY "Applicants and superadmins can view applications"
ON public.owner_applications
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_superadmin())
);

-- Only footballers can submit their own pending application.
-- Applicants cannot choose their own approval status or reviewer.

CREATE POLICY "Footballers can submit pending owner applications"
ON public.owner_applications
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND rejection_reason IS NULL
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'footballer'
    )
);

-- No direct UPDATE or DELETE policies are created.
-- Application decisions must go through the trusted function.

-- ------------------------------------------------------------
-- 4. Harden the existing profile update trigger
-- ------------------------------------------------------------

-- Normal users must not change their profile identity or role.
--
-- A trusted SECURITY DEFINER function owned by postgres may
-- perform an administrative role change. The function itself
-- must independently authenticate and authorize the caller.
--
-- This preserves the existing trigger instead of disabling it.

CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION
            'Profile identity changes are not permitted';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- A role change is permitted only inside a trusted
        -- database-owner function AND for an authenticated
        -- superadmin. Merely running as postgres is insufficient.
        IF current_user <> 'postgres'
           OR auth.uid() IS NULL
           OR NOT public.is_superadmin() THEN
            RAISE EXCEPTION
                'Role changes require authenticated superadmin approval'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    NEW.updated_at := now();

    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 5. Secure application review function
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_owner_application(
    p_application_id uuid,
    p_decision text,
    p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id uuid;
    v_application public.owner_applications%ROWTYPE;
BEGIN
    -- Authenticate the caller.
    v_admin_id := auth.uid();

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = '42501';
    END IF;

    -- Verify the caller's current database role.
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Superadmin access required'
            USING ERRCODE = '42501';
    END IF;

    -- Validate the decision.
    IF p_decision IS NULL
       OR p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION
            'Decision must be approved or rejected';
    END IF;

    IF p_decision = 'rejected'
       AND char_length(trim(coalesce(p_rejection_reason, ''))) = 0 THEN
        RAISE EXCEPTION
            'A rejection reason is required';
    END IF;

    IF char_length(coalesce(p_rejection_reason, '')) > 1000 THEN
        RAISE EXCEPTION
            'Rejection reason cannot exceed 1000 characters';
    END IF;

    -- Lock the application so simultaneous reviews cannot
    -- approve or reject it inconsistently.
    SELECT *
    INTO v_application
    FROM public.owner_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Owner application not found';
    END IF;

    IF v_application.status <> 'pending' THEN
        RAISE EXCEPTION
            'This application has already been reviewed';
    END IF;

    -- Approval and role promotion occur in the same transaction.
    IF p_decision = 'approved' THEN

        UPDATE public.profiles
        SET role = 'turf_owner'::public.account_role,
            updated_at = now()
        WHERE id = v_application.user_id
          AND role = 'footballer'::public.account_role;

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'Applicant no longer has the footballer role';
        END IF;

        UPDATE public.owner_applications
        SET status = 'approved',
            reviewed_by = v_admin_id,
            reviewed_at = now(),
            rejection_reason = NULL,
            updated_at = now()
        WHERE id = p_application_id;

    ELSE

        UPDATE public.owner_applications
        SET status = 'rejected',
            reviewed_by = v_admin_id,
            reviewed_at = now(),
            rejection_reason = trim(p_rejection_reason),
            updated_at = now()
        WHERE id = p_application_id;

    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', p_application_id,
        'decision', p_decision
    );
END;
$$;

-- Explicitly assign the trusted function owner.
ALTER FUNCTION public.review_owner_application(
    uuid,
    text,
    text
) OWNER TO postgres;

-- Prevent anonymous and PUBLIC callers from executing the RPC.
REVOKE ALL ON FUNCTION public.review_owner_application(
    uuid,
    text,
    text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.review_owner_application(
    uuid,
    text,
    text
) TO authenticated;

-- ------------------------------------------------------------
-- 6. Table privileges
-- ------------------------------------------------------------

REVOKE ALL ON TABLE public.owner_applications
    FROM PUBLIC, anon;

GRANT SELECT, INSERT
    ON TABLE public.owner_applications
    TO authenticated;

-- ------------------------------------------------------------
-- 7. Documentation
-- ------------------------------------------------------------

COMMENT ON TABLE public.owner_applications IS
    'TURFF turf-owner applications. Decisions are made through the protected superadmin review function.';

COMMENT ON FUNCTION public.review_owner_application(
    uuid,
    text,
    text
) IS
    'Authorizes superadmins to approve or reject owner applications. Approval assigns the turf_owner role atomically.';

COMMIT;
