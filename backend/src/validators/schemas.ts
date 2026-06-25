import { z } from 'zod';

// ============================================================================
// Auth Validators
// ============================================================================

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  role: z.enum(['student', 'admin']).default('student'),
  roll_number: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ============================================================================
// Device Validators
// ============================================================================

export const registerDeviceSchema = z.object({
  device_name: z.string().min(2).max(255),
  device_code: z.string().min(3).max(50).regex(/^[A-Z0-9\-]+$/, 'Device code must be uppercase alphanumeric with hyphens'),
  location_name: z.string().min(2).max(255),
  description: z.string().max(500).optional(),
  device_secret: z.string().min(8, 'Device secret must be at least 8 characters'),
});

export const deviceHeartbeatSchema = z.object({
  firmware_version: z.string().max(50).optional(),
  ip_address: z.string().max(45).optional(),
});

export const updateDeviceStatusSchema = z.object({
  is_active: z.boolean(),
});

// ============================================================================
// Session Validators
// ============================================================================

export const createSessionSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(500).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  device_id: z.string().uuid(),
  late_threshold_minutes: z.number().int().min(1).max(60).optional().default(10),
  max_attendees: z.number().int().min(1).optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(500).optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  late_threshold_minutes: z.number().int().min(1).max(60).optional(),
  max_attendees: z.number().int().min(1).optional().nullable(),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional(),
});

// ============================================================================
// Attendance Validators
// ============================================================================

export const markAttendanceSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// ============================================================================
// Student Validators
// ============================================================================

export const updateStudentSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional(),
  roll_number: z.string().max(50).optional(),
});

// ============================================================================
// Query Validators
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const reportQuerySchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

// ============================================================================
// Admin Validators
// ============================================================================

export const updateUserRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'student']),
  is_active: z.boolean().optional(),
});

// ============================================================================
// Type exports
// ============================================================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
