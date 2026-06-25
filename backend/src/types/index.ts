// ============================================================================
// Shared TypeScript types for the backend
// ============================================================================

export type UserRole = 'super_admin' | 'admin' | 'student';
export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'late' | 'excused';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  roll_number: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  device_name: string;
  device_code: string;
  device_secret: string;
  location_name: string;
  description: string | null;
  is_active: boolean;
  last_heartbeat: string | null;
  firmware_version: string | null;
  ip_address: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  device_id: string;
  created_by: string;
  status: SessionStatus;
  late_threshold_minutes: number;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
}

export interface DynamicToken {
  id: string;
  token: string;
  device_id: string;
  session_id: string;
  expires_at: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  device_id: string;
  token_id: string | null;
  marked_at: string;
  status: AttendanceStatus;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  performed_by: string | null;
  ip_address: string | null;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  activeDevices: number;
  activeSessions: number;
  attendanceRate: number;
  recentScans: AttendanceRecord[];
  weeklyStats: { day: string; count: number }[];
  monthlyStats: { month: string; count: number }[];
}

export interface StudentStats {
  totalSessions: number;
  attended: number;
  absent: number;
  late: number;
  attendancePercentage: number;
  streak: number;
}
