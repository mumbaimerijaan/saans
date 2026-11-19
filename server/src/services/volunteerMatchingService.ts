import { db, VolunteerProfile, VolunteerSkill, AssistanceRequest } from '../db/index.js';

export interface VolunteerMatch {
  volunteerProfile: VolunteerProfile;
  volunteerUser: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    neighbourhood: string;
    city: string;
  };
  distanceKm: number;
  matchingSkills: string[];
  matchScore: number; // 0 to 100
  rationale: string;
}

export class VolunteerMatchingService {
  private static instance: VolunteerMatchingService;

  private constructor() {}

  public static getInstance(): VolunteerMatchingService {
    if (!VolunteerMatchingService.instance) {
      VolunteerMatchingService.instance = new VolunteerMatchingService();
    }
    return VolunteerMatchingService.instance;
  }

  // Haversine formula for distance between coordinates in km
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  public findMatchesForRequest(request: AssistanceRequest): VolunteerMatch[] {
    const state = db.getState();
    const reqLat = request.latitude || 19.0760;
    const reqLon = request.longitude || 72.8777;

    // Determine required skills based on category
    const requiredSkillsMap: Record<string, string[]> = {
      diy_installation: ['installation', 'general', 'electrical'],
      equipment_repair: ['repair', 'electrical'],
      filter_replacement: ['installation', 'general'],
      purifier_loan: ['logistics', 'general', 'installation'],
      purifier_donation: ['logistics', 'general'],
      protective_gear: ['logistics', 'health_edu'],
      iaq_assessment: ['awareness', 'general'],
      facility_access: ['general', 'logistics'],
      other: ['general']
    };

    const targetSkills = requiredSkillsMap[request.category] || ['general'];

    const matches: VolunteerMatch[] = [];

    for (const vProfile of state.volunteer_profiles) {
      if (vProfile.status !== 'active') continue;

      const user = state.profiles.find(p => p.id === vProfile.user_id);
      if (!user) continue;

      const vLat = user.latitude || 19.0760;
      const vLon = user.longitude || 72.8777;
      const distance = this.calculateDistance(reqLat, reqLon, vLat, vLon);

      // Check service radius boundary
      if (distance > vProfile.service_radius_km) {
        continue;
      }

      // Check skills
      const vSkills = state.volunteer_skills.filter(s => s.volunteer_id === vProfile.id);
      const vSkillCategories = vSkills.map(s => s.skill_category);
      const matchedSkills = targetSkills.filter(sk => vSkillCategories.includes(sk as any));

      let score = 50; // base score

      // Distance score (closer = higher)
      const distanceFactor = Math.max(0, 30 - distance * 2);
      score += distanceFactor;

      // Skill match score
      if (matchedSkills.length > 0) {
        score += matchedSkills.length * 10;
      }

      // Verification bonus
      if (vProfile.is_verified) {
        score += 10;
      }

      // Experience bonus
      score += Math.min(10, vProfile.experience_years * 2);

      const finalScore = Math.min(100, Math.round(score));

      matches.push({
        volunteerProfile: vProfile,
        volunteerUser: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          neighbourhood: user.neighbourhood,
          city: user.city
        },
        distanceKm: distance,
        matchingSkills: matchedSkills.length > 0 ? matchedSkills : ['general availability'],
        matchScore: finalScore,
        rationale: `Located ${distance} km away in ${user.neighbourhood} (within ${vProfile.service_radius_km} km radius). Has relevant experience (${vProfile.experience_years} yrs) with skills in ${vSkillCategories.join(', ')}.`
      });
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const volunteerMatchingService = VolunteerMatchingService.getInstance();
