import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, Facility } from '../db/index.js';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const AddFacilitySchema = z.object({
  name: z.string().min(3),
  facilityType: z.enum(['library', 'community_hall', 'school', 'clinic', 'housing_society', 'ngo_centre']),
  address: z.string().min(5),
  city: z.string().default('Mumbai'),
  neighbourhood: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  operatingHours: z.string().default('09:00 AM - 07:00 PM'),
  accessibilityFeatures: z.array(z.string()).default(['wheelchair_accessible']),
  filtrationEquipmentDetails: z.string().min(5),
  capacity: z.number().min(1).default(30)
});

// List facilities
router.get('/', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const { neighbourhood, type, verifiedOnly } = req.query;
  const user = req.user;
  const isAdmin = user && (user.roles.includes('admin') || user.account_type === 'admin');
  const state = db.getState();

  let list = state.facilities;

  if (!isAdmin && verifiedOnly !== 'false') {
    list = list.filter(f => f.is_verified);
  }

  if (neighbourhood) {
    list = list.filter(f => f.neighbourhood.toLowerCase().includes((neighbourhood as string).toLowerCase()));
  }
  if (type) {
    list = list.filter(f => f.facility_type === type);
  }

  res.json({ facilities: list });
});

// Recommend / Submit Clean Air Facility
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const data = AddFacilitySchema.parse(req.body);
    const state = db.getState();
    const now = new Date().toISOString();
    const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';

    const newFacility: Facility = {
      id: uuidv4(),
      name: data.name,
      facility_type: data.facilityType,
      address: data.address,
      city: data.city,
      neighbourhood: data.neighbourhood,
      latitude: data.latitude,
      longitude: data.longitude,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail,
      operating_hours: data.operatingHours,
      accessibility_features: data.accessibilityFeatures,
      filtration_equipment_details: data.filtrationEquipmentDetails,
      capacity: data.capacity,
      is_verified: isAdmin, // Admins create verified directly, others require verification
      created_at: now,
      updated_at: now
    };

    state.facilities.push(newFacility);

    if (isAdmin) {
      state.impact_records.push({
        id: uuidv4(),
        metric_type: 'facilities_onboarded',
        value: 1,
        related_entity_type: 'facility',
        related_entity_id: newFacility.id,
        recorded_at: now,
        methodology_notes: `Clean air facility "${newFacility.name}" onboarded and verified in ${newFacility.neighbourhood}.`
      });
    }

    db.save();
    res.status(201).json({
      message: isAdmin ? 'Facility registered and verified' : 'Facility recommendation submitted for administrator verification',
      facility: newFacility
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to submit facility', message: err.message });
    }
  }
});

// Admin verify facility
router.patch('/:id/verify', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const state = db.getState();

  const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
  if (!isAdmin) {
    res.status(403).json({ error: 'Administrator privileges required' });
    return;
  }

  const facility = state.facilities.find(f => f.id === id);
  if (!facility) {
    res.status(404).json({ error: 'Facility not found' });
    return;
  }

  const now = new Date().toISOString();
  facility.is_verified = true;
  facility.updated_at = now;

  state.impact_records.push({
    id: uuidv4(),
    metric_type: 'facilities_onboarded',
    value: 1,
    related_entity_type: 'facility',
    related_entity_id: facility.id,
    recorded_at: now,
    methodology_notes: `Clean air facility "${facility.name}" audited and verified.`
  });

  db.save();
  res.json({ message: 'Facility verified successfully', facility });
});

export default router;
