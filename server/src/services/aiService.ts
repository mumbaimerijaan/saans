import { config } from '../config/env.js';
import { db } from '../db/index.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  modelUsed: string;
  isFallback: boolean;
  structuredData?: any;
  language: 'en' | 'hi' | 'mr';
}

const SYSTEM_PROMPT = `You are SAANS AI, an intelligent community clean air assistant for India.
Your mission is to help families and urban communities actively navigate severe winter smog and urban air pollution with actionable, daily solutions tailored to ANY Indian city or location the user asks about (including Mumbai, Delhi, Pune, Bengaluru, Kolkata, Chennai, Hyderabad, etc.).

CORE PRINCIPLES & SAFETY GUIDELINES:
1. STRICT MEDICAL SAFETY: You are an environmental and hardware guidance assistant, NOT a medical doctor. NEVER diagnose illnesses, NEVER prescribe medication, and NEVER make absolute health guarantees. Always advise consulting registered medical professionals for symptoms.
2. LOCATION TAILORING: Ground your advice in the specific meteorological and emission realities of the requested city (e.g., winter thermal inversions & agricultural smoke in Delhi/NCR; coastal sea breeze & vehicular density in Mumbai; particulate build-up in Bengaluru/Pune). NEVER refuse a city or add rigid disclaimers stating you only know Mumbai.
3. HARDWARE & DIY INTEGRITY: DIY air purifiers (such as Corsi-Rosenthal boxes) are community-level particle reduction solutions; they are NOT medically certified commercial devices. Emphasize safe electrical practices, proper sealing, unobstructed airflow, and regular filter changes. Never suggest unauthorized electrical rewiring.
4. GROUNDING & HONESTY: NEVER invent air quality readings, fake equipment availability, or fake volunteer contacts. Refer to live data from the SAANS platform.
5. ACTIONABLE & TACTICAL: Provide practical low-emission routines (carpooling, public transit, low-emission cooking, wet mopping over dry sweeping, window sealing during smog peaks) and indoor air quality hacks.
6. MULTI-LINGUAL SUPPORT: Communicate fluently in English, Hindi (हिन्दी), and Marathi (मराठी) depending on user preference.

Brand Tagline: SAANS — Because every breath matters.`;

export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async generateChatResponse(
    messages: ChatMessage[],
    language: 'en' | 'hi' | 'mr' = 'en',
    userContext?: {
      city?: string;
      neighbourhood?: string;
      household?: any;
      activeAqi?: number | null;
      role?: string;
    }
  ): Promise<AIResponse> {
    const contextPrompt = userContext ? `
CURRENT USER CONTEXT:
- City: ${userContext.city || 'Mumbai'}
- Neighbourhood: ${userContext.neighbourhood || 'Central Mumbai'}
- Current Indian AQI: ${userContext.activeAqi ?? 'Unavailable'}
- Role: ${userContext.role || 'Citizen'}
- Household Details: ${JSON.stringify(userContext.household || {})}
- Requested Language: ${language}
` : '';

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextPrompt },
      ...messages
    ];

    if (config.openrouterApiKey) {
      // Try primary model, then fallback model
      const modelsToTry = [config.openrouterModel, config.openrouterFallbackModel];

      for (const model of modelsToTry) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.openrouterApiKey}`,
              'HTTP-Referer': config.frontendUrl,
              'X-Title': 'SAANS Clean Air Platform'
            },
            body: JSON.stringify({
              model,
              messages: fullMessages,
              temperature: 0.7,
              max_tokens: 1000
            }),
            signal: AbortSignal.timeout(12000)
          });

          if (res.ok) {
            const data: any = await res.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) {
              return {
                content: reply,
                modelUsed: model,
                isFallback: false,
                language
              };
            }
          } else {
            console.warn(`OpenRouter model ${model} failed with HTTP ${res.status}`);
          }
        } catch (err) {
          console.warn(`OpenRouter error with model ${model}:`, err);
        }
      }
    }

    // Grounded expert fallback engine when OpenRouter API key is not present or offline
    return this.generateExpertFallbackResponse(messages, language, userContext);
  }

  // Structured DIY Purifier Sizing & Guidance
  public calculateRoomPurifierCADR(
    lengthFt: number,
    widthFt: number,
    heightFt: number,
    targetACH: number = 5
  ): {
    volumeCuFt: number;
    volumeCuM: number;
    requiredCadrCfm: number;
    requiredCadrM3h: number;
    recommendedSystem: string;
    filterCount: number;
    fanRecommendation: string;
    safetyNotes: string[];
  } {
    const volumeCuFt = lengthFt * widthFt * heightFt;
    const volumeCuM = volumeCuFt * 0.0283168;
    // CADR (CFM) = Volume (cu ft) * ACH / 60
    const requiredCadrCfm = Math.round((volumeCuFt * targetACH) / 60);
    // CADR (m3/h) = Volume (cu m) * ACH
    const requiredCadrM3h = Math.round(volumeCuM * targetACH);

    let recommendedSystem = 'Standard 1-Filter Box Fan Purifier';
    let filterCount = 1;
    let fanRecommendation = 'Orient / Crompton 20" (500mm) High-Flow Box Fan';

    if (requiredCadrM3h > 450) {
      recommendedSystem = '4-Filter Corsi-Rosenthal Cube (MERV 13)';
      filterCount = 4;
      fanRecommendation = 'Heavy-duty 20-inch 3-speed Box Fan (minimum 1200 CFM static pressure capability)';
    } else if (requiredCadrM3h > 250) {
      recommendedSystem = '2-Filter Compac-V Corsi-Rosenthal System';
      filterCount = 2;
      fanRecommendation = 'Standard 16" to 20" Box Fan or High Static Pressure Axial Fan';
    }

    return {
      volumeCuFt: Math.round(volumeCuFt),
      volumeCuM: parseFloat(volumeCuM.toFixed(1)),
      requiredCadrCfm,
      requiredCadrM3h,
      recommendedSystem,
      filterCount,
      fanRecommendation,
      safetyNotes: [
        'Always ensure electrical cord has no frays and fan motor has thermal fuse protection.',
        'Seal all cardboard filter joints airtight with duct tape or painter tape to eliminate bypass air.',
        'Do not obstruct the intake face or place fabrics within 1.5 feet of filters.',
        'DIY units provide particle filtration but are not certified medical grade devices.'
      ]
    };
  }

  private generateExpertFallbackResponse(
    messages: ChatMessage[],
    language: 'en' | 'hi' | 'mr',
    userContext?: any
  ): AIResponse {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
    const aqi = userContext?.activeAqi ?? 165;

    let reply = '';

    if (language === 'hi') {
      if (lastUserMessage.includes('diy') || lastUserMessage.includes('purifier') || lastUserMessage.includes('प्यूरिफायर')) {
        reply = `**SAANS DIY एयर प्यूरिफायर निर्माण गाइड (Corsi-Rosenthal Box):**\n\n1. **सामग्री:** 1x 20-इंच बॉक्स फैन, 4x MERV 13 या HEPA-ग्रेड फिल्टर, डक्ट टेप, कार्डबोर्ड बेस।\n2. **असेंबली:** फिल्टरों को एक चौकोर बॉक्स के आकार में रखें (तीर का निशान अंदर की ओर रखें)। बेस पर कार्डबोर्ड लगाएं और सभी कोनों को डक्ट टेप से एयरटाइट सील करें। पंखे को ऊपर रखें ताकि हवा ऊपर की ओर निकले।\n3. **सुरक्षा निर्देश:** पंखे की मोटर को ढकें नहीं, और बिजली के तारों पर पानी या नमी से बचाव रखें।\n\n💡 *यह DIY यूनिट कमरे में PM2.5 कणों को 70-85% तक कम करने में सक्षम है, लेकिन यह कोई मेडिकल डिवाइस नहीं है।*`;
      } else if (lastUserMessage.includes('smog') || lastUserMessage.includes('air') || lastUserMessage.includes('धुंध') || lastUserMessage.includes('प्रदूषण')) {
        reply = `**वर्तमान वायु गुणवत्ता सुरक्षा सुझाव (मुंबई - AQI: ${aqi}):**\n\n- **घर के भीतर:** सुबह और शाम के समय जब स्मॉग अधिक हो, खिड़कियां और बालकनी के दरवाजे बंद रखें।\n- **सफाई:** झाड़ू लगाने की जगह गीला पोंछा लगाएं ताकि धूल हवा में न फैले।\n- **बाहर जाते समय:** साधारण कपड़े के मास्क की जगह ISI-प्रमाणित N95 / FFP2 मास्क का उपयोग करें।\n- **स्वास्थ्य सतर्कता:** बुजुर्गों और बच्चों को भारी शारीरिक व्यायाम बाहर करने से बचना चाहिए। किसी भी सांस की तकलीफ में तुरंत डॉक्टर से संपर्क करें।`;
      } else {
        reply = `नमस्ते! मैं SAANS AI समुदाय सहायक हूँ। मैं आपको DIY एयर प्यूरिफायर बनाने, नजदीकी स्वच्छ वायु केंद्र (Clean Air Facilities) ढूंढने, उपकरण उधार लेने या स्वयंसेवक (Volunteer) सहायता प्राप्त करने में मदद कर सकता हूँ। आप किस विषय में जानकारी चाहते हैं?`;
      }
    } else if (language === 'mr') {
      if (lastUserMessage.includes('diy') || lastUserMessage.includes('purifier') || lastUserMessage.includes('फिल्टर')) {
        reply = `**SAANS DIY एअर प्युरिफायर मार्गदर्शक (Corsi-Rosenthal Box):**\n\n1. **साहित्य:** १ बॉक्स फॅन (२० इंच), ४ MERV-१३ किंवा HEPA फिल्टर्स, डक्ट टेप, कार्डबोर्ड.\n2. **जोडणी:** ४ फिल्टर्स चौकोनी आकारात ठेवा (हवेचा बाण आतल्या बाजूने). तळाशी कार्डबोर्ड लावून सर्व सांधे डक्ट टेपने सील करा. वर पंखा बसवा.\n3. **काळजी:** विद्युत तारांची सुरक्षितता तपासा. पंख्यावर पाणी पडू देऊ नका.\n\n💡 *हा DIY प्युरिफायर घरातील PM2.5 धुलिकण लक्षणीयरीत्या कमी करतो.*`;
      } else {
        reply = `नमस्कार! मी SAANS AI समुदाय सहाय्यक आहे. मुंबईतील हवेचे प्रदूषण कमी करण्यासाठी आणि स्वतःचे रक्षण करण्यासाठी मी तुम्हाला मदत करू शकतो. आपण DIY प्युरिफायर, स्वच्छ हवा केंद्रे किंवा स्वयंसेवक सहाय्याबद्दल विचारू शकता.`;
      }
    } else {
      // English
      if (lastUserMessage.includes('cadr') || lastUserMessage.includes('room') || lastUserMessage.includes('calculate')) {
        reply = `**Air Purifier Sizing Recommendation:**\n\nFor a standard room in Mumbai (approx 15 x 12 ft with 10 ft ceilings = 1,800 cu ft):\n- **Target Air Changes per Hour (ACH):** 5 ACH for severe winter smog.\n- **Required CADR:** ~150 CFM (~255 m³/h).\n- **Best Options:** A Corsi-Rosenthal 2-filter compac box or a certified 250+ m³/h HEPA purifier (e.g. Philips AC1215/2000i).\n- **Tips:** Position the unit centrally or near sleeping zones away from window drafts for maximum air capture.`;
      } else if (lastUserMessage.includes('diy') || lastUserMessage.includes('build') || lastUserMessage.includes('corsi') || lastUserMessage.includes('purifier')) {
        reply = `**DIY Corsi-Rosenthal Air Purifier Build Guide:**\n\n1. **Components Checklist:**\n   - 1x 20-inch Box Fan (e.g. Orient or compatible flat-blade fan)\n   - 4x MERV 13 (or HEPA H11/H13 compatible) 20"x20" furnace filters\n   - 1x Heavy-duty roll of Duct Tape\n   - Cardboard bottom base & cardboard shroud cutout\n\n2. **Assembly Steps:**\n   - Arrange 4 filters in a square cube with airflow direction arrows pointing INWARD.\n   - Tape all vertical edges tightly with duct tape.\n   - Fasten the cardboard base to the bottom.\n   - Place the fan on top blowing OUTWARD (upwards), and seal the perimeter.\n   - Add a cardboard circular shroud on the fan face to eliminate corner backdrafts.\n\n⚠️ **Safety Note:** Never obstruct the intake, do not leave running unattended around water, and inspect electrical wiring regularly. This provides mechanical particle filtration and is not a medical device.`;
      } else if (lastUserMessage.includes('smog') || lastUserMessage.includes('protect') || lastUserMessage.includes('hack') || lastUserMessage.includes('routine')) {
        reply = `**Practical Winter Smog Action Plan for Urban Households:**\n\n1. **Indoor Air Protection:**\n   - **Window Timing:** Keep windows closed during thermal inversion hours (06:00 - 10:00 AM and 07:00 - 11:00 PM).\n   - **Cleaning Protocol:** Switch exclusively to wet mopping. Dry broom sweeping resuspends deposited PM2.5 and PM10 particles into the breathing zone.\n   - **Cooking Emissions:** Run kitchen exhaust fans during cooking; minimize deep frying or dry chili roasting during high smog days.\n\n2. **Outdoor & Commute Routine:**\n   - Wear a well-fitted ISI-certified N95 / FFP2 mask when commuting near major traffic arteries like WEH or SV Road.\n   - Cloth and surgical masks do not filter fine respirable particles (<2.5 µm).\n\n3. **Community Action:**\n   - Report open waste burning or construction dust directly via the SAANS Community Report tool so municipal ward officers are notified.`;
      } else {
        reply = `Hello! I am **SAANS AI**, your community clean air assistant. I can help you with:\n\n- **DIY Air Purifier Lab:** Step-by-step instructions, CADR calculator, and component compatibility.\n- **Assistance Requests:** Sizing and requesting purifiers or volunteer installation assistance.\n- **Indoor Air Quality Hacks:** Daily routines to shield your family during severe winter smog episodes.\n- **Clean Air Facilities:** Finding verified public air-filtered sanctuaries in Mumbai.\n\nHow can I help you take action today?`;
      }
    }

    return {
      content: reply,
      modelUsed: config.openrouterApiKey ? 'OpenRouter Fallback' : 'SAANS Expert Clean Air Model (Built-in)',
      isFallback: true,
      language
    };
  }
}

export const aiService = AIService.getInstance();
