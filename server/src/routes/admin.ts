import { Router } from 'express';
import { db } from '../db/index.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Require admin for all admin routes
router.use(authenticate, requireRole(['admin']));

// Admin Overview Statistics
router.get('/overview', (req: AuthenticatedRequest, res) => {
  const state = db.getState();

  const totalUsers = state.profiles.length;
  const totalVolunteers = state.volunteer_profiles.length;
  const verifiedVolunteers = state.volunteer_profiles.filter(v => v.is_verified).length;
  
  const openRequests = state.assistance_requests.filter(r => ['submitted', 'under_review', 'approved'].includes(r.status)).length;
  const unassignedRequests = state.assistance_requests.filter(r => r.status === 'approved').length;
  
  const totalEquipment = state.equipment.length;
  const availableEquipment = state.equipment.filter(e => e.status === 'available').length;
  
  const totalFacilities = state.facilities.length;
  const pendingFacilities = state.facilities.filter(f => !f.is_verified).length;
  
  const pendingReports = state.community_reports.filter(r => ['submitted', 'under_review'].includes(r.status)).length;

  res.json({
    stats: {
      totalUsers,
      totalVolunteers,
      verifiedVolunteers,
      openRequests,
      unassignedRequests,
      totalEquipment,
      availableEquipment,
      totalFacilities,
      pendingFacilities,
      pendingReports
    }
  });
});

// User Management: List all users
router.get('/users', (req: AuthenticatedRequest, res) => {
  const state = db.getState();
  const users = state.profiles.map(p => {
    const roles = state.user_roles.filter(r => r.user_id === p.id).map(r => r.role);
    const volunteer = state.volunteer_profiles.find(v => v.user_id === p.id);
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      phone: p.phone,
      city: p.city,
      neighbourhood: p.neighbourhood,
      accountType: p.account_type,
      roles,
      isVerifiedVolunteer: volunteer?.is_verified ?? false,
      createdAt: p.created_at
    };
  });

  res.json({ users });
});

// Verify Volunteer
router.patch('/volunteers/:id/verify', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const state = db.getState();

  const volunteer = state.volunteer_profiles.find(v => v.id === id);
  if (!volunteer) {
    res.status(404).json({ error: 'Volunteer not found' });
    return;
  }

  volunteer.is_verified = true;
  volunteer.updated_at = new Date().toISOString();
  db.save();

  res.json({ message: 'Volunteer verified successfully', volunteer });
});

// Audit Logs
router.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const state = db.getState();
  res.json({ auditLogs: state.audit_logs });
});

export default router;
