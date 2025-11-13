import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.key
);

// Database types
export interface Clinic {
  id: number;
  name: string;
  linechannelid: string;
  created_at?: string;
}

export interface Employee {
  id: number;
  clinic_id: number;
  line_user_id: string;
  name: string;
  employee_number?: string;
  role?: string;
  is_active: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  check_in_time: string;
  check_out_time?: string;
  location?: string;
  notes?: string;
  created_at?: string;
}
