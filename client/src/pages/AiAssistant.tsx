import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Globe2,
  RefreshCw,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isFallback?: boolean;
  modelUsed?: string;
}

export const AiAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am **SAANS AI**, your community clean air assistant for Mumbai, Delhi, and cities across India.

I can help you:
- **Build DIY Purifiers:** Step-by-step Corsi-Rosenthal blueprints, CADR sizing & filter compatibility.
- **Indoor Air Quality Hacks:** Wet mopping protocols, window sealing schedules during thermal smog inversions.
- **Location-Tailored Guidance:** Dynamic guidance for families, students, and asthmatics across Indian cities.
- **Languages:** Ask me in English, **हिन्दी**, or **मराठी**!

*Please note: I provide environmental and hardware recommendations based on CPCB guidelines, not medical advice.* How can I help you take action today?`,
    }
  ]);

  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const suggestedPrompts = [
    { text: 'What daily clean air routines protect a family with elderly & kids at home?', lang: 'en' as const },
    { text: 'How do students protect cognitive focus during winter exam season?', lang: 'en' as const },
    { text: 'How do I build a DIY Corsi-Rosenthal box purifier with Indian box fans?', lang: 'en' as const },
    { text: 'दिल्ली में स्मॉग और इनवर्जन के दौरान घर को सुरक्षित रखने के उपाय?', lang: 'hi' as const },
    { text: 'मुंबई व पुण्यासाठी घरगुती प्युरिफायर आणि स्वच्छ हवेचे उपाय सांगा.', lang: 'mr' as const },
  ];

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    // Detect target city mentioned in user prompt or fall back to user's registered city
    let targetCity = user?.city || 'Mumbai';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('delhi') || lowerText.includes('ncr')) targetCity = 'Delhi';
    else if (lowerText.includes('pune')) targetCity = 'Pune';
    else if (lowerText.includes('bengaluru') || lowerText.includes('bangalore')) targetCity = 'Bengaluru';
    else if (lowerText.includes('kolkata')) targetCity = 'Kolkata';
    else if (lowerText.includes('chennai')) targetCity = 'Chennai';

    // Strip leading greeting so messages sent to AI model always begin with user role
    const outgoingMessages = newHistory
      .filter((_, idx) => idx > 0 || newHistory[0].role === 'user')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await api.sendAiChat(
        outgoingMessages,
        language,
        185,
        targetCity,
        user?.neighbourhood || 'Bandra West'
      );

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.content,
          isFallback: res.isFallback,
          modelUsed: res.modelUsed
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with the AI service. Please verify your connection or try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-8 text-slate-100 flex flex-col">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col space-y-4">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">
              <Bot className="w-3.5 h-3.5" />
              GenAI Community Clean Air Copilot
            </div>
            <h1 className="text-2xl font-extrabold text-white font-display">
              SAANS Intelligent Assistant
            </h1>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-[#11181c] border border-slate-800 p-1 rounded-xl text-xs">
            <Globe2 className="w-3.5 h-3.5 text-teal-400 ml-1.5" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                language === 'en' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                language === 'hi' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                language === 'mr' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200">Public Health & Engineering Guardrails:</strong> SAANS AI does not prescribe medication or diagnose medical symptoms. Recommendations follow CPCB and WHO environmental science. Never bypass fan safety cages or perform unsafe electrical rewiring.
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 rounded-2xl bg-[#11181c] border border-slate-800 shadow-2xl flex flex-col h-[560px] overflow-hidden">
          
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-[#162024] border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.role === 'assistant' && msg.modelUsed && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Engine: {msg.modelUsed}</span>
                      {msg.isFallback && <span className="text-teal-400">Grounded Mode</span>}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 p-3 rounded-xl bg-[#162024] border border-slate-800">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Synthesizing clean air guidance...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="p-3 bg-[#141b1f] border-t border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 font-semibold pl-1">
                <Sparkles className="w-3 h-3 text-teal-400" />
                Suggested:
              </span>
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLanguage(p.lang);
                    handleSend(p.text);
                  }}
                  className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-white transition-all text-xs"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3.5 bg-[#162024] border-t border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'SAANS AI से पूछें (उदा. DIY प्यूरिफायर, सुरक्षा उपाय)...'
                    : language === 'mr'
                    ? 'SAANS AI ला विचारा (उदा. DIY प्युरिफायर, स्वच्छ हवा केंद्रे)...'
                    : 'Ask about DIY purifier CADR, smog mitigation, equipment loans...'
                }
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
