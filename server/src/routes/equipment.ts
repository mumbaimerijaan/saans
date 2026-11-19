import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, Equipment, EquipmentRequest, Notification } from '../db/index.js';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const AddEquipmentSchema = z.object({
  name: z.string().min(3),
  category: z.enum(['hepa_purifier', 'diy_filtration', 'replacement_filter', 'fan_component', 'iaq_monitor', 'protective_gear']),
  description: z.string().min(10),
  manufacturerModel: z.string().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']).default('good'),
  type: z.enum(['donation', 'loan']).default('loan'),
  maxLoanDurationDays: z.number().min(1).max(90).default(30),
  locationCity: z.string().default('Mumbai'),
  locationNeighbourhood: z.string().min(2),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrl: z.string().optional(),
  cadrRating: z.number().optional()
});

// List and search equipment
router.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const { category, type, condition, neighbourhood, search } = req.query;
  const state = db.getState();

  let list = state.equipment.filter(e => e.status !== 'maintenance');

  if (category) {
    list = list.filter(e => e.category === category);
  }
  if (type) {
    list = list.filter(e => e.type === type);
  }
  if (condition) {
    list = list.filter(e => e.condition === condition);
  }
  if (neighbourhood) {
    list = list.filter(e => e.location_neighbourhood.toLowerCase().includes((neighbourhood as string).toLowerCase()));
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.manufacturer_model?.toLowerCase().includes(q)
    );
  }

  // Enrich with donor name
  const enriched = list.map(item => {
    const donor = state.profiles.find(p => p.id === item.donor_id);
    return {
      ...item,
      donorName: donor?.full_name || 'Community Donor'
    };
  });

  res.json({ equipment: enriched });
});

// Add Equipment (by Donor or Citizen)
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const data = AddEquipmentSchema.parse(req.body);
    const state = db.getState();
    const now = new Date().toISOString();

    const newEquipment: Equipment = {
      id: uuidv4(),
      donor_id: user.id,
      name: data.name,
      category: data.category,
      description: data.description,
      manufacturer_model: data.manufacturerModel,
      condition: data.condition,
      type: data.type,
      max_loan_duration_days: data.type === 'loan' ? data.maxLoanDurationDays : 0,
      location_city: data.locationCity,
      location_neighbourhood: data.locationNeighbourhood,
      latitude: data.latitude || user.latitude || 19.0760,
      longitude: data.longitude || user.longitude || 72.8777,
      image_url: data.imageUrl || 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
      status: 'available',
      is_verified: true,
      cadr_rating: data.cadrRating,
      created_at: now,
      updated_at: now
    };

    state.equipment.push(newEquipment);

    // Record impact if donation
    if (data.type === 'donation') {
      state.impact_records.push({
        id: uuidv4(),
        metric_type: 'equipment_donated',
        value: 1,
        related_entity_type: 'equipment',
        related_entity_id: newEquipment.id,
        recorded_at: now,
        methodology_notes: `Clean air equipment listed for donation by ${user.full_name}.`
      });
    }

    db.save();
    res.status(201).json({ message: 'Equipment listed successfully', equipment: newEquipment });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to list equipment', message: err.message });
    }
  }
});

// Request an equipment item
router.post('/:id/request', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { purpose, durationDays } = req.body;
  const user = req.user!;
  const state = db.getState();

  const item = state.equipment.find(e => e.id === id);
  if (!item) {
    res.status(404).json({ error: 'Equipment item not found' });
    return;
  }

  if (item.status !== 'available') {
    res.status(400).json({ error: `Equipment is currently ${item.status}` });
    return;
  }

  const now = new Date().toISOString();
  const eqRequest: EquipmentRequest = {
    id: uuidv4(),
    equipment_id: item.id,
    requester_id: user.id,
    status: 'pending',
    requested_duration_days: durationDays || item.max_loan_duration_days || 14,
    purpose: purpose || 'Severe winter smog protection',
    created_at: now,
    updated_at: now
  };

  state.equipment_requests.push(eqRequest);
  item.status = 'requested';
  item.updated_at = now;

  // Notify donor
  if (item.donor_id) {
    state.notifications.push({
      id: uuidv4(),
      user_id: item.donor_id,
      title: 'Equipment Requested',
      message: `${user.full_name} has requested "${item.name}" for: ${eqRequest.purpose}.`,
      event_type: 'equipment_requested',
      related_entity_id: eqRequest.id,
      is_read: false,
      created_at: now
    });
  }

  db.save();
  res.status(201).json({ message: 'Equipment request submitted', request: eqRequest, item });
});

// Approve equipment request (Admin or Donor)
router.post('/requests/:requestId/approve', authenticate, (req: AuthenticatedRequest, res) => {
  const { requestId } = req.params;
  const user = req.user!;
  const state = db.getState();

  const eqReq = state.equipment_requests.find(r => r.id === requestId);
  if (!eqReq) {
    res.status(404).json({ error: 'Equipment request not found' });
    return;
  }

  const item = state.equipment.find(e => e.id === eqReq.equipment_id);
  if (!item) {
    res.status(404).json({ error: 'Associated equipment not found' });
    return;
  }

  const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
  const isDonor = item.donor_id === user.id;

  if (!isAdmin && !isDonor) {
    res.status(403).json({ error: 'Only the equipment donor or an administrator can approve this request' });
    return;
  }

  const now = new Date().toISOString();
  eqReq.status = 'approved';
  eqReq.updated_at = now;

  item.status = item.type === 'donation' ? 'issued' : 'reserved';
  item.updated_at = now;

  // Record transaction
  state.equipment_transactions.push({
    id: uuidv4(),
    equipment_id: item.id,
    from_user_id: item.donor_id,
    to_user_id: eqReq.requester_id,
    transaction_type: item.type === 'donation' ? 'donation_transfer' : 'loan',
    issue_date: now,
    expected_return_date: item.type === 'loan' ? new Date(Date.now() + (eqReq.requested_duration_days || 14) * 86400000).toISOString() : undefined,
    notes: `Approved by ${user.full_name}`,
    created_at: now
  });

  // Record impact
  if (item.type === 'loan') {
    state.impact_records.push({
      id: uuidv4(),
      metric_type: 'equipment_loaned',
      value: 1,
      related_entity_type: 'equipment',
      related_entity_id: item.id,
      recorded_at: now,
      methodology_notes: `Air purifier loaned for ${eqReq.requested_duration_days} days to citizen in ${item.location_neighbourhood}.`
    });
  }

  // Notify requester
  state.notifications.push({
    id: uuidv4(),
    user_id: eqReq.requester_id,
    title: 'Equipment Request Approved!',
    message: `Your request for "${item.name}" has been approved. You may arrange pickup or delivery.`,
    event_type: 'equipment_approved',
    related_entity_id: item.id,
    is_read: false,
    created_at: now
  });

  db.save();
  res.json({ message: 'Equipment request approved', request: eqReq, item });
});

// Return loaned equipment
router.post('/requests/:requestId/return', authenticate, (req: AuthenticatedRequest, res) => {
  const { requestId } = req.params;
  const state = db.getState();

  const eqReq = state.equipment_requests.find(r => r.id === requestId);
  if (!eqReq) {
    res.status(404).json({ error: 'Equipment request not found' });
    return;
  }

  const item = state.equipment.find(e => e.id === eqReq.equipment_id);
  if (!item) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const now = new Date().toISOString();
  eqReq.status = 'fulfilled';
  item.status = 'available';
  item.updated_at = now;

  db.save();
  res.json({ message: 'Equipment marked as returned and available', item });
});

export default router;
