import { Router, Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { attendanceLimiter } from '../middleware/rateLimiter';
import { markAttendanceSchema, paginationSchema } from '../validators/schemas';

const router = Router();

/**
 * @swagger
 * /api/attendance/mark:
 *   post:
 *     summary: Mark attendance via QR token
 *     tags: [Attendance]
 */
router.post(
  '/mark',
  attendanceLimiter,
  authenticate,
  validate(markAttendanceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await attendanceService.markAttendance(
      req.body.token,
      req.user!.id,
      req.ip || undefined,
      req.headers['user-agent']
    );
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/attendance/my:
 *   get:
 *     summary: Get current student's attendance records
 *     tags: [Attendance]
 */
router.get(
  '/my',
  authenticate,
  requireRole('student'),
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await attendanceService.getMyAttendance(req.user!.id, page, limit);
    res.json({
      success: true,
      data: result.records,
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  })
);

/**
 * @swagger
 * /api/attendance/session/:id:
 *   get:
 *     summary: Get attendance for a specific session
 *     tags: [Attendance]
 */
router.get(
  '/session/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await attendanceService.getSessionAttendance(req.params.id, page, limit);
    res.json({
      success: true,
      data: result.records,
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  })
);

/**
 * @swagger
 * /api/attendance/stats:
 *   get:
 *     summary: Get current student's attendance stats
 *     tags: [Attendance]
 */
router.get(
  '/stats',
  authenticate,
  requireRole('student'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await attendanceService.getStudentStats(req.user!.id);
    res.json({ success: true, data: result });
  })
);

export default router;
