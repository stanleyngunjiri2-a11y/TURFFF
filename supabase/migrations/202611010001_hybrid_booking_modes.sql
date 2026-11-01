BEGIN;

-- Add booking mode to individual turf listings.
-- Existing listings default to manual approval.

ALTER TABLE public.turfs
ADD COLUMN booking_mode text NOT NULL DEFAULT 'manual'
CHECK (booking_mode IN ('manual', 'instant'));

COMMENT ON COLUMN public.turfs.booking_mode IS
'manual requires owner approval; instant automatically approves available bookings.';

-- Replace the booking creation function with hybrid booking behaviour.

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
  v_booking_status public.booking_status;
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

  -- Pending manual requests and approved bookings both reserve a slot.
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

  -- Instant bookings are approved immediately.
  -- Manual bookings await owner approval.
  IF v_turf.booking_mode = 'instant' THEN
    v_booking_status := 'approved'::public.booking_status;
  ELSE
    v_booking_status := 'pending'::public.booking_status;
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
    v_booking_status,
    'unpaid'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- Retain restricted execution permissions.
REVOKE ALL ON FUNCTION public.create_booking_request(
  uuid, date, time, time, integer, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_booking_request(
  uuid, date, time, time, integer, text
) TO authenticated;

COMMIT;
