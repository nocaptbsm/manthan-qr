import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler';

export class AttendanceService {
  async markAttendance(token: string, userId: string, ipAddress?: string, userAgent?: string) {
    // 1. Validate the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('dynamic_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      throw new AppError('Invalid attendance token', 400);
    }

    // 2. Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new AppError('QR code has expired. Please scan the current QR code.', 410);
    }

    // 3. Check if token is already used
    if (tokenData.is_used) {
      throw new AppError('This QR code has already been used. Please scan the current QR code.', 410);
    }

    // 4. Verify session is active
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*')
      .eq('id', tokenData.session_id)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      throw new AppError('Attendance session is not active', 400);
    }

    // 5. Verify user is a student
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'student') {
      throw new AppError('Only students can mark attendance', 403);
    }

    // 6. Check for duplicate attendance
    const { data: existing } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('student_id', userId)
      .eq('session_id', tokenData.session_id)
      .single();

    if (existing) {
      throw new AppError('Attendance already marked for this session', 409);
    }

    // 7. Determine attendance status (present or late)
    const lateThreshold = session.late_threshold_minutes || 10;
    const sessionStart = new Date(session.start_time);
    const lateTime = new Date(sessionStart.getTime() + lateThreshold * 60 * 1000);
    const status = new Date() > lateTime ? 'late' : 'present';

    // 8. Mark attendance
    const { data: record, error: recordError } = await supabaseAdmin
      .from('attendance_records')
      .insert({
        student_id: userId,
        session_id: tokenData.session_id,
        device_id: tokenData.device_id,
        token_id: tokenData.id,
        status,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (recordError) {
      logger.error('Attendance marking error', { error: recordError.message });
      throw new AppError('Failed to mark attendance', 500);
    }

    // 9. Mark token as used
    await supabaseAdmin
      .from('dynamic_tokens')
      .update({ is_used: true, used_by: userId, used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // 10. Audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'attendance_marked',
      entity_type: 'attendance',
      entity_id: record.id,
      details: {
        student_name: user.name,
        session_title: session.title,
        status,
      },
      performed_by: userId,
      ip_address: ipAddress,
    });

    return {
      record,
      session: {
        id: session.id,
        title: session.title,
      },
      status,
      student_name: user.name,
    };
  }

  async getMyAttendance(userId: string, page: number = 1, limit: number = 20) {
    const { data, error, count } = await supabaseAdmin
      .from('attendance_records')
      .select('*, attendance_sessions(title, start_time, end_time), devices(device_name, location_name)', { count: 'exact' })
      .eq('student_id', userId)
      .order('marked_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new AppError('Failed to fetch attendance records', 500);
    }

    return {
      records: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getSessionAttendance(sessionId: string, page: number = 1, limit: number = 20) {
    const { data, error, count } = await supabaseAdmin
      .from('attendance_records')
      .select('*, users!attendance_records_student_id_fkey(name, email, roll_number)', { count: 'exact' })
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new AppError('Failed to fetch session attendance', 500);
    }

    return {
      records: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getStudentStats(studentId: string) {
    // Total sessions (all completed sessions)
    const { count: totalSessions } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id', { count: 'exact' })
      .eq('status', 'completed');

    // Attended sessions
    const { data: records, count: attended } = await supabaseAdmin
      .from('attendance_records')
      .select('status', { count: 'exact' })
      .eq('student_id', studentId);

    const lateCount = records?.filter(r => r.status === 'late').length || 0;
    const presentCount = (attended || 0) - lateCount;
    const absent = (totalSessions || 0) - (attended || 0);
    const percentage = totalSessions ? Math.round(((attended || 0) / totalSessions) * 100) : 0;

    return {
      totalSessions: totalSessions || 0,
      attended: attended || 0,
      present: presentCount,
      late: lateCount,
      absent,
      attendancePercentage: percentage,
    };
  }
}

export const attendanceService = new AttendanceService();
