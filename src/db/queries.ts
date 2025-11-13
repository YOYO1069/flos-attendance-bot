import { supabase, Clinic, Employee, AttendanceRecord } from './supabase.js';

/**
 * Get clinic by LINE channel ID
 */
export async function getClinicByChannelId(channelId: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('linechannelid', channelId)
    .single();

  if (error) {
    console.error('Error fetching clinic:', error);
    return null;
  }

  return data;
}

/**
 * Get employee by LINE user ID
 */
export async function getEmployeeByLineUserId(lineUserId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('line_user_id', lineUserId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching employee:', error);
    return null;
  }

  return data;
}

/**
 * Create new employee
 */
export async function createEmployee(
  clinicId: number,
  lineUserId: string,
  name: string
): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      clinic_id: clinicId,
      line_user_id: lineUserId,
      name: name,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating employee:', error);
    return null;
  }

  return data;
}

/**
 * Get today's attendance record for employee
 */
export async function getTodayAttendance(employeeId: number): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('check_in_time', `${today}T00:00:00`)
    .lte('check_in_time', `${today}T23:59:59`)
    .order('check_in_time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching attendance:', error);
    return null;
  }

  return data;
}

/**
 * Check in
 */
export async function checkIn(
  employeeId: number,
  location?: string
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .insert({
      employee_id: employeeId,
      check_in_time: new Date().toISOString(),
      location: location,
    })
    .select()
    .single();

  if (error) {
    console.error('Error checking in:', error);
    return null;
  }

  return data;
}

/**
 * Check out
 */
export async function checkOut(recordId: number): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      check_out_time: new Date().toISOString(),
    })
    .eq('id', recordId)
    .select()
    .single();

  if (error) {
    console.error('Error checking out:', error);
    return null;
  }

  return data;
}
