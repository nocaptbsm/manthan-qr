import { Router, Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createSessionSchema, updateSessionSchema, paginationSchema } from '../validators/schemas';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate(createSessionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sessionService.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: result });
  })
);

router.get(
  '/',
  authenticate,
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const status = req.query.status as string | undefined;
    const result = await sessionService.getAll(page, limit, status);
    res.json({
      success: true,
      data: result.sessions,
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sessionService.getById(req.params.id);
    res.json({ success: true, data: result });
  })
);

router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate(updateSessionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sessionService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: result });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sessionService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/:id/start',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sessionService.startSession(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/:id/end',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await sessionService.endSession(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  })
);

export default router;
