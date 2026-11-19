import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, AssistanceRequest, Notification, RequestAssignment } from '../db/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { volunteerMatchingService } from '../services/volunteerMatchingService.js';

const router = Router();

const CreateRequestSchema = z.object({
  category: z.enum([
    'purifier_loan', 'purifier_donation', 'diy_installation',
    'filter_replacement', 'equipment_repair', 'protective_gear',
    'iaq_assessment', 'facility_access', 'other'
  ]),
  description: z.string().min(10, 'Please provide a clear description of your need'),
  locationCity: z.string().default('Mumbai'),
  locationNeighbourhood: z.string().min(2, 'Neighbourhood is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  householdType: z.string().optional(),
  existingEquipment: z.string().optional(),
  contactMethod: z.string().default('In-app message'),
  consentShared: z.boolean().default(true)
});

// Create Assistance Request
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const data = CreateRequestSchema.parse(req.body);
    const state = db.getState();
    const now = new Date().toISOString();

    const newRequest: AssistanceRequest = {
      id: uuidv4(),
      user_id: user.id,
      category: data.category,
      description: data.description,
      location_city: data.locationCity,
      location_neighbourhood: data.locationNeighbourhood,
      latitude: data.latitude || user.latitude || 19.0760,
      longitude: data.longitude || user.longitude || 72.8777,
      urgency: data.urgency,
      household_type: data.householdType || 'Family household',
      existing_equipment: data.existingEquipment || 'None',
      contact_method: data.contactMethod,
      consent_shared: data.consentShared,
      status: 'submitted',
      created_at: now,
      updated_at: now
    };

    state.assistance_requests.push(newRequest);

    // Notify user of receipt
    const notif: Notification = {
      id: uuidv4(),
      user_id: user.id,
      title: 'Assistance Request Submitted',
      message: `Your request for ${data.category.replace('_', ' ')} in ${data.locationNeighbourhood} has been received. Our community review team will verify it shortly.`,
      event_type: 'request_created',
      related_entity_id: newRequest.id,
      is_read: false,
      created_at: now
    };
    state.notifications.push(notif);

    db.save();

    res.status(201).json({
      message: 'Assistance request created successfully',
      request: newRequest
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to create request', message: err.message });
    }
  }
});

// List Requests (Filtered by Role & Ownership)
router.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const state = db.getState();
  const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
  const isVolunteer = user.roles.includes('volunteer') || user.account_type === 'volunteer';

  let requests: AssistanceRequest[] = [];

  if (isAdmin) {
    requests = [...state.assistance_requests];
  } else if (isVolunteer) {
    // Volunteers see approved, assigned, or in-progress requests, plus any of their own
    requests = state.assistance_requests.filter(
      r => r.user_id === user.id || ['approved', 'assigned', 'in_progress'].includes(r.status)
    );
  } else {
    // Citizens and donors see only their own requests
    requests = state.assistance_requests.filter(r => r.user_id === user.id);
  }

  // Enrich with user profile names
  const enriched = requests.map(r => {
    const creator = state.profiles.find(p => p.id === r.user_id);
    const assignment = state.request_assignments.find(a => a.request_id === r.id);
    let volunteerName = undefined;
    if (assignment) {
      const vProfile = state.volunteer_profiles.find(v => v.id === assignment.volunteer_id);
      if (vProfile) {
        const vUser = state.profiles.find(p => p.id === vProfile.user_id);
        volunteerName = vUser?.full_name;
      }
    }
    return {
      ...r,
      creatorName: creator?.full_name,
      creatorEmail: isAdmin ? creator?.email : undefined,
      creatorPhone: (isAdmin || isVolunteer) ? creator?.phone : undefined,
      assignedVolunteerName: volunteerName,
      assignment
    };
  });

  res.json({ requests: enriched });
});

// Get Request Detail
router.get('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const state = db.getState();

  const request = state.assistance_requests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const isAdmin = user.roles.includes('admin');
  const isVolunteer = user.roles.includes('volunteer');
  const isOwner = request.user_id === user.id;

  if (!isAdmin && !isOwner && !isVolunteer) {
    res.status(403).json({ error: 'Unauthorized to view this request' });
    return;
  }

  const creator = state.profiles.find(p => p.id === request.user_id);
  const assignment = state.request_assignments.find(a => a.request_id === request.id);

  res.json({
    request: {
      ...request,
      creatorName: creator?.full_name,
      creatorPhone: (isAdmin || isVolunteer || isOwner) ? creator?.phone : undefined,
      assignment
    }
  });
});

// Update Request Status
router.patch('/:id/status', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const user = req.user!;
  const state = db.getState();

  const request = state.assistance_requests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
  const isOwner = request.user_id === user.id;
  const assignment = state.request_assignments.find(a => a.request_id === request.id);
  const vProfile = state.volunteer_profiles.find(v => v.user_id === user.id);
  const isAssignedVolunteer = assignment && vProfile && assignment.volunteer_id === vProfile.id;

  // Citizens can only cancel their own submitted request
  if (isOwner && !isAdmin && !isAssignedVolunteer) {
    if (status !== 'cancelled') {
      res.status(403).json({ error: 'Citizens can only cancel their own requests' });
      return;
    }
  }

  const now = new Date().toISOString();
  request.status = status;
  request.updated_at = now;

  // Dispatch notification to requester
  const notif: Notification = {
    id: uuidv4(),
    user_id: request.user_id,
    title: `Assistance Request ${status.toUpperCase().replace('_', ' ')}`,
    message: notes || `Your assistance request #${request.id.slice(0, 8)} status was updated to: ${status}.`,
    event_type: `request_${status}`,
    related_entity_id: request.id,
    is_read: false,
    created_at: now
  };
  state.notifications.push(notif);

  // If status is completed, record impact record!
  if (status === 'completed') {
    state.impact_records.push({
      id: uuidv4(),
      metric_type: 'requests_fulfilled',
      value: 1,
      related_entity_type: 'assistance_request',
      related_entity_id: request.id,
      recorded_at: now,
      methodology_notes: `Direct fulfillment of ${request.category} request in ${request.location_neighbourhood}.`
    });
  }

  db.save();
  res.json({ message: 'Request status updated', request });
});

// Volunteer Matches Recommendation Engine
router.get('/:id/matches', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const state = db.getState();

  const request = state.assistance_requests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const matches = volunteerMatchingService.findMatchesForRequest(request);
  res.json({ matches });
});

// Assign Volunteer to Request
router.post('/:id/assign', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { volunteerId } = req.body;
  const user = req.user!;
  const state = db.getState();

  const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
  if (!isAdmin) {
    res.status(403).json({ error: 'Only administrators can assign volunteers' });
    return;
  }

  const request = state.assistance_requests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const vProfile = state.volunteer_profiles.find(v => v.id === volunteerId);
  if (!vProfile) {
    res.status(404).json({ error: 'Volunteer profile not found' });
    return;
  }

  const now = new Date().toISOString();

  // Create or update assignment
  let assignment = state.request_assignments.find(a => a.request_id === request.id);
  if (assignment) {
    assignment.volunteer_id = volunteerId;
    assignment.status = 'assigned';
    assignment.updated_at = now;
  } else {
    assignment = {
      id: uuidv4(),
      request_id: request.id,
      volunteer_id: volunteerId,
      status: 'assigned',
      assigned_at: now,
      updated_at: now
    };
    state.request_assignments.push(assignment);
  }

  request.status = 'assigned';
  request.updated_at = now;

  // Notify volunteer
  state.notifications.push({
    id: uuidv4(),
    user_id: vProfile.user_id,
    title: 'New Community Assignment',
    message: `You have been assigned to assistance request in ${request.location_neighbourhood} (${request.category.replace('_', ' ')}). Please review and accept.`,
    event_type: 'task_assigned',
    related_entity_id: request.id,
    is_read: false,
    created_at: now
  });

  // Notify requester
  state.notifications.push({
    id: uuidv4(),
    user_id: request.user_id,
    title: 'Volunteer Assigned to Your Request',
    message: `A volunteer has been matched to your request. They will review and contact you shortly.`,
    event_type: 'volunteer_assigned',
    related_entity_id: request.id,
    is_read: false,
    created_at: now
  });

  db.save();
  res.json({ message: 'Volunteer assigned successfully', assignment, request });
});

export default router;
