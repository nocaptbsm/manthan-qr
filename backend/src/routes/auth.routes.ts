import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { signupSchema, loginSchema, forgotPasswordSchema } from '../validators/schemas';

const router = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post(
  '/signup',
  authLimiter,
  validate(signupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signup(req.body);
    res.status(201).json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }
    const result = await authService.refreshToken(refresh_token);
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.logout(req.user!.id);
    res.json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: { user: req.user } });
  })
);

export default router;
