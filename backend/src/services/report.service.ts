import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { Parser } from 'json2csv';

export class ReportService {
  async getStudentReport(studentId: string, startDate?: string, endDate?: string) {
    let query = supabaseAdmin
      .from('attendance_records')
      .select('*, attendance_sessions(title, start_time, end_time), devices(device_name, location_name)')
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false });

    if (startDate) query = query.gte('marked_at', startDate);
    if (endDate) query = query.lte('marked_at', endDate);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to generate student report', 500);

    // Get student info
    const { data: student } = await supabaseAdmin
      .from('users')
      .select('name, email, roll_number')
      .eq('id', studentId)
      .single();

    return { student, records: data || [] };
  }

  async getDailyReport(date: string) {
    const dayStart = new Date(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const { data: sessions } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*, devices(device_name, location_name)')
      .gte('start_time', dayStart.toISOString())
      .lt('start_time', dayEnd.toISOString())
      .order('start_time');

    const sessionsWithAttendance = [];
    for (const session of sessions || []) {
      const { data: records, count } = await supabaseAdmin
        .from('attendance_records')
        .select('*, users!attendance_records_student_id_fkey(name, email, roll_number)', { count: 'exact' })
        .eq('session_id', session.id);

      sessionsWithAttendance.push({
        ...session,
        records: records || [],
        attendance_count: count || 0,
      });
    }

    return { date, sessions: sessionsWithAttendance };
  }

  async getMonthlyReport(year: number, month: number) {
    const monthStart = new Date(year, month - 1, 1).toISOString();
    const monthEnd = new Date(year, month, 1).toISOString();

    const { data: records } = await supabaseAdmin
      .from('attendance_records')
      .select('student_id, status, marked_at, users!attendance_records_student_id_fkey(name, email, roll_number)')
      .gte('marked_at', monthStart)
      .lt('marked_at', monthEnd);

    // Aggregate by student
    const studentMap = new Map<string, {
      name: string;
      email: string;
      roll_number: string;
      present: number;
      late: number;
      total: number;
    }>();

    for (const record of records || []) {
      const user = record.users as unknown as { name: string; email: string; roll_number: string };
      if (!studentMap.has(record.student_id)) {
        studentMap.set(record.student_id, {
          name: user?.name || '',
          email: user?.email || '',
          roll_number: user?.roll_number || '',
          present: 0,
          late: 0,
          total: 0,
        });
      }
      const stats = studentMap.get(record.student_id)!;
      stats.total++;
      if (record.status === 'present') stats.present++;
      if (record.status === 'late') stats.late++;
    }

    const { count: totalSessions } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id', { count: 'exact' })
      .gte('start_time', monthStart)
      .lt('start_time', monthEnd)
      .in('status', ['completed', 'active']);

    return {
      year,
      month,
      totalSessions: totalSessions || 0,
      students: Array.from(studentMap.values()).map(s => ({
        ...s,
        percentage: totalSessions ? Math.round((s.total / (totalSessions || 1)) * 100) : 0,
      })),
    };
  }

  async getSessionReport(sessionId: string) {
    const { data: session } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*, devices(device_name, location_name)')
      .eq('id', sessionId)
      .single();

    if (!session) throw new AppError('Session not found', 404);

    const { data: records } = await supabaseAdmin
      .from('attendance_records')
      .select('*, users!attendance_records_student_id_fkey(name, email, roll_number)')
      .eq('session_id', sessionId)
      .order('marked_at');

    return { session, records: records || [] };
  }

  async getDeviceReport(deviceId: string, startDate?: string, endDate?: string) {
    const { data: device } = await supabaseAdmin
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (!device) throw new AppError('Device not found', 404);

    let query = supabaseAdmin
      .from('attendance_sessions')
      .select('*, attendance_records(count)')
      .eq('device_id', deviceId)
      .order('start_time', { ascending: false });

    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('start_time', endDate);

    const { data: sessions } = await query;

    return { device, sessions: sessions || [] };
  }

  // Export helpers
  toCSV(data: Record<string, unknown>[], fields?: string[]): string {
    try {
      const parser = new Parser({ fields: fields || undefined });
      return parser.parse(data);
    } catch {
      throw new AppError('Failed to generate CSV', 500);
    }
  }

  flattenRecords(records: Record<string, unknown>[]): Record<string, unknown>[] {
    return records.map(r => {
      const flat: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(r)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
            flat[`${key}_${subKey}`] = subValue;
          }
        } else {
          flat[key] = value;
        }
      }
      return flat;
    });
  }
}

export const reportService = new ReportService();
