-- init.sql: create schema and seed data
-- Run by psql or automatically by backend on startup.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile varchar(20) NOT NULL,
  email text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL, -- plaintext for demo only
  role text NOT NULL, -- 'admin' or 'parent' or 'staff'
  parent_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no varchar(50) UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  class text,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  biometric_id text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reason_codes (
  code varchar(10) PRIMARY KEY,
  label text NOT NULL,
  description text,
  requires_document boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  public_key text,
  last_seen timestamptz,
  status varchar(20) DEFAULT 'offline'
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  event_type varchar(20) NOT NULL,
  timestamp timestamptz NOT NULL,
  device_id uuid REFERENCES devices(id),
  reason_code varchar(10) REFERENCES reason_codes(code),
  authoriser_id uuid,
  source varchar(20) NOT NULL,
  note text,
  synced boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  request_type varchar(50),
  requested_by uuid,
  approved_by uuid,
  status varchar(20) DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit_log (
  id serial PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  ip inet,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Seed reason codes
INSERT INTO reason_codes (code, label, description, requires_document) VALUES
('SICK','Sick / Medical','Student left due to illness or medical appointment', false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO reason_codes (code, label, description, requires_document) VALUES
('APPT','Medical Appointment','Scheduled or unscheduled medical appointment', false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO reason_codes (code, label, description, requires_document) VALUES
('SPORTS','Sports/Practice','Left for external sports practice or event', false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO reason_codes (code, label, description, requires_document) VALUES
('TRIP','School Trip','Leaving as part of a school-organized trip', false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO reason_codes (code, label, description, requires_document) VALUES
('EARLY','Early Leave','Parent-requested early leave', false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO reason_codes (code, label, description, requires_document) VALUES
('CLOSED','School Closed','School closure or public holiday', false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO reason_codes (code, label, description, requires_document) VALUES
('OTHER','Other','Other reasons (note required)', false)
ON CONFLICT (code) DO NOTHING;

-- Demo parent and user accounts (plaintext passwords for demo only)
INSERT INTO parents (id, name, mobile, email, verified) VALUES
(gen_random_uuid(), 'Parent Demo', '+254700000002', 'parent@moiforcesacademy.ac.ke', true)
ON CONFLICT DO NOTHING;

-- Create parent user account
INSERT INTO users (id, email, password, role, parent_id)
SELECT gen_random_uuid(), 'parent@moiforcesacademy.ac.ke', 'Parent@123', 'parent', p.id FROM parents p WHERE p.email = 'parent@moiforcesacademy.ac.ke' LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Admin user
INSERT INTO users (id, email, password, role)
SELECT gen_random_uuid(), 'admin@moiforcesacademy.ac.ke', 'Admin@123', 'admin' 
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@moiforcesacademy.ac.ke');

-- Demo student linked to parent
INSERT INTO students (id, reg_no, first_name, last_name, class, parent_id) 
SELECT gen_random_uuid(), 'MOIFA-2025-001', 'John', 'Doe', 'Grade 6 - A', p.id FROM parents p WHERE p.email = 'parent@moiforcesacademy.ac.ke' LIMIT 1
ON CONFLICT (reg_no) DO NOTHING;

-- Demo event sample (arrival + departure)
INSERT INTO events (id, student_id, event_type, timestamp, source, note)
SELECT gen_random_uuid(), s.id, 'ARRIVAL', now() - interval '6 hours', 'BIOMETRIC', 'Auto-seed arrival' FROM students s WHERE s.reg_no = 'MOIFA-2025-001' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO events (id, student_id, event_type, timestamp, reason_code, source, note)
SELECT gen_random_uuid(), s.id, 'DEPARTURE', now() - interval '3 hours', 'SICK', 'BIOMETRIC', 'Auto-seed departure' FROM students s WHERE s.reg_no = 'MOIFA-2025-001' LIMIT 1
ON CONFLICT DO NOTHING;
