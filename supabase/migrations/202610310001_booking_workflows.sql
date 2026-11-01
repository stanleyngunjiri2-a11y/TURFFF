BEGIN;

-- ============================================================
-- TURFF: SECURE BOOKING WORKFLOWS
-- NEW MIGRATION: 202610310001_booking_workflows.sql
-- ============================================================

-- Force all new booking requests through the validated function.
DROP POLICY IF EXISTS
  "Subscribed turfs can receive booking requests"
  ON public.bookings;

DROP POLICY IF EXISTS
  "Subscribed owners can receive booking requests"
  ON public.bookings;


-- ------------------------------------------------------------
-- 1. FOOTBALLER CREATES A BOOKING REQUEST
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_booking_request(
  p_turf_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_player_count integer DEFAULT NULL,
  p_customer_note text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_role public.account_role;
  v_turf public.turfs%ROWTYPE;
  v_booking_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must log in before making a booking.';
  END IF;

  SELECT role
  INTO v_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_role IS DISTINCT FROM 'footballer'::public.account_role THEN
    RAISE EXCEPTION 'Only footballer accounts can create booking requests.';
  END IF;

  IF p_turf_id IS NULL
     OR p_booking_date IS NULL
     OR p_start_time IS NULL
     OR p_end_time IS NULL THEN
    RAISE EXCEPTION 'Please provide all required booking details.';
  END IF;

  IF p_booking_date < (now() AT TIME ZONE 'Africa/Nairobi')::date THEN
    RAISE EXCEPTION 'You cannot book a date in the past.';
  END IF;

  IF p_booking_date = (now() AT TIME ZONE 'Africa/Nairobi')::date
     AND p_start_time <= (now() AT TIME ZONE 'Africa/Nairobi')::time THEN
    RAISE EXCEPTION 'The selected booking time has already passed.';
  END IF;

  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'The booking end time must be after its start time.';
  END IF;

  IF p_player_count IS NOT NULL AND p_player_count <= 0 THEN
    RAISE EXCEPTION 'Player count must be greater than zero.';
  END IF;

  IF length(coalesce(p_customer_note, '')) > 1000 THEN
    RAISE EXCEPTION 'Your booking note is too long.';
  END IF;

  SELECT *
  INTO v_turf
  FROM public.turfs
  WHERE id = p_turf_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected turf could not be found.';
  END IF;

  IF v_turf.owner_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot book your own turf.';
  END IF;

  IF v_turf.review_status <> 'approved' OR NOT v_turf.is_active THEN
    RAISE EXCEPTION 'This turf is not currently accepting bookings.';
  END IF;

  IF NOT public.has_active_subscription(v_turf.id) THEN
    RAISE EXCEPTION 'This turf does not currently have an active subscription.';
  END IF;

  IF v_turf.opening_time IS NOT NULL
     AND p_start_time < v_turf.opening_time THEN
    RAISE EXCEPTION 'The selected time is before this turf opens.';
  END IF;

  IF v_turf.closing_time IS NOT NULL
     AND p_end_time > v_turf.closing_time THEN
    RAISE EXCEPTION 'The selected time is after this turf closes.';
  END IF;

  IF v_turf.capacity IS NOT NULL
     AND p_player_count IS NOT NULL
     AND p_player_count > v_turf.capacity THEN
    RAISE EXCEPTION 'The number of players exceeds this turf capacity.';
  END IF;

  -- Serialize booking checks for this turf and date.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_turf_id::text || ':' || p_booking_date::text,
      0
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.turf_id = p_turf_id
      AND b.booking_date = p_booking_date
      AND b.status IN ('pending', 'approved')
      AND b.start_time < p_end_time
      AND b.end_time > p_start_time
  ) THEN
    RAISE EXCEPTION 'This time slot already has a pending or approved booking.';
  END IF;

  INSERT INTO public.bookings (
    turf_id,
    customer_id,
    booking_date,
    start_time,
    end_time,
    player_count,
    customer_note,
    status,
    payment_status
  )
  VALUES (
    p_turf_id,
    v_user_id,
    p_booking_date,
    p_start_time,
    p_end_time,
    p_player_count,
    coalesce(p_customer_note, ''),
    'pending',
    'unpaid'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;


-- ------------------------------------------------------------
-- 2. OWNER APPROVES OR REJECTS A BOOKING
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_booking_request(
  p_booking_id uuid,
  p_decision text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_booking public.bookings%ROWTYPE;
  v_turf public.turfs%ROWTYPE;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must log in.';
  END IF;

  IF p_decision IS NULL OR p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid booking decision.';
  END IF;

  SELECT b.*
  INTO v_booking
  FROM public.bookings b
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found.';
  END IF;

  SELECT *
  INTO v_turf
  FROM public.turfs
  WHERE id = v_booking.turf_id
  FOR UPDATE;

  IF v_turf.owner_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'You are not authorized to manage this booking.';
  END IF;

  IF v_booking.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending booking requests can be reviewed.';
  END IF;

  IF p_decision = 'approved' THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        v_booking.turf_id::text || ':' || v_booking.booking_date::text,
        0
      )
    );

    IF v_turf.review_status <> 'approved'
       OR NOT v_turf.is_active
       OR NOT public.has_active_subscription(v_turf.id) THEN
      RAISE EXCEPTION 'This turf cannot accept bookings without an active subscription.';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.turf_id = v_booking.turf_id
        AND b.booking_date = v_booking.booking_date
        AND b.id <> v_booking.id
        AND b.status = 'approved'
        AND b.start_time < v_booking.end_time
        AND b.end_time > v_booking.start_time
    ) THEN
      RAISE EXCEPTION 'Another booking has already been approved for this time slot.';
    END IF;
  END IF;

  UPDATE public.bookings
  SET
    status = p_decision::public.booking_status,
    updated_at = now()
  WHERE id = p_booking_id;
END;
$$;


-- ------------------------------------------------------------
-- 3. CUSTOMER SUBMITS BOOKING PAYMENT REFERENCE
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_booking_payment(
  p_booking_id uuid,
  p_payment_reference text,
  p_payment_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_booking public.bookings%ROWTYPE;
  v_reference text;
BEGIN
  v_user_id := auth.uid();
  v_reference := upper(trim(coalesce(p_payment_reference, '')));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must log in.';
  END IF;

  IF length(v_reference) < 6 OR length(v_reference) > 30 THEN
    RAISE EXCEPTION 'Enter a valid M-Pesa transaction reference.';
  END IF;

  IF length(coalesce(p_payment_note, '')) > 500 THEN
    RAISE EXCEPTION 'Payment note is too long.';
  END IF;

  SELECT *
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND OR v_booking.customer_id <> v_user_id THEN
    RAISE EXCEPTION 'Booking not found or access denied.';
  END IF;

  IF v_booking.status <> 'approved' THEN
    RAISE EXCEPTION 'Payment can only be submitted for an approved booking.';
  END IF;

  IF v_booking.payment_status NOT IN ('unpaid', 'rejected') THEN
    RAISE EXCEPTION 'This booking payment has already been submitted or verified.';
  END IF;

  UPDATE public.bookings
  SET
    payment_status = 'pending_verification',
    payment_reference = v_reference,
    payment_note = coalesce(p_payment_note, ''),
    owner_verified_at = NULL,
    updated_at = now()
  WHERE id = p_booking_id;
END;
$$;


-- ------------------------------------------------------------
-- 4. OWNER VERIFIES CUSTOMER PAYMENT
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_booking_payment(
  p_booking_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_booking public.bookings%ROWTYPE;
  v_owner_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must log in.';
  END IF;

  SELECT *
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  SELECT owner_id
  INTO v_owner_id
  FROM public.turfs
  WHERE id = v_booking.turf_id;

  IF v_owner_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Only the turf owner can verify this payment.';
  END IF;

  IF v_booking.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved bookings can have payments verified.';
  END IF;

  IF v_booking.payment_status <> 'pending_verification'
     OR v_booking.payment_reference IS NULL THEN
    RAISE EXCEPTION 'There is no payment awaiting verification.';
  END IF;

  UPDATE public.bookings
  SET
    payment_status = 'verified',
    owner_verified_at = now(),
    updated_at = now()
  WHERE id = p_booking_id;
END;
$$;


-- ------------------------------------------------------------
-- 5. OWNER MARKS AN APPROVED BOOKING AS COMPLETED
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_booking(
  p_booking_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_booking public.bookings%ROWTYPE;
  v_owner_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must log in.';
  END IF;

  SELECT *
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  SELECT owner_id
  INTO v_owner_id
  FROM public.turfs
  WHERE id = v_booking.turf_id;

  IF v_owner_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Only the turf owner can complete this booking.';
  END IF;

  IF v_booking.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved bookings can be completed.';
  END IF;

  IF v_booking.payment_status <> 'verified' THEN
    RAISE EXCEPTION 'Payment must be verified before completing this booking.';
  END IF;

  UPDATE public.bookings
  SET
    status = 'completed',
    updated_at = now()
  WHERE id = p_booking_id;
END;
$$;


-- ------------------------------------------------------------
-- 6. FUNCTION PERMISSIONS
-- ------------------------------------------------------------

REVOKE ALL ON FUNCTION public.create_booking_request(
  uuid, date, time, time, integer, text
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.review_booking_request(
  uuid, text
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.submit_booking_payment(
  uuid, text, text
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.verify_booking_payment(
  uuid
) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.complete_booking(
  uuid
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_booking_request(
  uuid, date, time, time, integer, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.review_booking_request(
  uuid, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.submit_booking_payment(
  uuid, text, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.verify_booking_payment(
  uuid
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.complete_booking(
  uuid
) TO authenticated;

COMMIT;
