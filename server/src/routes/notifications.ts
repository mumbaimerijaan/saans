import { Router } from 'express';
import { db } from '../db/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get current user notifications
router.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const state = db.getState();

  const userNotifications = state.notifications
    .filter(n => n.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = userNotifications.filter(n => !n.is_read).length;

  res.json({
    notifications: userNotifications,
    unreadCount
  });
});

// Mark single notification as read
router.patch('/:id/read', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const state = db.getState();

  const notif = state.notifications.find(n => n.id === id && n.user_id === user.id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  notif.is_read = true;
  db.save();
  res.json({ message: 'Marked as read', notification: notif });
});

// Mark all as read
router.post('/read-all', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const state = db.getState();

  state.notifications.forEach(n => {
    if (n.user_id === user.id) {
      n.is_read = true;
    }
  });

  db.save();
  res.json({ message: 'All notifications marked as read' });
});

export default router;
