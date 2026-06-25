import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from './auth';

type UserRole = 'super_admin' | 'admin' | 'student';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as AuthenticatedUser;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};
