import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export class StudentService {
  async getAll(page: number = 1, limit: number = 20, search?: string) {
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, roll_number, phone, is_active, created_at', { count: 'exact' })
      .eq('role', 'student');

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,roll_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new AppError('Failed to fetch students', 500);
    }

    return {
      students: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getById(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, roll_number, phone, avatar_url, is_active, created_at')
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (error) {
      throw new AppError('Student not found', 404);
    }

    return data;
  }

  async update(studentId: string, input: { name?: string; phone?: string; roll_number?: string }) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(input)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update student', 500);
    }

    return data;
  }

  async getStats(studentId: string) {
    // Total completed sessions
    const { count: totalSessions } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id', { count: 'exact' })
      .eq('status', 'completed');

    // Student's attendance records
    const { data: records } = await supabaseAdmin
      .from('attendance_records')
      .select('status, marked_at, attendance_sessions(title, start_time)')
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false });

    const attended = records?.length || 0;
    const present = records?.filter(r => r.status === 'present').length || 0;
    const late = records?.filter(r => r.status === 'late').length || 0;
    const absent = (totalSessions || 0) - attended;
    const percentage = totalSessions ? Math.round((attended / (totalSessions || 1)) * 100) : 0;

    // Calculate streak
    let streak = 0;
    if (records) {
      for (const record of records) {
        if (record.status === 'present' || record.status === 'late') {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      totalSessions: totalSessions || 0,
      attended,
      present,
      late,
      absent,
      attendancePercentage: percentage,
      streak,
      recentRecords: records?.slice(0, 10) || [],
    };
  }
}

export const studentService = new StudentService();
