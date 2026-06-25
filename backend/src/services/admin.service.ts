import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export class AdminService {
  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Total students
    const { count: totalStudents } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact' })
      .eq('role', 'student')
      .eq('is_active', true);

    // Today's attendance
    const { count: todayAttendance } = await supabaseAdmin
      .from('attendance_records')
      .select('id', { count: 'exact' })
      .gte('marked_at', todayStart)
      .lt('marked_at', todayEnd);

    // Active devices
    const { count: activeDevices } = await supabaseAdmin
      .from('devices')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    // Active sessions
    const { count: activeSessions } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // Recent scans (last 10)
    const { data: recentScans } = await supabaseAdmin
      .from('attendance_records')
      .select('*, users!attendance_records_student_id_fkey(name, email, roll_number), attendance_sessions(title)')
      .order('marked_at', { ascending: false })
      .limit(10);

    // Weekly stats (last 7 days)
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

      const { count } = await supabaseAdmin
        .from('attendance_records')
        .select('id', { count: 'exact' })
        .gte('marked_at', dayStart)
        .lt('marked_at', dayEnd);

      weeklyStats.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dayStart.split('T')[0],
        count: count || 0,
      });
    }

    // Monthly stats (last 6 months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

      const { count } = await supabaseAdmin
        .from('attendance_records')
        .select('id', { count: 'exact' })
        .gte('marked_at', monthStart)
        .lt('marked_at', monthEnd);

      monthlyStats.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: count || 0,
      });
    }

    // Calculate attendance rate
    const totalPossible = (totalStudents || 0) > 0 ? (totalStudents || 1) : 1;
    const attendanceRate = todayAttendance ? Math.round(((todayAttendance || 0) / totalPossible) * 100) : 0;

    return {
      totalStudents: totalStudents || 0,
      todayAttendance: todayAttendance || 0,
      activeDevices: activeDevices || 0,
      activeSessions: activeSessions || 0,
      attendanceRate: Math.min(attendanceRate, 100),
      recentScans: recentScans || [],
      weeklyStats,
      monthlyStats,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 20, role?: string, search?: string) {
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, roll_number, phone, is_active, created_at', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new AppError('Failed to fetch users', 500);
    }

    return {
      users: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async updateUserRole(userId: string, role: string, isActive?: boolean, performedBy?: string) {
    const updateData: Record<string, unknown> = { role };
    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to update user', 500);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'user_role_updated',
      entity_type: 'user',
      entity_id: userId,
      details: updateData,
      performed_by: performedBy,
    });

    return data;
  }

  async deleteUser(userId: string, performedBy: string) {
    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      throw new AppError('Failed to delete user', 500);
    }

    await supabaseAdmin.from('audit_logs').insert({
      action: 'user_deleted',
      entity_type: 'user',
      entity_id: userId,
      performed_by: performedBy,
    });

    return { message: 'User deleted' };
  }

  async getAuditLogs(page: number = 1, limit: number = 50, action?: string) {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*, users!audit_logs_performed_by_fkey(name, email)', { count: 'exact' });

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new AppError('Failed to fetch audit logs', 500);
    }

    return {
      logs: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }
}

export const adminService = new AdminService();
