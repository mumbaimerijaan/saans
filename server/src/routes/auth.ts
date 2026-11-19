import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from '../config/env.js';
import { db, Profile, UserRole, HouseholdProfile } from '../db/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  city: z.string().default('Mumbai'),
  neighbourhood: z.string().default('Bandra West'),
  preferredLanguage: z.enum(['en', 'hi', 'mr']).default('en'),
  accountType: z.enum(['citizen', 'volunteer', 'donor', 'admin']).default('citizen'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  household: z.object({
    memberCount: z.number().default(3),
    elderlyPresent: z.boolean().default(false),
    childrenPresent: z.boolean().default(false),
    sensitivePersons: z.boolean().default(false),
    housingType: z.string().default('Apartment'),
    roomSizeSqft: z.number().default(200),
    existingPurifiers: z.string().optional()
  }).optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Register
router.post('/register', async (req, res) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const state = db.getState();

    const existing = state.profiles.find(p => p.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const newProfile: Profile = {
      id: userId,
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      full_name: data.fullName,
      phone: data.phone,
      city: data.city,
      neighbourhood: data.neighbourhood,
      preferred_language: data.preferredLanguage,
      account_type: data.accountType,
      latitude: data.latitude || 19.0760,
      longitude: data.longitude || 72.8777,
      created_at: now,
      updated_at: now
    };

    state.profiles.push(newProfile);

    // Assign Role
    const newRole: UserRole = {
      id: uuidv4(),
      user_id: userId,
      role: data.accountType,
      granted_at: now
    };
    state.user_roles.push(newRole);

    // Household profile if provided
    if (data.household) {
      const newHousehold: HouseholdProfile = {
        id: uuidv4(),
        user_id: userId,
        member_count: data.household.memberCount,
        elderly_present: data.household.elderlyPresent,
        children_present: data.household.childrenPresent,
        sensitive_persons: data.household.sensitivePersons,
        housing_type: data.household.housingType,
        room_size_sqft: data.household.roomSizeSqft,
        existing_purifiers: data.household.existingPurifiers,
        created_at: now,
        updated_at: now
      };
      state.household_profiles.push(newHousehold);
    }

    // Auto-create volunteer profile if registered as volunteer
    if (data.accountType === 'volunteer') {
      state.volunteer_profiles.push({
        id: uuidv4(),
        user_id: userId,
        service_radius_km: 10,
        experience_years: 1,
        bio: 'Newly registered community volunteer.',
        languages: [data.preferredLanguage],
        is_verified: false,
        status: 'active',
        created_at: now,
        updated_at: now
      });
    }

    db.save();

    const token = jwt.sign(
      { userId: newProfile.id, email: newProfile.email, role: newProfile.account_type },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: newProfile.id,
        email: newProfile.email,
        fullName: newProfile.full_name,
        phone: newProfile.phone,
        city: newProfile.city,
        neighbourhood: newProfile.neighbourhood,
        preferredLanguage: newProfile.preferred_language,
        accountType: newProfile.account_type,
        roles: [newProfile.account_type]
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Registration failed', message: err.message });
    }
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const state = db.getState();

    const user = state.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    let isValid = false;
    if (user.password_hash) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Default fallback password for initial mock profiles
      isValid = (password === 'password123');
    }

    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const roles = state.user_roles.filter(r => r.user_id === user.id).map(r => r.role);
    if (!roles.includes(user.account_type)) {
      roles.push(user.account_type);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.account_type },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        city: user.city,
        neighbourhood: user.neighbourhood,
        preferredLanguage: user.preferred_language,
        accountType: user.account_type,
        roles
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'Login failed', message: err.message });
    }
  }
});

// Current Authenticated Profile
router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const state = db.getState();
  const household = state.household_profiles.find(h => h.user_id === user.id);
  const volunteer = state.volunteer_profiles.find(v => v.user_id === user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      city: user.city,
      neighbourhood: user.neighbourhood,
      preferredLanguage: user.preferred_language,
      accountType: user.account_type,
      latitude: user.latitude,
      longitude: user.longitude,
      roles: user.roles
    },
    household,
    volunteer
  });
});

// Update Household Profile
router.put('/household', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const state = db.getState();
  const now = new Date().toISOString();

  let household = state.household_profiles.find(h => h.user_id === user.id);

  if (household) {
    household.member_count = req.body.memberCount ?? household.member_count;
    household.elderly_present = req.body.elderlyPresent ?? household.elderly_present;
    household.children_present = req.body.childrenPresent ?? household.children_present;
    household.sensitive_persons = req.body.sensitivePersons ?? household.sensitive_persons;
    household.housing_type = req.body.housingType ?? household.housing_type;
    household.room_size_sqft = req.body.roomSizeSqft ?? household.room_size_sqft;
    household.existing_purifiers = req.body.existingPurifiers ?? household.existing_purifiers;
    household.updated_at = now;
  } else {
    household = {
      id: uuidv4(),
      user_id: user.id,
      member_count: req.body.memberCount || 3,
      elderly_present: !!req.body.elderlyPresent,
      children_present: !!req.body.childrenPresent,
      sensitive_persons: !!req.body.sensitivePersons,
      housing_type: req.body.housingType || 'Apartment',
      room_size_sqft: req.body.roomSizeSqft || 200,
      existing_purifiers: req.body.existingPurifiers,
      created_at: now,
      updated_at: now
    };
    state.household_profiles.push(household);
  }

  db.save();
  res.json({ message: 'Household profile updated successfully', household });
});

export default router;
