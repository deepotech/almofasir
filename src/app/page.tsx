'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InterpreterSelector from '@/components/InterpreterSelector';
import PaywallModal from '@/components/common/PaywallModal';
import { dreamSymbols, symbolCategories } from '@/data/symbols';
import { classicInterpreters } from '@/data/interpreters';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { humanInterpreters, HumanInterpreter } from '@/data/human_interpreters';

// AI Interpretation Mock (simulates AI analysis)
interface InterpretationResult {
  symbols: { name: string; icon: string; brief: string }[];
  initialInterpretation: string;
  mood: string;
  suggestions: string[];
}

import InterpretationDisplay from '@/components/InterpretationDisplay';
import UsageStatus from '@/components/usage/UsageStatus';
import UpgradePrompt from '@/components/usage/UpgradePrompt';
import ShareDreamModal from '@/components/modals/ShareDreamModal';
import RegisterPromptModal from '@/components/modals/RegisterPromptModal';
import Toast, { ToastType } from '@/components/ui/Toast';
import LiveCounter from '@/components/ui/LiveCounter';
import FAQSection from '@/components/home/FAQSection';
import SEOIntro from '@/components/home/SEOIntro';
import AnalyzingScreen from '@/components/home/AnalyzingScreen';
import ResultActions from '@/components/home/ResultActions';
import VoiceInput from '@/components/ui/VoiceInput';

// Map combined status to gender + socialStatus
function mapCombinedStatus(val: string): { gender: string; socialStatus: string } {
  switch (val) {
    case 'single_female': return { gender: 'female', socialStatus: 'single' };
    case 'married_female': return { gender: 'female', socialStatus: 'married' };
    case 'male': return { gender: 'male', socialStatus: '' };
    default: return { gender: '', socialStatus: '' };
  }
}

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dreamText, setDreamText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedInterpreter, setSelectedInterpreter] = useState<string | null>('ibn-sirin');
  const [selectedHumanInterpreter, setSelectedHumanInterpreter] = useState<HumanInterpreter | null>(null);
  const [expertsList, setExpertsList] = useState<HumanInterpreter[]>([]);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const res = await fetch('/api/interpreters');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.interpreters.map((i: any) => ({
            id: i.id,
            name: i.displayName,
            title: `مفسر ${i.interpretationTypeAr}`,
            bio: i.bio,
            isVerified: true,
            isExpert: i.completedDreams > 100,
            rating: i.rating || 5,
            reviewsCount: i.totalRatings || 0,
            completedDreams: i.completedDreams || 0,
            responseSpeed: i.responseTime <= 6 ? '6h' : i.responseTime <= 24 ? '24h' : '48h',
            price: i.price,
            currency: 'USD',
            avatar: i.avatar || '👤',
            types: [i.interpretationType],
            status: i.isActive ? 'available' : 'busy'
          }));
          setExpertsList(mapped);
        }
      } catch (e) {
        console.error("Failed to fetch experts", e);
      }
    };
    fetchExperts();
  }, []);

  const [showShareModal, setShowShareModal] = useState(false);
  const [currentDreamId, setCurrentDreamId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Live Stats State
  const [globalStats, setGlobalStats] = useState<{ dreamsCount: number; usersCount: number } | null>(null);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await fetch('/api/stats/global');
        if (res.ok) {
          const data = await res.json();
          setGlobalStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch global stats', error);
      }
    };
    fetchGlobalStats();
  }, []);

  // Paywall & Modal State
  const [showPaywall, setShowPaywall] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [paywallMode, setPaywallMode] = useState<'LIMIT_REACHED' | 'FEATURE_LOCKED'>('LIMIT_REACHED');

  // Input Lock State
  const [isInputLocked, setIsInputLocked] = useState(false);

  // Simplified form fields: combined status and feeling
  const [combinedStatus, setCombinedStatus] = useState<string>('');
  const [dominantFeeling, setDominantFeeling] = useState<string>('');

  // Legacy fields for API (mapped from combined)
  const [socialStatus, setSocialStatus] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [isRecurring] = useState<boolean>(false);

  const resultRef = useRef<HTMLDivElement>(null);

  const handleVoiceInput = (newText: string) => {
    setDreamText((prev) => prev + newText);
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  // Read prefilled dream text from MiniDreamAnalyzer
  useEffect(() => {
    const prefill = localStorage.getItem('prefill_dream_text');
    if (prefill) {
      setDreamText(prefill);
      localStorage.removeItem('prefill_dream_text');
      setTimeout(() => {
        const inputSection = document.getElementById('dream-input-section');
        if (inputSection) inputSection.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  // Check for Human Interpreter Selection
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'human_interpret') {
      const storedId = localStorage.getItem('selected_human_interpreter');
      if (storedId) {
        const interpreter = humanInterpreters.find(i => i.id === storedId);
        if (interpreter) {
          setSelectedHumanInterpreter(interpreter);
          setTimeout(() => {
            const inputSection = document.getElementById('dream-input-section');
            if (inputSection) inputSection.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        }
      }
    }
  }, [searchParams]);

  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    if (!dreamText.trim()) return;
    if (isSubmittingRef.current) return;

    // Map combined status back to API fields
    const mapped = mapCombinedStatus(combinedStatus);
    const resolvedGender = mapped.gender || gender;
    const resolvedSocialStatus = mapped.socialStatus || socialStatus;

    // --- Human Interpreter Flow ---
    if (selectedHumanInterpreter) {
      const humanDreamData = {
        interpreterId: selectedHumanInterpreter.id,
        interpreterName: selectedHumanInterpreter.name,
        price: selectedHumanInterpreter.price,
        responseTime: selectedHumanInterpreter.responseSpeed === '6h' ? 6 : selectedHumanInterpreter.responseSpeed === '24h' ? 24 : 48,
        dreamContent: dreamText,
        context: {
          gender: resolvedGender,
          socialStatus: resolvedSocialStatus,
          dominantFeeling,
          isRecurring
        }
      };

      sessionStorage.setItem('humanDreamData', JSON.stringify(humanDreamData));
      router.push('/checkout?type=human-dream');
      return;
    }

    // --- Access Logic Check ---
    if (!user) {
      const guestUsage = parseInt(localStorage.getItem('guest_usage_count') || '0');
      if (guestUsage >= 1) {
        setShowRegisterPrompt(true);
        return;
      }
    }

    isSubmittingRef.current = true;
    setIsAnalyzing(true);

    try {
      const foundSymbols = dreamSymbols.filter(symbol =>
        dreamText.includes(symbol.name) ||
        symbol.relatedSymbols.some(rs => dreamText.includes(rs))
      );

      const localResult: InterpretationResult = {
        symbols: foundSymbols.length > 0
          ? foundSymbols.slice(0, 3).map(s => ({
            name: s.name,
            icon: s.icon,
            brief: s.interpretations.general.substring(0, 60) + '...',
          }))
          : [{ name: 'حلم', icon: '💭', brief: 'رمز عام' }],
        initialInterpretation: '',
        mood: 'تأمل',
        suggestions: ['الاستخارة', 'التفاؤل بالخير', 'قراءة المعوذات'],
      };

      setResult(null);

      let token;
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.error("Failed to get token:", e);
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: 'AI',
          dreamText: dreamText,
          interpreter: selectedInterpreter,
          context: {
            socialStatus: resolvedSocialStatus,
            dominantFeeling,
            gender: resolvedGender,
            isRecurring
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 403 && errorData.error === 'Limit reached') {
          setShowUpgradePrompt(true);
          return;
        }

        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();

      setResult({
        ...localResult,
        initialInterpretation: data.interpretation,
      });

      if (data.orderId) {
        setCurrentDreamId(data.orderId);
        setTimeout(() => {
          showToast('✨ تم التفسير بنجاح!', 'success');
        }, 1000);
      }

      if (!user) {
        const currentUsage = parseInt(localStorage.getItem('guest_usage_count') || '0');
        localStorage.setItem('guest_usage_count', (currentUsage + 1).toString());

        const pendingDream = {
          dreamText,
          interpretation: data.interpretation,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('pending_dream', JSON.stringify(pendingDream));

        setTimeout(() => {
          setShowRegisterPrompt(true);
        }, 8000);
      }

      setShowUpgrade(true);

    } catch (error: any) {
      console.error('Interpretation failed:', error);
      showToast(`عذراً، حدث خطأ: ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <>
      <Header />

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        mode={paywallMode}
      />

      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}

      <RegisterPromptModal
        isOpen={showRegisterPrompt}
        onClose={() => setShowRegisterPrompt(false)}
      />

      <ShareDreamModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        isPublishing={isPublishing}
        onConfirm={async () => {
          if (!currentDreamId) return;
          setIsPublishing(true);
          try {
            let token;
            if (user) {
              try {
                token = await user.getIdToken();
              } catch (e) {
                console.error('Error getting token:', e);
              }
            }

            const headers: HeadersInit = {};
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            fetch(`/api/dreams/${currentDreamId}/publish`, {
              method: 'POST',
              headers: headers
            }).catch(e => console.error('[Publish] Background error:', e));

            showToast('تم إرسال حلمك للمراجعة والنشر بنجاح! شكراً لمشاركتك. ✨', 'success');
            setShowShareModal(false);
          } catch (e) {
            console.error(e);
            showToast('حدث خطأ غير متوقع.', 'error');
          } finally {
            setIsPublishing(false);
          }
        }}
      />

      {user && (
        <div className="fixed top-4 left-4 z-50">
          <Link href="/dashboard" className="btn btn-sm btn-ghost">
            👤 لوحة التحكم
          </Link>
        </div>
      )}

      <main>

        {/* ══════════════════════════════════════
            HERO SECTION — FORM IS THE HERO
            ══════════════════════════════════════ */}
        <section className="hero hero-cro" style={{ minHeight: '100vh', padding: '0', alignItems: 'flex-start' }}>
          <div
            className="container"
            style={{
              maxWidth: 780,
              paddingTop: 'calc(70px + 3rem)',
              paddingBottom: '3rem',
              zIndex: 1,
            }}
            suppressHydrationWarning
          >

            {/* Social Proof Badge (top) */}
            <div className="flex justify-center mb-5 animate-fadeInUp" suppressHydrationWarning>
              <div className="cro-badge">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="font-bold text-white">4.9/5</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">
                  <span className="text-[var(--color-primary-light)] font-bold" suppressHydrationWarning>
                    +<LiveCounter start={15000} add={globalStats?.dreamsCount || 0} />
                  </span>
                  {' '}حلم تم تفسيره
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <h1
              className="text-center animate-fadeInUp"
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                fontWeight: 800,
                lineHeight: 1.3,
                marginBottom: '0.75rem',
                animationDelay: '0.05s',
              }}
            >
              {selectedHumanInterpreter ? (
                <>
                  <span className="text-gradient">اكتب حلمك</span>
                  <br />
                  <span className="text-gray-300 text-2xl font-normal">ليتم تفسيره من قِبل المفسّر الذي اخترته</span>
                </>
              ) : (
                <>
                  <span className="text-gradient">🌙 دليلك الصادق</span>
                  <br />
                  <span className="text-white">لتفسير الرؤى والأحلام</span>
                </>
              )}
            </h1>

            {/* Sub-headline */}
            {!selectedHumanInterpreter && (
              <p
                className="text-center text-gray-400 animate-fadeInUp"
                style={{
                  fontSize: '1.05rem',
                  marginBottom: '2rem',
                  animationDelay: '0.1s',
                  maxWidth: 550,
                  margin: '0 auto 2rem',
                }}
                suppressHydrationWarning
              >
                اكتب حلمك الآن بطريقتك، وسنقوم باستخراج رموزه الدقيقة وفق منهج <strong>ابن سيرين والنابلسي</strong> في ضوء الكتاب والسنة.
                <br/>
                <span className="text-xs mt-2 inline-block text-gray-500">(سرية تامة • بدون تسجيل • إجابة فورية)</span>
              </p>
            )}

            {/* ══ THE FORM — CENTER OF ATTENTION ══ */}
            <div
              id="dream-input-section"
              className="cro-form-wrapper animate-fadeInUp"
              style={{ animationDelay: '0.15s' }}
              suppressHydrationWarning
            >
              <UsageStatus />

              {/* Textarea */}
              <div className="relative mb-4" suppressHydrationWarning>
                <textarea
                  id="dream-textarea"
                  className="textarea cro-textarea pb-14"
                  placeholder={
                    isInputLocked && !user
                      ? 'لقد استخدمت التفسير المجاني. يرجى تسجيل الدخول للمتابعة.'
                      : 'اكتب حلمك بالتفصيل… ماذا رأيت؟ كيف شعرت؟'
                  }
                  value={dreamText}
                  onChange={(e) => setDreamText(e.target.value)}
                  disabled={isAnalyzing || (isInputLocked && !user)}
                  style={{
                    minHeight: 160,
                    fontSize: '1.1rem',
                    borderColor: dreamText.length > 50
                      ? 'var(--color-primary)'
                      : 'rgba(255,255,255,0.12)',
                    ...(isInputLocked && !user
                      ? { opacity: 0.6, cursor: 'not-allowed' }
                      : {}),
                  }}
                />

                <div className="absolute left-3 bottom-3 z-10">
                  {!isInputLocked && !isAnalyzing && (
                    <VoiceInput onTextResult={handleVoiceInput} />
                  )}
                </div>

                {/* Quality indicator */}
                {!isInputLocked && dreamText.length > 0 && (
                  <div className="flex justify-end mt-1 px-1" suppressHydrationWarning>
                    <span className={`text-xs transition-colors duration-300 ${
                      dreamText.length < 10 ? 'text-gray-500' :
                      dreamText.length < 50 ? 'text-yellow-500' :
                      'text-green-400 font-medium'
                    }`}>
                      {dreamText.length < 10 && 'اكتب المزيد...'}
                      {dreamText.length >= 10 && dreamText.length < 50 && 'بداية جيدة.. أكمل'}
                      {dreamText.length >= 50 && 'تفاصيل ممتازة! 👌'}
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Context Row */}
              <div className="cro-context-row mb-5" suppressHydrationWarning>
                {/* Combined Status Selector */}
                <div className="cro-context-field" suppressHydrationWarning>
                  <label className="cro-context-label">الحالة</label>
                  <div className="cro-pill-group" suppressHydrationWarning>
                    {[
                      { value: 'single_female', label: 'عزباء' },
                      { value: 'married_female', label: 'متزوجة' },
                      { value: 'male', label: 'رجل' },
                      { value: 'other', label: 'أخرى' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`cro-pill ${combinedStatus === opt.value ? 'cro-pill-active' : ''}`}
                        onClick={() => setCombinedStatus(opt.value)}
                        suppressHydrationWarning
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feeling Selector */}
                <div className="cro-context-field" suppressHydrationWarning>
                  <label className="cro-context-label">الشعور</label>
                  <div className="cro-pill-group" suppressHydrationWarning>
                    {[
                      { value: 'anxious', label: '😨 خوف' },
                      { value: 'happy', label: '😌 راحة' },
                      { value: 'sad', label: '😢 حزن' },
                      { value: 'neutral', label: '😐 عادي' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`cro-pill ${dominantFeeling === opt.value ? 'cro-pill-active' : ''}`}
                        onClick={() => setDominantFeeling(opt.value)}
                        suppressHydrationWarning
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Human Interpreter Badge (if selected) */}
              {selectedHumanInterpreter && (
                <div className="mb-5 animate-fadeIn">
                  <div className="bg-[var(--color-bg-tertiary)]/30 border border-[var(--color-primary)] rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {selectedHumanInterpreter.avatar.startsWith('/') || selectedHumanInterpreter.avatar.startsWith('http') || selectedHumanInterpreter.avatar.startsWith('data:') ? (
                            <img src={selectedHumanInterpreter.avatar} alt={selectedHumanInterpreter.name} className="w-12 h-12 rounded-full object-cover border-2 border-[var(--color-gold)]" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-2xl border-2 border-[var(--color-gold)]">
                              {selectedHumanInterpreter.avatar}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-[var(--color-bg-primary)]" />
                        </div>
                        <div>
                          <div className="text-xs text-[var(--color-primary-light)] font-bold">المفسر المختار</div>
                          <div className="font-bold text-white">{selectedHumanInterpreter.name}</div>
                          <div className="text-xs text-gray-400">⭐ {selectedHumanInterpreter.rating} • {selectedHumanInterpreter.price} {selectedHumanInterpreter.currency}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedHumanInterpreter(null);
                          localStorage.removeItem('selected_human_interpreter');
                          router.replace('/experts');
                        }}
                        className="btn btn-outline btn-sm text-xs hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
                      >
                        تغيير ↻
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]/30 flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-green-400">🛡️</span>
                      <span>ضمان استرجاع كامل في حال عدم الرد.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Classic AI Selector (Only visible if no human selected) */}
              {!selectedHumanInterpreter && (
                <div className="mb-5" suppressHydrationWarning>
                  <InterpreterSelector
                    selectedInterpreter={selectedInterpreter}
                    onSelectInterpreter={setSelectedInterpreter}
                  />
                </div>
              )}

              {/* CTA Button */}
              <div className="flex justify-center" suppressHydrationWarning>
                {isInputLocked && !user ? (
                  <button
                    className="btn btn-primary btn-lg cro-cta-btn"
                    onClick={() => router.push('/auth/register')}
                  >
                    🔓 أنشئ حساباً للتفسير
                  </button>
                ) : (
                  <button
                    id="submit-dream-btn"
                    className={`btn btn-lg cro-cta-btn ${selectedHumanInterpreter ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleSubmit}
                    disabled={isAnalyzing || !dreamText.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                        نستخرج دلالات الرؤيا...
                      </>
                    ) : (
                      <>
                        {selectedHumanInterpreter
                          ? `متابعة مع ${selectedHumanInterpreter.name} →`
                          : '🔮 اكتشف رسالة حلمك الآن (مجاناً)'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Privacy micro-copy */}
              <div className="text-center mt-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }} suppressHydrationWarning>
                <p className="text-xs text-green-500/90 font-medium flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  حلمك مشفر ولا يطلع عليه أحد. نحن نحترم خصوصيتك بالكامل.
                </p>
                
                {/* Sources Banner */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-center items-center gap-3 text-[11px] text-gray-500">
                  <span className="font-bold text-gray-400">📚 نعتمد في التفسير على:</span>
                  <span>تفسير ابن سيرين</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span>تعطير الأنام للنابلسي</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span>الإشارات لابن شاهين</span>
                </div>
              </div>
            </div>
            {/* ══ END FORM ══ */}

            {/* Analyzing Screen — WOW Loading */}
            <AnalyzingScreen isVisible={isAnalyzing} />

            {/* AI Result */}
            {result && !isAnalyzing && (
              <div ref={resultRef} className="glass-card mt-10 animate-fadeIn relative">
                <h3 className="text-center mb-2">🔮 التفسير</h3>

                {selectedInterpreter && (
                  <div className="text-center mb-6">
                    <span className="tag" style={{
                      background: 'var(--gradient-secondary)',
                      color: 'var(--color-bg-primary)',
                      padding: '0.5rem 1rem',
                      fontSize: 'var(--text-sm)'
                    }}>
                      📖 وفق منهج {classicInterpreters.find(i => i.id === selectedInterpreter)?.name}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <InterpretationDisplay
                    interpretation={result.initialInterpretation}
                    symbols={result.symbols}
                  />
                </div>

                <div className="flex justify-center gap-4 mt-2" style={{ flexWrap: 'wrap' }}>
                  {result.suggestions.map((suggestion, idx) => (
                    <span key={idx} className="tag" style={{ fontSize: 'var(--text-sm)', padding: '0.5rem 1rem' }}>
                      {suggestion}
                    </span>
                  ))}
                </div>

                {/* Share Action */}
                {currentDreamId && (
                  <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-center">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="btn btn-outline gap-2 group hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)]"
                    >
                      <span>📤</span>
                      <span>شارك مع المجتمع</span>
                    </button>
                  </div>
                )}

                {/* Result Actions (Retention + Upsell) */}
                <ResultActions
                  dreamId={currentDreamId}
                  dreamText={dreamText}
                  interpretation={result.initialInterpretation}
                  isLoggedIn={!!user}
                  onInterpretAnother={() => {
                    setResult(null);
                    setDreamText('');
                    setShowUpgrade(false);
                    document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onSave={() => {
                    if (currentDreamId) {
                      showToast('✅ تم حفظ الحلم في سجلك', 'success');
                    }
                  }}
                />
              </div>
            )}

          </div>
        </section>

        {/* ══════════════════════════════════════
            HOW IT WORKS — 3 SIMPLE STEPS
            ══════════════════════════════════════ */}
        <section className="section" style={{ background: 'var(--color-bg-secondary)', paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="container" suppressHydrationWarning>
            <div className="text-center mb-12" suppressHydrationWarning>
              <span className="cro-section-badge">كيف يعمل؟</span>
              <h2 className="mt-3 mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>ثلاث خطوات فقط</h2>
              <p className="text-gray-400 text-base max-w-md mx-auto">لا تعقيد، لا انتظار. تفسير حلمك في ثوانٍ.</p>
            </div>

            <div className="cro-steps-grid" suppressHydrationWarning>
              {[
                {
                  step: '١',
                  icon: '✍️',
                  title: 'اكتب حلمك',
                  desc: 'صِف ما رأيته بتفاصيل كافية — كلما زادت التفاصيل، زادت دقة التفسير.',
                },
                {
                  step: '٢',
                  icon: '⚡',
                  title: 'التحليل الفوري',
                  desc: 'يقوم الذكاء الاصطناعي بتحليل رموز حلمك وفق منهج ابن سيرين.',
                },
                {
                  step: '٣',
                  icon: '🔮',
                  title: 'احصل على تفسيرك',
                  desc: 'تفسير مخصص يشرح رموز حلمك بلغة واضحة وبسيطة.',
                },
              ].map((item, i) => (
                <div key={i} className="cro-step-card" suppressHydrationWarning>
                  <div className="cro-step-number">{item.step}</div>
                  <div className="cro-step-icon">{item.icon}</div>
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            EXAMPLE INTERPRETATION
            ══════════════════════════════════════ */}
        <section className="section" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="container" style={{ maxWidth: 860 }} suppressHydrationWarning>
            <div className="text-center mb-10" suppressHydrationWarning>
              <span className="cro-section-badge">مثال حقيقي</span>
              <h2 className="mt-3 mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>شاهد كيف يبدو التفسير</h2>
            </div>

            <div className="cro-example-card" suppressHydrationWarning>
              {/* Dream bubble */}
              <div className="cro-example-dream" suppressHydrationWarning>
                <div className="cro-example-dream-label">💭 الحلم</div>
                <p className="text-gray-300 leading-relaxed italic">
                  "رأيت في منامي أنني أطير فوق بيت قديم وكان الجو صافياً والقمر مضيئاً، وشعرت براحة كبيرة..."
                </p>
              </div>

              {/* Arrow */}
              <div className="cro-example-arrow" suppressHydrationWarning>↓</div>

              {/* Interpretation */}
              <div className="cro-example-result" suppressHydrationWarning>
                <div className="cro-example-result-label">🔮 التفسير</div>
                <p className="font-bold text-white mb-2">خلاصة: بشرى بالرفعة والتحرر</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  الطيران في الحلم يدل على الرفعة والتحقق من الأهداف، والبيت القديم يرمز للأصل والجذور،
                  أما القمر المضيء فيشير إلى وضوح الأمور وإزالة الغموض. شعور الراحة يؤكد أن هذا الحلم بشرى طيبة.
                </p>
                <div className="flex gap-2 mt-4 flex-wrap" suppressHydrationWarning>
                  <span className="tag">الاستخارة</span>
                  <span className="tag">التفاؤل بالخير</span>
                  <span className="tag">شكر الله</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-8" suppressHydrationWarning>
              <button
                className="btn btn-secondary btn-lg cro-cta-btn"
                onClick={() => {
                  document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                🔮 فسّر حلمك الآن مجاناً
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            PLATFORM BENEFITS
            ══════════════════════════════════════ */}
        <section className="section" style={{ background: 'var(--color-bg-secondary)', paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="container" suppressHydrationWarning>
            <div className="text-center mb-10" suppressHydrationWarning>
              <span className="cro-section-badge">لماذا المفسر؟</span>
              <h2 className="mt-3 mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>لا تترك حلمك بدون تفسير</h2>
            </div>

            <div className="cro-benefits-grid" suppressHydrationWarning>
              {[
                { icon: '⚡', title: 'فوري وسريع', desc: 'تفسيرك خلال ثوانٍ — بدون انتظار' },
                { icon: '🎯', title: 'مخصص لك', desc: 'يأخذ في الاعتبار جنسك وحالتك ومشاعرك' },
                { icon: '📚', title: 'مبني على العلم', desc: 'وفق منهج ابن سيرين والنابلسي' },
                { icon: '🔒', title: 'خصوصية تامة', desc: 'حلمك لك وحدك — لا نشارك بياناتك' },
                { icon: '🆓', title: 'مجاني للتجربة', desc: 'ابدأ مجاناً بدون أي بيانات بنكية' },
                { icon: '📱', title: 'يعمل على موبايلك', desc: 'تجربة سلسة من أي جهاز أو متصفح' },
              ].map((b, i) => (
                <div key={i} className="cro-benefit-card" suppressHydrationWarning>
                  <div className="cro-benefit-icon">{b.icon}</div>
                  <h5 className="font-bold mb-1">{b.title}</h5>
                  <p className="text-gray-400 text-sm">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SEO INTRO
            ══════════════════════════════════════ */}
        <SEOIntro />

        {/* ══════════════════════════════════════
            SYMBOL LIBRARY PREVIEW (SEO)
            ══════════════════════════════════════ */}
        <section className="section mb-24" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="container" suppressHydrationWarning>
            <div className="text-center mb-10" suppressHydrationWarning>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>📚 قاموس تفسير الأحلام</h2>
              <p className="text-gray-400 mt-3">اكتشف معاني رموز الأحلام حسب ابن سيرين والنابلسي</p>
            </div>

            <div className="flex justify-center gap-3 mb-8" style={{ flexWrap: 'wrap' }} suppressHydrationWarning>
              {symbolCategories.slice(0, 6).map(cat => (
                <Link href={`/symbols?category=${cat.id}`} key={cat.id} className="btn btn-ghost">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>

            <div className="symbol-grid" suppressHydrationWarning>
              {dreamSymbols.slice(0, 12).map(symbol => (
                <Link href={`/symbols/${symbol.id}`} key={symbol.id} className="symbol-card">
                  <div className="symbol-icon" suppressHydrationWarning>{symbol.icon}</div>
                  <div className="symbol-name" suppressHydrationWarning>{symbol.name}</div>
                  <div className="symbol-count" suppressHydrationWarning>{symbol.relatedSymbols.length} رموز مرتبطة</div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8" suppressHydrationWarning>
              <Link href="/symbols" className="btn btn-outline btn-lg">
                استكشف جميع الرموز ←
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            CONSULTANTS — BOTTOM (LOW PRIORITY)
            ══════════════════════════════════════ */}
        <section id="experts-section" className="section mb-24" style={{ background: 'var(--color-bg-secondary)', paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="container" suppressHydrationWarning>
            <div className="text-center mb-10" suppressHydrationWarning>
              <span className="cro-section-badge">للتفسير الشرعي المتعمق</span>
              <h2 className="mt-3 mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>مفسرون معتمدون — خدمة مميزة</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                للحصول على تفسير شرعي مفصل مع إمكانية التواصل المباشر.
              </p>
            </div>

            <div className="flex justify-center gap-8" style={{ flexWrap: 'wrap' }} suppressHydrationWarning>
              {(expertsList.length > 0 ? expertsList.slice(0, 3) : [
                { id: '1', name: 'الشيخ أحمد السلمي', title: 'التفسير الشرعي', rating: 4.9, completedDreams: 1240, badge: 'الأكثر طلباً', badgeColor: 'bg-amber-500', avatar: '👤' },
                { id: '2', name: 'د. سارة المطيري', title: 'التحليل النفسي', rating: 4.8, completedDreams: 890, badge: 'رد سريع', badgeColor: 'bg-green-500', avatar: '👤' },
                { id: '3', name: 'الشيخ محمد الزهراني', title: 'أحلام المرأة', rating: 4.9, completedDreams: 2100, badge: 'متخصص', badgeColor: 'bg-blue-500', avatar: '👤' },
              ]).map((expert: any, idx) => {
                let badge = expert.badge;
                let badgeColor = expert.badgeColor;
                if (!badge && expertsList.length > 0) {
                  if (idx === 0) { badge = 'الأكثر طلباً'; badgeColor = 'bg-amber-500'; }
                  else if (idx === 1) { badge = 'رد سريع'; badgeColor = 'bg-green-500'; }
                  else if (idx === 2) { badge = 'متخصص'; badgeColor = 'bg-blue-500'; }
                }

                return (
                  <div key={idx} className="card relative transform hover:-translate-y-2 transition-all duration-300" style={{ minWidth: 260, maxWidth: 300, textAlign: 'center', flex: '1 1 260px' }} suppressHydrationWarning>
                    {badge && (
                      <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10`}>
                        {badge}
                      </div>
                    )}

                    <div suppressHydrationWarning style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      margin: '0 auto var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      border: '3px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}>
                      {expert.avatar?.startsWith('/') || expert.avatar?.startsWith('http') || expert.avatar?.startsWith('data:') ? (
                        <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
                      ) : (
                        expert.avatar || '👤'
                      )}
                    </div>
                    <h4 className="text-base mb-1">{expert.name}</h4>
                    <p className="text-[var(--color-text-accent)] text-sm mb-4">{expert.title}</p>

                    <div className="flex justify-between text-sm bg-white/5 p-3 rounded-lg mb-4" suppressHydrationWarning>
                      <span className="text-gray-400">التقييم: <span className="text-yellow-400 font-bold">⭐ {expert.rating}</span></span>
                      <span className="text-gray-400">الجلسات: <span className="text-white font-bold">{expert.completedDreams}+</span></span>
                    </div>

                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          setSelectedHumanInterpreter(expert);
                          localStorage.setItem('selected_human_interpreter', expert.id);
                        }
                        document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="btn btn-outline btn-sm w-full hover:bg-[var(--color-primary)] hover:border-transparent hover:text-white transition-colors"
                    >
                      احجز استشارة خاصة
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SHEIKH ABU MALIK SECTION
            ══════════════════════════════════════ */}
        <section className="section" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="container" suppressHydrationWarning>
            <div className="glass-card" style={{ maxWidth: 860, margin: '0 auto' }} suppressHydrationWarning>
              <div className="text-center mb-6" suppressHydrationWarning>
                <h2 className="text-2xl font-bold">هل تبحث عن مفسر متخصص؟</h2>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8" suppressHydrationWarning>
                <div className="w-full md:w-1/3 flex justify-center" suppressHydrationWarning>
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[var(--color-gold)] shadow-2xl" suppressHydrationWarning>
                    <img src="/cv.png" alt="الشيخ ابو مالك المرسلي" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="w-full md:w-2/3 text-center md:text-right" suppressHydrationWarning>
                  <h3 className="text-xl text-[var(--color-primary-light)] font-bold mb-3">
                    الشيخ ابو مالك المرسلي — مفسر الرؤى والأحلام
                  </h3>
                  <p className="text-base leading-relaxed text-gray-400 mb-5">
                    مؤسس موقع المفسر، مفسر أحلام، وداعم نفسي. خبير في تفسير الرؤى، مع استشارات نفسية وروحانية لمساعدتك على فهم أحلامك براحة وطمأنينة.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push('/booking')}
                  >
                    حجز جلسة →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            FAQ SECTION
            ══════════════════════════════════════ */}
        <FAQSection />

        {/* ══════════════════════════════════════
            FINAL CTA
            ══════════════════════════════════════ */}
        <section className="section relative overflow-hidden" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/20 to-transparent pointer-events-none" />
          <div className="container text-center relative z-10" suppressHydrationWarning>
            <h2 className="font-bold mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
              اكتشف ماذا يخبرك حلمك
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto text-base">
              الرموز تتلاشى من الذاكرة بسرعة. سجّل حلمك الآن واحصل على تفسير فوري قبل أن تنساه.
            </p>
            <button
              onClick={() => document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-secondary btn-lg cro-cta-btn shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] transform hover:scale-105 transition-all"
            >
              🔮 فسّر حلمي الآن مجاناً
            </button>
          </div>
        </section>

      </main>

      <Footer />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">جاري التحميل...</div>}>
      <HomeContent />
    </Suspense>
  );
}
