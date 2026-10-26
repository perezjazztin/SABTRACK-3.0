'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  ExternalLink,
  Recycle,
  Sprout,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { queryEcoBot, getEcoBotPrompts } from '@/lib/api-client';
import {
  ChatQueryResponse,
  QuickPromptItem,
  UpcyclingProject,
} from '@/types/chatbot';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  citations?: ChatQueryResponse['citations'];
  featuredProject?: UpcyclingProject | null;
  suggestedPrompts?: string[];
  isFallback?: boolean;
}

const DEFAULT_PROMPTS: QuickPromptItem[] = [
  {
    id: 'p1',
    category: 'SCHEDULE',
    prompt: 'Kailan ang hakot ng basura sa aming Purok?',
    icon: 'Calendar',
  },
  {
    id: 'p2',
    category: 'SEGREGATION',
    prompt: 'Ano ang tamang pagbubukod ng basura sa ilalim ng RA 9003?',
    icon: 'ShieldCheck',
  },
  {
    id: 'p3',
    category: 'UPCYCLING',
    prompt: 'Paano gawing pataba ang mga balat ng gulay at prutas?',
    icon: 'Sprout',
  },
  {
    id: 'p4',
    category: 'RECYCLING',
    prompt: 'Self-watering planter mula sa plastic bottles',
    icon: 'Recycle',
  },
];

export const EcoBotWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<QuickPromptItem[]>(DEFAULT_PROMPTS);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Mabuhay! Ako si **EcoBot**, ang iyong friendly civic assistant para sa Barangay Sabang. Narito ako upang tumulong sa opisyal na iskedyul ng hakot, tamang pagbubukod ng basura (RA 9003), mga ideya sa pagre-recycle, o anumang katanungan mo.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        'Kailan ang hakot sa aming Purok?',
        'Tamang pagbubukod ng basura (RA 9003)',
        'Paano gumawa ng compost mula sa kitchen scraps?',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    getEcoBotPrompts()
      .then((data) => {
        if (data && data.length > 0) setPrompts(data);
      })
      .catch(() => {
        // Retain default prompts on network/auth error
      });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Mabuhay! Ako si **EcoBot**, ang iyong friendly civic assistant para sa Barangay Sabang. Narito ako upang tumulong sa opisyal na iskedyul ng hakot, tamang pagbubukod ng basura (RA 9003), mga ideya sa pagre-recycle, o anumang katanungan mo.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          'Kailan ang hakot sa aming Purok?',
          'Tamang pagbubukod ng basura (RA 9003)',
          'Paano gumawa ng compost mula sa kitchen scraps?',
        ],
      },
    ]);
    setInputMessage('');
    setExpandedProject(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    // Build context history from existing conversation turns (excluding welcome message)
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

    try {
      const res = await queryEcoBot({
        message: query,
        area_id: user?.area_id || null,
        history: historyPayload,
      });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations,
        featuredProject: res.featured_project,
        suggestedPrompts: res.suggested_prompts,
        isFallback: res.is_fallback,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (res.featured_project) {
        setExpandedProject(res.featured_project.id);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: 'Paumanhin, pansamantalang hindi maabot ang server. Maaari ninyong subukan muli o tingnan ang mga opisyal na iskedyul sa resident portal.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: DEFAULT_PROMPTS.map((p) => p.prompt).slice(0, 3),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Sprout':
        return <Sprout className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Calendar':
        return <Calendar className="w-3.5 h-3.5 text-teal-600" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />;
      default:
        return <Recycle className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const formatInline = (str: string): string => {
    let s = str.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-extrabold text-slate-900">$1</strong>'
    );
    s = s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-semibold hover:text-emerald-900 inline-flex items-center gap-0.5">$1</a>'
    );
    return s;
  };

  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('• ') ||
        trimmed.startsWith('* ') ||
        trimmed.startsWith('- ')
      ) {
        const text = trimmed.replace(/^([•*-]\s*)/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <span
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatInline(text) }}
            />
          </div>
        );
      }
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
              {numMatch[1]}
            </span>
            <span
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }}
            />
          </div>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p
          key={idx}
          className="my-0.5 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans select-none">
      {/* Floating Trigger Button (When Closed) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open EcoBot Chat Assistant"
          className="neu-button flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full bg-gradient-to-r from-white to-white border border-slate-200/80 shadow-neu-raised hover:shadow-neu-raised-hover hover:scale-105 active:scale-95 transition-all group"
        >
          {/* Avatar with Pinned Online Indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-neu-green group-hover:scale-105 transition-all">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          {/* Clean Label */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-800 tracking-tight">
              EcoBot
            </span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 uppercase tracking-wider">
              AI
            </span>
          </div>
        </button>
      )}

      {/* Expanded Chat Drawer Card */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className={`neu-card rounded-3xl border border-slate-200/80 shadow-neu-raised flex flex-col overflow-hidden transition-all duration-300 w-[94vw] sm:w-[420px] ${
            isMinimized ? 'h-16' : 'h-[600px] max-h-[88vh]'
          }`}
          role="dialog"
          aria-label="EcoBot Chat Window"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50/60 border-b border-slate-200/70 flex items-center justify-between shadow-neu-xs flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-neu-green border border-white/40">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white" />
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">EcoBot</h3>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 tracking-wide uppercase">
                    Sabang AI
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800/80 font-bold tracking-tight">
                  Barangay Sabang Civic Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleResetChat()}
                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                title="Bagong Usapan (Reset)"
                aria-label="Reset chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-all"
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Body & Messages (Hidden if minimized) */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#f4f8f5]">
                {/* Initial Quick Suggestion Chips */}
                {messages.length === 1 && (
                  <div className="space-y-2.5 pt-1 pb-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Mabilis na mga katanungan:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {prompts.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSendMessage(p.prompt)}
                          className="neu-card-interactive text-left p-3 rounded-2xl border border-white/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between group bg-gradient-to-br from-white to-white"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-lg bg-emerald-100/80 text-emerald-700 flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                              {getIconComponent(p.icon)}
                            </div>
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700 transition-colors">
                              {p.category}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-900 leading-snug line-clamp-2">
                            {p.prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages Stream */}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    } space-y-1.5`}
                  >
                    {m.sender === 'user' ? (
                      <div className="p-3.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-medium shadow-neu-xs text-[11px] sm:text-xs">
                        {m.text}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 max-w-[95%]">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-neu-xs flex-shrink-0 mt-0.5 border border-white/50">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-white/95 rounded-2xl rounded-tl-sm p-4 border border-emerald-100/90 shadow-neu-xs text-slate-800 space-y-2.5 flex-1 overflow-hidden">
                          <div className="text-[11px] sm:text-xs leading-relaxed text-slate-800">
                            {renderFormattedText(m.text)}
                          </div>

                          {/* Featured Project Blueprint if detected */}
                          {m.featuredProject && (
                            <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-neu-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  DIY Upcycling Blueprint
                                </span>
                                <button
                                  onClick={() =>
                                    setExpandedProject(
                                      expandedProject === m.featuredProject?.id
                                        ? null
                                        : m.featuredProject?.id || null
                                    )
                                  }
                                  className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 hover:underline"
                                >
                                  <span>
                                    {expandedProject === m.featuredProject.id
                                      ? 'Itago ang Hakbang'
                                      : 'Tingnan ang Hakbang'}
                                  </span>
                                  {expandedProject === m.featuredProject.id ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              <h4 className="font-extrabold text-slate-900 text-xs">
                                {m.featuredProject.title}
                              </h4>

                              {expandedProject === m.featuredProject.id && (
                                <div className="space-y-2 pt-2 border-t border-emerald-200/60 text-[11px] text-slate-700">
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wide">
                                      Mga Kakailanganin:
                                    </span>
                                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1 mt-0.5">
                                      {m.featuredProject.materials_needed.map((mat, idx) => (
                                        <li key={idx}>{mat}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="space-y-1.5 pt-1">
                                    <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wide">
                                      Hakbang sa Paggawa:
                                    </span>
                                    {m.featuredProject.steps.map((st) => (
                                      <div
                                        key={st.step_number}
                                        className="p-2 rounded-xl bg-white border border-emerald-100 shadow-neu-xs flex items-start gap-2"
                                      >
                                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-extrabold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                          {st.step_number}
                                        </span>
                                        <div className="flex-1">
                                          <strong className="text-slate-900 font-bold block text-[10px]">
                                            {st.title}
                                          </strong>
                                          <span className="text-slate-600 text-[11px] leading-relaxed">
                                            {st.instruction}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Web Grounding Citations */}
                          {m.citations && m.citations.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                Mga Sanggunian at Batayan:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.citations.map((cite, i) => (
                                  <a
                                    key={i}
                                    href={cite.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="neu-chip inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:border-emerald-400 transition-colors"
                                  >
                                    <span className="truncate max-w-[150px]">{cite.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 text-emerald-600" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 px-1 font-mono">
                      {m.timestamp}
                    </span>

                    {/* Suggested follow-up prompt pills below bot message */}
                    {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 pl-9 max-w-[92%]">
                        {m.suggestedPrompts.map((sp, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(sp)}
                            className="neu-chip text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 px-3 py-1 rounded-full border border-emerald-200 transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{sp}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading / Typing Indicator Animation */}
                {loading && (
                  <div className="flex items-start gap-2.5 max-w-[85%] animate-fadeIn">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-neu-xs flex-shrink-0 mt-0.5 border border-white/50">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white/95 rounded-2xl rounded-tl-sm p-3.5 border border-emerald-100 shadow-neu-xs flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Nagsusulat si EcoBot...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200/70 shadow-neu-xs flex-shrink-0">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder="Tanungin si EcoBot (e.g. iskedyul, tamang pagbukod)..."
                    className="neu-input w-full pl-4 pr-12 py-3 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || loading}
                    className="neu-btn-primary absolute right-1.5 p-2 rounded-xl text-white shadow-neu-green disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    aria-label="Send message to EcoBot"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 px-1 font-medium">
                  <span>EcoBot v3.0 &bull; Barangay Sabang</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> RA 10173 Protected
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
