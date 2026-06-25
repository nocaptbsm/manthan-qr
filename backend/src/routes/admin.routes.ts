import { Router, Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { updateUserRoleSchema, paginationSchema } from '../validators/schemas';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.getDashboardStats();
    res.json({ success: true, data: result });
  })
);

router.get(
  '/users',
  authenticate,
  requireRole('super_admin'),
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await adminService.getAllUsers(page, limit, role, search);
    res.json({
      success: true,
      data: result.users,
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  })
);

router.put(
  '/users/:id',
  authenticate,
  requireRole('super_admin'),
  validate(updateUserRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.updateUserRole(
      req.params.id,
      req.body.role,
      req.body.is_active,
      req.user!.id
    );
    res.json({ success: true, data: result });
  })
);

router.delete(
  '/users/:id',
  authenticate,
  requireRole('super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.params.id === req.user!.id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }
    const result = await adminService.deleteUser(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  })
);

router.get(
  '/audit-logs',
  authenticate,
  requireRole('super_admin'),
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const action = req.query.action as string | undefined;
    const result = await adminService.getAuditLogs(page, limit, action);
    res.json({
      success: true,
      data: result.logs,
      meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  })
);

export default router;
