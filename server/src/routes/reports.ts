import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, CommunityReport, Notification } from '../db/index.js';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const ReportSchema = z.object({
  category: z.enum(['garbage_burning', 'construction_dust', 'industrial_smoke', 'roadside_burning', 'excessive_dust', 'other']),
  description: z.string().min(10, 'Please provide adequate details regarding the pollution event'),
  city: z.string().default('Mumbai'),
  neighbourhood: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  imageUrl: z.string().optional()
});

// List reports (public sees verified/resolved, admin sees all)
router.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user;
  const isAdmin = user && (user.roles.includes('admin') || user.account_type === 'admin');
  const state = db.getState();

  let reports: CommunityReport[] = [];
  if (isAdmin) {
    reports = [...state.community_reports];
  } else {
    // Only verified or resolved reports are public, privacy protected
    reports = state.community_reports.filter(r => ['verified', 'resolved'].includes(r.status));
  }

  // Remove exact reporter ID/identity to protect user privacy
  const sanitized = reports.map(r => ({
    id: r.id,
    category: r.category,
    description: r.description,
    city: r.city,
    neighbourhood: r.neighbourhood,
    latitude: r.latitude,
    longitude: r.longitude,
    imageUrl: r.image_url,
    status: r.status,
    resolutionNotes: r.resolution_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  res.json({ reports: sanitized });
});

// Submit pollution report
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const data = ReportSchema.parse(req.body);
    const state = db.getState();
    const now = new Date().toISOString();

    const newReport: CommunityReport = {
      id: uuidv4(),
      reporter_id: user.id,
      category: data.category,
      description: data.description,
      city: data.city,
      neighbourhood: data.neighbourhood,
      latitude: data.latitude,
      longitude: data.longitude,
      image_url: data.imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
      status: 'submitted',
      created_at: now,
      updated_at: now
    };

    state.community_reports.push(newReport);

    // Notify user of report receipt
    state.notifications.push({
      id: uuidv4(),
      user_id: user.id,
      title: 'Pollution Report Received',
      message: `Your report regarding ${data.category.replace('_', ' ')} in ${data.neighbourhood} has been received and queued for community moderation.`,
      event_type: 'report_submitted',
      related_entity_id: newReport.id,
      is_read: false,
      created_at: now
    });

    db.save();
    res.status(201).json({
      message: 'Pollution report submitted successfully. It will appear on the community map once verified.',
      reportId: newReport.id
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to submit report', message: err.message });
    }
  }
});

// Admin moderate report (verify, reject, resolve)
router.patch('/:id/status', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;
  const user = req.user!;
  const state = db.getState();

  const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
  if (!isAdmin) {
    res.status(403).json({ error: 'Administrator permissions required' });
    return;
  }

  const report = state.community_reports.find(r => r.id === id);
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  const now = new Date().toISOString();
  report.status = status;
  if (resolutionNotes) {
    report.resolution_notes = resolutionNotes;
  }
  report.updated_at = now;

  // If resolved, record impact
  if (status === 'resolved') {
    state.impact_records.push({
      id: uuidv4(),
      metric_type: 'reports_resolved',
      value: 1,
      related_entity_type: 'community_report',
      related_entity_id: report.id,
      recorded_at: now,
      methodology_notes: `Pollution incident (${report.category}) resolved with civic notification in ${report.neighbourhood}.`
    });
  }

  // Notify original reporter
  state.notifications.push({
    id: uuidv4(),
    user_id: report.reporter_id,
    title: `Pollution Report ${status.toUpperCase()}`,
    message: resolutionNotes || `Your report in ${report.neighbourhood} has been ${status}.`,
    event_type: `report_${status}`,
    related_entity_id: report.id,
    is_read: false,
    created_at: now
  });

  db.save();
  res.json({ message: `Report status updated to ${status}`, report });
});

export default router;
