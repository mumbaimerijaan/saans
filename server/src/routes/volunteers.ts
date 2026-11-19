import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db, VolunteerProfile, VolunteerSkill, RequestAssignment, Notification } from '../db/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const VolunteerProfileSchema = z.object({
  serviceRadiusKm: z.number().min(1).max(100).default(10),
  experienceYears: z.number().min(0).default(1),
  bio: z.string().optional(),
  languages: z.array(z.string()).default(['en']),
  organisationAffiliation: z.string().optional(),
  skills: z.array(z.object({
    category: z.enum(['electrical', 'installation', 'repair', 'awareness', 'logistics', 'health_edu', 'general']),
    proficiency: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate')
  })).min(1, 'Please select at least one skill')
});

// Register / Update Volunteer Profile
router.post('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const data = VolunteerProfileSchema.parse(req.body);
    const state = db.getState();
    const now = new Date().toISOString();

    let vProfile = state.volunteer_profiles.find(v => v.user_id === user.id);

    if (vProfile) {
      vProfile.service_radius_km = data.serviceRadiusKm;
      vProfile.experience_years = data.experienceYears;
      vProfile.bio = data.bio || vProfile.bio;
      vProfile.languages = data.languages;
      vProfile.organisation_affiliation = data.organisationAffiliation;
      vProfile.updated_at = now;
    } else {
      vProfile = {
        id: uuidv4(),
        user_id: user.id,
        service_radius_km: data.serviceRadiusKm,
        experience_years: data.experienceYears,
        bio: data.bio || 'Community clean air volunteer.',
        languages: data.languages,
        organisation_affiliation: data.organisationAffiliation,
        is_verified: false,
        status: 'active',
        created_at: now,
        updated_at: now
      };
      state.volunteer_profiles.push(vProfile);
    }

    // Ensure volunteer role exists on user
    if (!state.user_roles.some(r => r.user_id === user.id && r.role === 'volunteer')) {
      state.user_roles.push({
        id: uuidv4(),
        user_id: user.id,
        role: 'volunteer',
        granted_at: now
      });
    }

    // Replace skills
    state.volunteer_skills = state.volunteer_skills.filter(s => s.volunteer_id !== vProfile!.id);
    for (const sk of data.skills) {
      state.volunteer_skills.push({
        id: uuidv4(),
        volunteer_id: vProfile.id,
        skill_category: sk.category,
        proficiency_level: sk.proficiency,
        created_at: now
      });
    }

    db.save();
    res.json({ message: 'Volunteer profile saved successfully', profile: vProfile });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Failed to update volunteer profile', message: err.message });
    }
  }
});

// Volunteer Dashboard Tasks (Available, Assigned, Completed)
router.get('/tasks', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const state = db.getState();

  const vProfile = state.volunteer_profiles.find(v => v.user_id === user.id);
  if (!vProfile) {
    res.status(404).json({ error: 'Volunteer profile not found. Please register as a volunteer first.' });
    return;
  }

  // Find assignments specifically for this volunteer
  const myAssignments = state.request_assignments.filter(a => a.volunteer_id === vProfile.id);

  // Active / Accepted Tasks
  const activeTasks = myAssignments.filter(a => ['assigned', 'accepted'].includes(a.status)).map(a => {
    const request = state.assistance_requests.find(r => r.id === a.request_id);
    const creator = request ? state.profiles.find(p => p.id === request.user_id) : null;
    return {
      assignment: a,
      request,
      creatorName: creator?.full_name,
      creatorPhone: creator?.phone,
      creatorEmail: creator?.email
    };
  });

  // Completed Tasks
  const completedTasks = myAssignments.filter(a => a.status === 'completed').map(a => {
    const request = state.assistance_requests.find(r => r.id === a.request_id);
    return {
      assignment: a,
      request
    };
  });

  // Available Open Requests in the community (approved and unassigned)
  const assignedRequestIds = state.request_assignments
    .filter(a => ['assigned', 'accepted'].includes(a.status))
    .map(a => a.request_id);

  const availableRequests = state.assistance_requests
    .filter(r => r.status === 'approved' && !assignedRequestIds.includes(r.id))
    .map(r => {
      const creator = state.profiles.find(p => p.id === r.user_id);
      return {
        ...r,
        creatorName: creator?.full_name
      };
    });

  res.json({
    activeTasks,
    completedTasks,
    availableRequests,
    profile: vProfile
  });
});

// Accept Assignment
router.post('/tasks/:assignmentId/accept', authenticate, (req: AuthenticatedRequest, res) => {
  const { assignmentId } = req.params;
  const user = req.user!;
  const state = db.getState();

  const vProfile = state.volunteer_profiles.find(v => v.user_id === user.id);
  if (!vProfile) {
    res.status(403).json({ error: 'Volunteer profile required' });
    return;
  }

  const assignment = state.request_assignments.find(a => a.id === assignmentId && a.volunteer_id === vProfile.id);
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found or does not belong to you' });
    return;
  }

  const now = new Date().toISOString();
  assignment.status = 'accepted';
  assignment.updated_at = now;

  const request = state.assistance_requests.find(r => r.id === assignment.request_id);
  if (request) {
    request.status = 'in_progress';
    request.updated_at = now;

    // Notify citizen
    state.notifications.push({
      id: uuidv4(),
      user_id: request.user_id,
      title: 'Volunteer Accepted Your Request',
      message: `${user.full_name} has accepted your assistance request in ${request.location_neighbourhood} and is coordinating next steps.`,
      event_type: 'assignment_accepted',
      related_entity_id: request.id,
      is_read: false,
      created_at: now
    });
  }

  db.save();
  res.json({ message: 'Assignment accepted successfully', assignment, request });
});

// Complete Task (with photo URL & completion notes)
router.post('/tasks/:assignmentId/complete', authenticate, (req: AuthenticatedRequest, res) => {
  const { assignmentId } = req.params;
  const { notes, photoUrl } = req.body;
  const user = req.user!;
  const state = db.getState();

  const vProfile = state.volunteer_profiles.find(v => v.user_id === user.id);
  if (!vProfile) {
    res.status(403).json({ error: 'Volunteer profile required' });
    return;
  }

  const assignment = state.request_assignments.find(a => a.id === assignmentId && a.volunteer_id === vProfile.id);
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found' });
    return;
  }

  const now = new Date().toISOString();
  assignment.status = 'completed';
  assignment.completion_notes = notes || 'Task successfully executed in accordance with SAANS standards.';
  assignment.completion_photo_url = photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
  assignment.updated_at = now;

  const request = state.assistance_requests.find(r => r.id === assignment.request_id);
  if (request) {
    request.status = 'completed';
    request.updated_at = now;

    // Notify requester
    state.notifications.push({
      id: uuidv4(),
      user_id: request.user_id,
      title: 'Assistance Task Completed!',
      message: `Your clean air assistance request #${request.id.slice(0, 8)} has been completed by volunteer ${user.full_name}.`,
      event_type: 'task_completed',
      related_entity_id: request.id,
      is_read: false,
      created_at: now
    });

    // Record impact
    state.impact_records.push({
      id: uuidv4(),
      metric_type: 'volunteer_tasks_completed',
      value: 1,
      related_entity_type: 'request_assignment',
      related_entity_id: assignment.id,
      recorded_at: now,
      methodology_notes: `Task completed by verified volunteer ${user.full_name} for request ${request.category}.`
    });
  }

  db.save();
  res.json({ message: 'Task marked as completed', assignment, request });
});

export default router;
