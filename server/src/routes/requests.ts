import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, AssistanceRequest, Notification, RequestAssignment } from '../db/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { volunteerMatchingService } from '../services/volunteerMatchingService.js';

const router = Router();

export const VALID_REQUEST_STATUSES = [
  'submitted',
  'under_review',
  'approved',
  'matched',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
] as const;

export type RequestStatus = typeof VALID_REQUEST_STATUSES[number];

// Directed Graph of Allowed State Transitions
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ['under_review', 'approved', 'cancelled'],
  under_review: ['approved', 'cancelled'],
  approved: ['matched', 'assigned', 'cancelled'],
  matched: ['assigned', 'in_progress', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'assigned', 'cancelled'],
  completed: [], // Terminal state
  cancelled: []  // Terminal state
};

export interface TransitionContext {
  isAdmin: boolean;
  isOwner: boolean;
  isAssignedVolunteer: boolean;
}

export function validateStatusTransition(
  currentStatus: RequestStatus,
  targetStatus: RequestStatus,
  context: TransitionContext
): { valid: boolean; statusCode?: number; error?: string } {
  if (!VALID_REQUEST_STATUSES.includes(targetStatus)) {
    return {
      valid: false,
      statusCode: 400,
      error: `Invalid status '${targetStatus}'. Must be one of: ${VALID_REQUEST_STATUSES.join(', ')}`
    };
  }

  if (currentStatus === targetStatus) {
    return {
      valid: false,
      statusCode: 400,
      error: `Request is already in '${currentStatus}' status`
    };
  }

  if (['completed', 'cancelled'].includes(currentStatus)) {
    return {
      valid: false,
      statusCode: 400,
      error: `Invalid transition: Request is in terminal state '${currentStatus}' and cannot be modified.`
    };
  }

  const { isAdmin, isOwner, isAssignedVolunteer } = context;

  if (!isAdmin && !isOwner && !isAssignedVolunteer) {
    return {
      valid: false,
      statusCode: 403,
      error: 'Unauthorized: You do not have permission to modify this request status'
    };
  }

  // Citizens can ONLY cancel their own requests
  if (isOwner && !isAdmin && !isAssignedVolunteer) {
    if (targetStatus !== 'cancelled') {
      return {
        valid: false,
        statusCode: 403,
        error: 'Citizens can only cancel their own requests'
      };
    }
    if (currentStatus === 'in_progress') {
      return {
        valid: false,
        statusCode: 400,
        error: 'Active requests in progress cannot be directly cancelled by the citizen. Please contact your coordinator or volunteer.'
      };
    }
    return { valid: true };
  }

  // Assigned Volunteers
  if (isAssignedVolunteer && !isAdmin) {
    if (['assigned', 'matched'].includes(currentStatus)) {
      if (targetStatus !== 'in_progress') {
        return {
          valid: false,
          statusCode: 400,
          error: `Invalid transition: Assigned volunteer must first transition the request to 'in_progress' before marking it 'completed'.`
        };
      }
    } else if (currentStatus === 'in_progress') {
      if (targetStatus !== 'completed') {
        return {
          valid: false,
          statusCode: 400,
          error: `Invalid transition: Volunteers can only mark an 'in_progress' request as 'completed'.`
        };
      }
    } else {
      return {
        valid: false,
        statusCode: 403,
        error: `Volunteers cannot modify requests in '${currentStatus}' status.`
      };
    }
    return { valid: true };
  }

  // Admin
  if (isAdmin) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return {
        valid: false,
        statusCode: 400,
        error: `Invalid status transition: Cannot transition request from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`
      };
    }
    return { valid: true };
  }

  return { valid: false, statusCode: 403, error: 'Unauthorized status transition' };
}

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
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
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

    await db.save();

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

// Update Request Status with Strict Authorization & Transition Validation
router.patch('/:id/status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const user = req.user!;
    const state = db.getState();

    const request = state.assistance_requests.find(r => r.id === id);
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const currentStatus = request.status as RequestStatus;
    const targetStatus = status as RequestStatus;

    const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
    const isOwner = request.user_id === user.id;
    const assignment = state.request_assignments.find(a => a.request_id === request.id);
    const vProfile = state.volunteer_profiles.find(v => v.user_id === user.id);
    const isAssignedVolunteer = !!(assignment && vProfile && assignment.volunteer_id === vProfile.id);

    const validation = validateStatusTransition(currentStatus, targetStatus, {
      isAdmin,
      isOwner,
      isAssignedVolunteer
    });

    if (!validation.valid) {
      res.status(validation.statusCode || 400).json({ error: validation.error });
      return;
    }

    const now = new Date().toISOString();
    request.status = targetStatus;
    request.updated_at = now;

    // Dispatch notification to requester
    const notif: Notification = {
      id: uuidv4(),
      user_id: request.user_id,
      title: `Assistance Request ${targetStatus.toUpperCase().replace('_', ' ')}`,
      message: notes || `Your assistance request #${request.id.slice(0, 8)} status was updated to: ${targetStatus}.`,
      event_type: `request_${targetStatus}`,
      related_entity_id: request.id,
      is_read: false,
      created_at: now
    };
    state.notifications.push(notif);

    // If status is completed, record impact record!
    if (targetStatus === 'completed') {
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

    await db.save();
    res.json({ message: 'Request status updated', request });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update request status', message: err.message });
  }
});

// Volunteer Matches Recommendation Engine
router.get('/:id/matches', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const state = db.getState();

  const request = state.assistance_requests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const isAdmin = user.roles.includes('admin') || user.account_type === 'admin';
  const isOwner = request.user_id === user.id;

  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: 'Unauthorized: Only administrators or the request owner can view volunteer matches' });
    return;
  }

  const matches = volunteerMatchingService.findMatchesForRequest(request);
  res.json({ matches });
});

// Assign Volunteer to Request
router.post('/:id/assign', authenticate, async (req: AuthenticatedRequest, res) => {
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

  // Reject assignment if request is in terminal state
  if (['completed', 'cancelled'].includes(request.status)) {
    res.status(400).json({
      error: `Invalid transition: Request is in terminal state '${request.status}' and cannot be assigned.`
    });
    return;
  }

  // Validate state transition to 'assigned' if not already assigned
  if (request.status !== 'assigned') {
    const validation = validateStatusTransition(request.status as RequestStatus, 'assigned', {
      isAdmin: true,
      isOwner: false,
      isAssignedVolunteer: false
    });
    if (!validation.valid) {
      res.status(validation.statusCode || 400).json({ error: validation.error });
      return;
    }
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

  await db.save();
  res.json({ message: 'Volunteer assigned successfully', assignment, request });
});

export default router;
