import { Router, Request, Response } from 'express';
import { studentService } from '../services/student.service';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { updateStudentSchema, paginationSchema } from '../validators/schemas';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const search = req.query.search as string | undefined;
    const result = await studentService.getAll(page, limit, search);
    res.json({
      success: true,
      data: result.students,
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  })
);

router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await studentService.getById(req.params.id);
    res.json({ success: true, data: result });
  })
);

router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate(updateStudentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await studentService.update(req.params.id, req.body);
    res.json({ success: true, data: result });
  })
);

router.get(
  '/:id/stats',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await studentService.getStats(req.params.id);
    res.json({ success: true, data: result });
  })
);

export default router;
