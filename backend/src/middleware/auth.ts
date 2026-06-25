import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'student';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn('Authentication failed', { error: error?.message });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.warn('User profile not found', { userId: user.id });
      res.status(401).json({
        success: false,
        error: 'User profile not found',
      });
      return;
    }

    if (!profile.is_active) {
      res.status(403).json({
        success: false,
        error: 'Account is deactivated',
      });
      return;
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
    };

    next();
  } catch (err) {
    logger.error('Authentication error', err);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};
