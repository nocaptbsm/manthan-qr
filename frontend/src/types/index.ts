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
  location_name: string;
  description: string | null;
  is_active: boolean;
  last_heartbeat: string | null;
  firmware_version: string | null;
  ip_address: string | null;
  created_at: string;
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
  devices?: { device_name: string; location_name: string };
  users?: { name: string };
  attendance_count?: number;
}

export interface DynamicToken {
  id: string;
  token: string;
  device_id: string;
  session_id: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  device_id: string;
  marked_at: string;
  status: AttendanceStatus;
  created_at: string;
  attendance_sessions?: { title: string; start_time: string; end_time: string };
  devices?: { device_name: string; location_name: string };
  users?: { name: string; email: string; roll_number: string };
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  performed_by: string | null;
  created_at: string;
  users?: { name: string; email: string };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: { field: string; message: string }[];
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
  weeklyStats: { day: string; date: string; count: number }[];
  monthlyStats: { month: string; count: number }[];
}

export interface StudentStats {
  totalSessions: number;
  attended: number;
  present: number;
  late: number;
  absent: number;
  attendancePercentage: number;
  streak: number;
  recentRecords: AttendanceRecord[];
}

export interface TokenResponse {
  has_active_session: boolean;
  token: string | null;
  qr_url: string | null;
  expires_at: string | null;
  session: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  } | null;
}
