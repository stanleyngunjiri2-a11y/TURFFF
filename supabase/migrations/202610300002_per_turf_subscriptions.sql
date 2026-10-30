-- ============================================================
-- TURFF: PER-TURF SUBSCRIPTIONS AND PAYMENT VERIFICATION
-- Migration: 202610300002
--
-- Business rules:
-- 1. Each turf has its own subscription history.
-- 2. Admin approval starts a five-day free trial.
-- 3. Standard costs KES 999 per month.
-- 4. Professional costs KES 1,999 per month.
-- 5. Owners submit M-Pesa transaction references.
-- 6. Only superadmins can verify and activate payments.
-- 7. Bookings require an active subscription for that turf.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 0. REMOVE DEPENDENCIES BEFORE CHANGING THE SCHEMA
-- ------------------------------------------------------------

-- These policies depend on the old owner_id column and helper.
DROP POLICY IF EXISTS
    "Owners and admins can manage subscriptions"
    ON public.subscriptions;

DROP POLICY IF EXISTS
    "Subscribed owners can receive booking requests"
    ON public.bookings;

-- Remove the old owner-based helper before creating its turf-based version.
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid);


-- ------------------------------------------------------------
-- 1. CHANGE SUBSCRIPTIONS FROM OWNER-BASED TO TURF-BASED
-- ------------------------------------------------------------

ALTER TABLE public.subscriptions
    ADD COLUMN turf_id uuid
    REFERENCES public.turfs(id)
    ON DELETE RESTRICT;

-- The existing database has zero subscription records.
-- Remove the old owner relationship and require a turf.

DROP INDEX IF EXISTS public.subscriptions_owner_status_idx;

ALTER TABLE public.subscriptions
    DROP COLUMN owner_id;

ALTER TABLE public.subscriptions
    ALTER COLUMN turf_id SET NOT NULL;

CREATE INDEX subscriptions_turf_status_idx
    ON public.subscriptions (turf_id, status, ends_at);

-- Prevent duplicate free trials for the same turf.
CREATE UNIQUE INDEX subscriptions_one_trial_per_turf_idx
    ON public.subscriptions (turf_id)
    WHERE plan_name = 'Free Trial';

-- Prevent reuse of an M-Pesa transaction reference.
CREATE UNIQUE INDEX subscriptions_payment_reference_unique_idx
    ON public.subscriptions (payment_reference)
    WHERE payment_reference IS NOT NULL;


-- ------------------------------------------------------------
-- 2. ONE ACTIVE SUBSCRIPTION PER TURF
-- ------------------------------------------------------------

CREATE UNIQUE INDEX subscriptions_one_active_per_turf_idx
    ON public.subscriptions (turf_id)
    WHERE status = 'active';

-- Prevent multiple simultaneous paid subscription requests per turf.
CREATE UNIQUE INDEX subscriptions_one_pending_paid_per_turf_idx
    ON public.subscriptions (turf_id)
    WHERE status = 'pending'
      AND plan_name IN ('Standard', 'Professional');


-- ------------------------------------------------------------
-- 3. UPDATE ACTIVE SUBSCRIPTION HELPER
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_active_subscription(
    p_turf_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.turf_id = p_turf_id
          AND s.status = 'active'
          AND (
              s.starts_at IS NULL
              OR s.starts_at <= now()
          )
          AND (
              s.ends_at IS NULL
              OR s.ends_at > now()
          )
    );
$$;

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid)
    TO authenticated;


-- ------------------------------------------------------------
-- 4. UPDATE SUBSCRIPTION READ ACCESS
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
    "Owners and admins can manage subscriptions"
    ON public.subscriptions;

CREATE POLICY "Turf owners and admins can view subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.turfs t
        WHERE t.id = subscriptions.turf_id
          AND t.owner_id = (SELECT auth.uid())
    )
    OR (SELECT public.is_superadmin())
);


-- ------------------------------------------------------------
-- 5. UPDATE BOOKING SECURITY
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
    "Subscribed owners can receive booking requests"
    ON public.bookings;

CREATE POLICY "Subscribed turfs can receive booking requests"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
    customer_id = (SELECT auth.uid())
    AND status = 'pending'
    AND payment_status = 'unpaid'
    AND EXISTS (
        SELECT 1
        FROM public.turfs t
        WHERE t.id = turf_id
          AND t.review_status = 'approved'
          AND t.is_active = true
          AND public.has_active_subscription(t.id)
    )
);


-- ------------------------------------------------------------
-- 6. ADMIN TURF APPROVAL FUNCTION
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_turf_listing(
    p_turf_id uuid,
    p_decision text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id uuid;
    v_turf public.turfs%ROWTYPE;
BEGIN
    v_admin_id := auth.uid();

    IF v_admin_id IS NULL
       OR NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Only administrators can review turf listings.';
    END IF;

    IF p_decision IS NULL
       OR p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid review decision.';
    END IF;

    SELECT *
    INTO v_turf
    FROM public.turfs
    WHERE id = p_turf_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turf listing not found.';
    END IF;

    IF v_turf.review_status <> 'pending' THEN
        RAISE EXCEPTION 'This turf listing has already been reviewed.';
    END IF;

    UPDATE public.turfs
    SET
        review_status = p_decision::public.turf_review_status,
        is_active = (p_decision = 'approved'),
        updated_at = now()
    WHERE id = p_turf_id;

    IF p_decision = 'approved' THEN

        INSERT INTO public.subscriptions (
            turf_id,
            plan_name,
            amount,
            currency,
            status,
            starts_at,
            ends_at
        )
        VALUES (
            p_turf_id,
            'Free Trial',
            0,
            'KES',
            'active',
            now(),
            now() + interval '5 days'
        );

    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_turf_listing(uuid, text)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.review_turf_listing(uuid, text)
    TO authenticated;


-- ------------------------------------------------------------
-- 7. OWNER REQUESTS A PAID SUBSCRIPTION
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.request_turf_subscription(
    p_turf_id uuid,
    p_plan_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_amount numeric(10,2);
    v_subscription_id uuid;
    v_turf public.turfs%ROWTYPE;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be signed in.';
    END IF;

    IF p_plan_name = 'Standard' THEN
        v_amount := 999;
    ELSIF p_plan_name = 'Professional' THEN
        v_amount := 1999;
    ELSE
        RAISE EXCEPTION 'Invalid subscription plan.';
    END IF;

    -- Lock this turf so simultaneous requests cannot bypass
    -- the pending-subscription check.
    SELECT *
    INTO v_turf
    FROM public.turfs
    WHERE id = p_turf_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turf listing not found.';
    END IF;

    IF v_turf.owner_id <> v_user_id
       OR v_turf.review_status <> 'approved'
       OR v_turf.is_active <> true THEN
        RAISE EXCEPTION 'You cannot subscribe to this turf.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.turf_id = p_turf_id
          AND s.status = 'active'
          AND s.plan_name IN ('Standard', 'Professional')
          AND s.ends_at > now()
    ) THEN
        RAISE EXCEPTION 'This turf already has an active paid subscription.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.turf_id = p_turf_id
          AND s.status = 'pending'
    ) THEN
        RAISE EXCEPTION 'A subscription payment request is already pending.';
    END IF;

    INSERT INTO public.subscriptions (
        turf_id,
        plan_name,
        amount,
        currency,
        status
    )
    VALUES (
        p_turf_id,
        p_plan_name,
        v_amount,
        'KES',
        'pending'
    )
    RETURNING id INTO v_subscription_id;

    RETURN v_subscription_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_turf_subscription(uuid, text)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.request_turf_subscription(uuid, text)
    TO authenticated;


-- ------------------------------------------------------------
-- 8. OWNER SUBMITS M-PESA TRANSACTION CODE
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_subscription_payment(
    p_subscription_id uuid,
    p_payment_reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_reference text;
BEGIN
    v_user_id := auth.uid();
    v_reference := upper(trim(p_payment_reference));

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'You must be signed in.';
    END IF;

    IF v_reference IS NULL
       OR length(v_reference) < 6
       OR length(v_reference) > 40 THEN
        RAISE EXCEPTION 'Enter a valid M-Pesa transaction code.';
    END IF;

    UPDATE public.subscriptions s
    SET payment_reference = v_reference
    FROM public.turfs t
    WHERE s.id = p_subscription_id
      AND s.turf_id = t.id
      AND t.owner_id = v_user_id
      AND s.status = 'pending'
      AND s.plan_name IN ('Standard', 'Professional')
      AND s.payment_reference IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription request not found or already submitted.';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_subscription_payment(uuid, text)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_subscription_payment(uuid, text)
    TO authenticated;


-- ------------------------------------------------------------
-- 9. ADMIN VERIFIES PAYMENT AND ACTIVATES SUBSCRIPTION
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_subscription_payment(
    p_subscription_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id uuid;
    v_subscription public.subscriptions%ROWTYPE;
BEGIN
    v_admin_id := auth.uid();

    IF v_admin_id IS NULL
       OR NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Only administrators can verify payments.';
    END IF;

    SELECT *
    INTO v_subscription
    FROM public.subscriptions
    WHERE id = p_subscription_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription not found.';
    END IF;

    IF v_subscription.status <> 'pending'
       OR v_subscription.payment_reference IS NULL THEN
        RAISE EXCEPTION 'This subscription has no verifiable payment.';
    END IF;

    IF v_subscription.plan_name NOT IN ('Standard', 'Professional') THEN
        RAISE EXCEPTION 'This is not a paid subscription.';
    END IF;

    -- Never activate a subscription for a turf that is no longer
    -- approved and active.
    IF NOT EXISTS (
        SELECT 1
        FROM public.turfs t
        WHERE t.id = v_subscription.turf_id
          AND t.review_status = 'approved'
          AND t.is_active = true
    ) THEN
        RAISE EXCEPTION 'This turf is not approved and active.';
    END IF;

    IF (
        (v_subscription.plan_name = 'Standard'
         AND v_subscription.amount <> 999)
        OR
        (v_subscription.plan_name = 'Professional'
         AND v_subscription.amount <> 1999)
    ) THEN
        RAISE EXCEPTION 'Subscription amount does not match the selected plan.';
    END IF;

    -- End any currently active trial or subscription for this turf.
    UPDATE public.subscriptions
    SET
        status = 'expired',
        ends_at = now()
    WHERE turf_id = v_subscription.turf_id
      AND status = 'active';

    -- Activate the verified paid subscription for one month.
    UPDATE public.subscriptions
    SET
        status = 'active',
        starts_at = now(),
        ends_at = now() + interval '1 month',
        verified_by = v_admin_id,
        verified_at = now()
    WHERE id = p_subscription_id;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_subscription_payment(uuid)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.verify_subscription_payment(uuid)
    TO authenticated;


-- ------------------------------------------------------------
-- 10. FINISH
-- ------------------------------------------------------------

COMMENT ON TABLE public.subscriptions IS
'Subscription history for individual TURFF turf listings.';

COMMENT ON COLUMN public.subscriptions.turf_id IS
'The individual turf covered by this subscription.';

COMMIT;
