import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db, Profile } from '../db/index.js';

export interface AuthenticatedRequest extends Request {
  user?: Profile & { roles: string[] };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    const state = db.getState();
    const user = state.profiles.find(p => p.id === decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    const roles = state.user_roles.filter(r => r.user_id === user.id).map(r => r.role);
    if (!roles.includes(user.account_type)) {
      roles.push(user.account_type);
    }

    req.user = {
      ...user,
      roles
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authorization token' });
  }
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    const state = db.getState();
    const user = state.profiles.find(p => p.id === decoded.userId);
    if (user) {
      const roles = state.user_roles.filter(r => r.user_id === user.id).map(r => r.role);
      req.user = { ...user, roles };
    }
  } catch (err) {
    // Ignore invalid token on optional auth
  }
  next();
}

export function requireRole(allowedRoles: Array<'citizen' | 'volunteer' | 'donor' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRole = req.user.roles.some(r => allowedRoles.includes(r as any));
    if (!hasRole && req.user.account_type !== 'admin') {
      res.status(403).json({ error: 'Access forbidden: Insufficient role permissions' });
      return;
    }

    next();
  };
}
