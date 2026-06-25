import { Router, Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { reportQuerySchema } from '../validators/schemas';

const router = Router();

router.get(
  '/student/:id',
  authenticate,
  validate(reportQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { format, start_date, end_date } = req.query as unknown as {
      format: string; start_date?: string; end_date?: string;
    };

    // Students can only view their own report
    if (req.user!.role === 'student' && req.params.id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const result = await reportService.getStudentReport(req.params.id, start_date, end_date);

    if (format === 'csv') {
      const csv = reportService.toCSV(reportService.flattenRecords(result.records as unknown as Record<string, unknown>[]));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=student-report.csv');
      res.send(csv);
      return;
    }

    res.json({ success: true, data: result });
  })
);

router.get(
  '/daily',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const format = req.query.format as string || 'json';
    const result = await reportService.getDailyReport(date);

    if (format === 'csv') {
      const allRecords: Record<string, unknown>[] = [];
      for (const session of result.sessions) {
        for (const record of session.records) {
          allRecords.push({ session_title: session.title, ...record });
        }
      }
      const csv = reportService.toCSV(reportService.flattenRecords(allRecords));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=daily-report-${date}.csv`);
      res.send(csv);
      return;
    }

    res.json({ success: true, data: result });
  })
);

router.get(
  '/monthly',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const format = req.query.format as string || 'json';

    const result = await reportService.getMonthlyReport(year, month);

    if (format === 'csv') {
      const csv = reportService.toCSV(result.students as unknown as Record<string, unknown>[]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${year}-${month}.csv`);
      res.send(csv);
      return;
    }

    res.json({ success: true, data: result });
  })
);

router.get(
  '/session/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const format = req.query.format as string || 'json';
    const result = await reportService.getSessionReport(req.params.id);

    if (format === 'csv') {
      const csv = reportService.toCSV(reportService.flattenRecords(result.records as unknown as Record<string, unknown>[]));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=session-report.csv`);
      res.send(csv);
      return;
    }

    res.json({ success: true, data: result });
  })
);

router.get(
  '/device/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };
    const result = await reportService.getDeviceReport(req.params.id, start_date, end_date);
    res.json({ success: true, data: result });
  })
);

export default router;
