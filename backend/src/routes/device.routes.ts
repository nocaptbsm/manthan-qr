import { Router, Request, Response } from 'express';
import { deviceService } from '../services/device.service';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authenticateDevice } from '../middleware/deviceAuth';
import { deviceLimiter } from '../middleware/rateLimiter';
import { registerDeviceSchema, deviceHeartbeatSchema, updateDeviceStatusSchema } from '../validators/schemas';

const router = Router();

/**
 * @swagger
 * /api/device/register:
 *   post:
 *     summary: Register a new device
 *     tags: [Device]
 */
router.post(
  '/register',
  authenticate,
  requireRole('super_admin'),
  validate(registerDeviceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await deviceService.register(req.body, req.user!.id);
    res.status(201).json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/device/heartbeat:
 *   post:
 *     summary: Device heartbeat ping
 *     tags: [Device]
 */
router.post(
  '/heartbeat',
  deviceLimiter,
  authenticateDevice,
  validate(deviceHeartbeatSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await deviceService.heartbeat(
      req.device!.id,
      req.body.firmware_version,
      req.body.ip_address
    );
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/device/current-token:
 *   get:
 *     summary: Get current QR token for device display
 *     tags: [Device]
 */
router.get(
  '/current-token',
  deviceLimiter,
  authenticateDevice,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await deviceService.getCurrentToken(req.device!.id);
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/device/status:
 *   post:
 *     summary: Update device active status
 *     tags: [Device]
 */
router.post(
  '/status',
  authenticate,
  requireRole('super_admin'),
  validate(updateDeviceStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Get device_id from query or body
    const deviceId = req.query.device_id as string || req.body.device_id;
    if (!deviceId) {
      res.status(400).json({ success: false, error: 'device_id is required' });
      return;
    }
    const result = await deviceService.updateStatus(deviceId, req.body.is_active, req.user!.id);
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/device:
 *   get:
 *     summary: Get all devices
 *     tags: [Device]
 */
router.get(
  '/',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await deviceService.getAllDevices();
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/device/:id:
 *   get:
 *     summary: Get device by ID
 *     tags: [Device]
 */
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await deviceService.getDeviceById(req.params.id);
    res.json({ success: true, data: result });
  })
);

export default router;
