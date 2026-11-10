-- Helper functions for common operations

-- Function to check device limit (max 2 devices per user)
CREATE OR REPLACE FUNCTION check_device_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM registered_devices WHERE user_id = NEW.user_id) >= 2 THEN
    RAISE EXCEPTION 'Device limit reached. Maximum 2 devices allowed per user.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_device_limit
  BEFORE INSERT ON registered_devices
  FOR EACH ROW
  EXECUTE FUNCTION check_device_limit();

-- Function to handle redeem code usage with transaction safety
CREATE OR REPLACE FUNCTION redeem_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_code_record redeem_codes%ROWTYPE;
  v_enrollment_id UUID;
  v_course_record courses%ROWTYPE;
BEGIN
  -- Lock the redeem code row for update
  SELECT * INTO v_code_record
  FROM redeem_codes
  WHERE code = p_code
  FOR UPDATE;

  -- Validate code
  IF v_code_record.id IS NULL THEN
    RAISE EXCEPTION 'Invalid redeem code';
  END IF;

  IF NOT v_code_record.is_active THEN
    RAISE EXCEPTION 'Redeem code is inactive';
  END IF;

  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < NOW() THEN
    RAISE EXCEPTION 'Redeem code has expired';
  END IF;

  IF v_code_record.current_uses >= v_code_record.max_uses THEN
    RAISE EXCEPTION 'Redeem code has reached maximum usage';
  END IF;

  -- Check if user already used this code
  IF EXISTS (
    SELECT 1 FROM redeem_code_usages
    WHERE redeem_code_id = v_code_record.id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'You have already used this redeem code';
  END IF;

  -- Get course details
  SELECT * INTO v_course_record
  FROM courses
  WHERE id = v_code_record.course_id;

  -- Create or update enrollment
  INSERT INTO enrollments (user_id, course_id, status, enrolled_at, expires_at)
  VALUES (
    p_user_id,
    v_code_record.course_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 day' * v_course_record.access_duration_days
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    status = 'active',
    enrolled_at = NOW(),
    expires_at = NOW() + INTERVAL '1 day' * v_course_record.access_duration_days
  RETURNING id INTO v_enrollment_id;

  -- Record code usage
  INSERT INTO redeem_code_usages (redeem_code_id, user_id, enrollment_id)
  VALUES (v_code_record.id, p_user_id, v_enrollment_id);

  -- Update code usage count
  UPDATE redeem_codes
  SET current_uses = current_uses + 1
  WHERE id = v_code_record.id;

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve manual payment
CREATE OR REPLACE FUNCTION approve_manual_payment(
  p_payment_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_payment_record manual_payments%ROWTYPE;
  v_course_record courses%ROWTYPE;
  v_enrollment_id UUID;
BEGIN
  -- Get payment record
  SELECT * INTO v_payment_record
  FROM manual_payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF v_payment_record.id IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment_record.status != 'pending' THEN
    RAISE EXCEPTION 'Payment has already been reviewed';
  END IF;

  -- Get course details
  SELECT * INTO v_course_record
  FROM courses
  WHERE id = v_payment_record.course_id;

  -- Create or update enrollment
  INSERT INTO enrollments (user_id, course_id, status, enrolled_at, expires_at)
  VALUES (
    v_payment_record.user_id,
    v_payment_record.course_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 day' * v_course_record.access_duration_days
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    status = 'active',
    enrolled_at = NOW(),
    expires_at = NOW() + INTERVAL '1 day' * v_course_record.access_duration_days
  RETURNING id INTO v_enrollment_id;

  -- Update payment record
  UPDATE manual_payments
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_admin_id,
    admin_notes = p_admin_notes,
    enrollment_id = v_enrollment_id
  WHERE id = p_payment_id;

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update expired enrollments
CREATE OR REPLACE FUNCTION check_expired_enrollments()
RETURNS void AS $$
BEGIN
  UPDATE enrollments
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job (requires pg_cron extension, or run via application)
-- This is a reference implementation - actual scheduling should be done via application or pg_cron
COMMENT ON FUNCTION check_expired_enrollments IS
  'Should be run periodically (e.g., daily) to mark expired enrollments';

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  VALUES (
    p_admin_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
