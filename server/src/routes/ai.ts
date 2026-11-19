import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/aiService.js';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db/index.js';

const router = Router();

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1)
  })),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  activeAqi: z.number().nullable().optional(),
  city: z.string().optional(),
  neighbourhood: z.string().optional()
});

const CadrCalculatorSchema = z.object({
  lengthFt: z.number().min(5).max(100),
  widthFt: z.number().min(5).max(100),
  heightFt: z.number().min(6).max(25).default(10),
  targetACH: z.number().min(2).max(10).default(5)
});

// AI Chat Interaction
router.post('/chat', optionalAuthenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const data = ChatRequestSchema.parse(req.body);
    const user = req.user;
    const state = db.getState();

    let household = undefined;
    if (user) {
      household = state.household_profiles.find(h => h.user_id === user.id);
    }

    const userContext = {
      city: data.city || user?.city || 'Mumbai',
      neighbourhood: data.neighbourhood || user?.neighbourhood || 'Central Mumbai',
      role: user?.account_type || 'Citizen',
      activeAqi: data.activeAqi,
      household
    };

    const response = await aiService.generateChatResponse(
      data.messages,
      data.language,
      userContext
    );

    res.json(response);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'AI processing failed', message: err.message });
    }
  }
});

// DIY Room CADR Calculator
router.post('/diy-cadr', (req, res) => {
  try {
    const data = CadrCalculatorSchema.parse(req.body);
    const result = aiService.calculateRoomPurifierCADR(
      data.lengthFt,
      data.widthFt,
      data.heightFt,
      data.targetACH
    );
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
    } else {
      res.status(500).json({ error: 'CADR calculation failed', message: err.message });
    }
  }
});

export default router;
