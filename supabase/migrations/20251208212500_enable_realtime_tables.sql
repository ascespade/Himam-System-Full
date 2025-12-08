-- Enable Realtime for Doctor Dashboard Tables
-- This migration enables real-time updates for tables used in the doctor dashboard

-- Enable Realtime for appointments (critical for dashboard)
-- Only add if not already in publication (check first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;
END $$;

-- Enable Realtime for reception_queue (for queue updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reception_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reception_queue;
  END IF;
END $$;

-- Enable Realtime for clinic_settings (for clinic status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'clinic_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE clinic_settings;
  END IF;
END $$;

-- Enable Realtime for sessions (for session updates)
-- Note: sessions is already in publication, but keeping for completeness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
  END IF;
END $$;

-- Enable Realtime for doctor_patient_relationships (for patient count)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'doctor_patient_relationships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE doctor_patient_relationships;
  END IF;
END $$;

-- Enable Realtime for treatment_plans (for plan updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'treatment_plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE treatment_plans;
  END IF;
END $$;

