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

  // Dream Context Fields
  const [socialStatus, setSocialStatus] = useState<string>('');
  const [dominantFeeling, setDominantFeeling] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Check Guest Limit on Load
  useEffect(() => {
    if (!user) {
      const guestUsage = localStorage.getItem('guest_usage_count');
      if (guestUsage && parseInt(guestUsage) >= 1) {
        // Don't lock input visually, let them try? 
        // Or visually lock? The prompt says "Block further interpretations".
        // Let's not lock visually to avoid discouragement, but block on submit and show modal.
        // Actually, locking/graying out might be too aggressive if we want them to read the placeholder or see the UI.
        // Let's keep it open but check on submit.
      }
    }
  }, [user]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  // Check for Human Interpreter Selection
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'human_interpret') {
      const storedId = localStorage.getItem('selected_human_interpreter');
      if (storedId) {
        const interpreter = humanInterpreters.find(i => i.id === storedId);
        if (interpreter) {
          setSelectedHumanInterpreter(interpreter);
          // Scroll to input
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

    // --- Human Interpreter Flow ---
    if (selectedHumanInterpreter) {
      // Prepare data for checkout
      const humanDreamData = {
        interpreterId: selectedHumanInterpreter.id,
        interpreterName: selectedHumanInterpreter.name,
        price: selectedHumanInterpreter.price,
        responseTime: selectedHumanInterpreter.responseSpeed === '6h' ? 6 : selectedHumanInterpreter.responseSpeed === '24h' ? 24 : 48,
        dreamContent: dreamText,
        context: {
          gender,
          socialStatus,
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
      // 1. Guest Logic
      const guestUsage = parseInt(localStorage.getItem('guest_usage_count') || '0');

      if (guestUsage >= 1) {
        // Guest Limit Reached (1 max)
        setShowRegisterPrompt(true);
        return;
      }
    }
    // Note: Registered User Logic depends on Server Response (403 INSUFFICIENT_CREDITS).
    // We try to interpret, if server says no, we handle it.

    isSubmittingRef.current = true;
    setIsAnalyzing(true);

    try {
      // 1. Analyze symbols locally (for immediate feedback)
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

      // 2. Clear previous results
      setResult(null);

      // 3. Get Token if logged in
      let token;
      if (user) {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.error("Failed to get token:", e);
        }
      }

      // 4. Call the API
      // 4. Call the API (Unified Flow)
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
            socialStatus,
            dominantFeeling,
            gender,
            isRecurring
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle Limits (403)
        // Handle Limits (403)
        if (response.status === 403 && errorData.error === 'Limit reached') {
          // setPaywallMode('LIMIT_REACHED');
          // setShowPaywall(true);
          setShowUpgradePrompt(true);
          return;
        }

        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();

      // 5. Success Handling
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

      // --- Post-Analysis Locking ---
      if (!user) {
        // Update Guest Count
        const currentUsage = parseInt(localStorage.getItem('guest_usage_count') || '0');
        localStorage.setItem('guest_usage_count', (currentUsage + 1).toString());

        // Save pending dream for registration carry-over
        const pendingDream = {
          dreamText,
          interpretation: data.interpretation,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('pending_dream', JSON.stringify(pendingDream));

        // Show Register Prompt after they read? 
        // Or leave it. If they try AGAIN, they get blocked.
        // The prompt says: "After completion: Block further interpretations. Show modal: 'Create free account...'"
        // So we show the Modal AFTER they see the result? Or nicely suggest it.
        // Let's show a toast or small banner, but the Modal triggers on NEXT attempt.
        setTimeout(() => {
          setShowRegisterPrompt(true); // Optional: Nudge them immediately? 
          // "After completion... Show a modal" -> implies immediately or upon next action.
          // Let's show it immediately as a "Unlock your 2nd free dream" promo.
        }, 8000); // 8 seconds delay to read result first
      }

      // If User: Credits deducted on server. If they run out, next time checks API and fails.

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

            const res = await fetch(`/api/dreams/${currentDreamId}/publish`, {
              method: 'POST',
              headers: headers
            });

            if (res.ok) {
              showToast('تم إرسال حلمك للمراجعة والنشر بنجاح! شكراً لمشاركتك.', 'success');
              setShowShareModal(false);
            } else {
              const data = await res.json();
              showToast(`حدث خطأ أثناء النشر: ${data.message || data.error}`, 'error');
            }
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
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content container" suppressHydrationWarning>
            <h1 className="hero-title">
              {selectedHumanInterpreter ? (
                <>
                  <span className="text-gradient">اكتب حلمك ليتم تفسيره</span>
                  <br />
                  <span className="text-[var(--color-text-primary)] text-2xl md:text-5xl mt-1 block font-normal leading-tight">
                    من قِبل المفسّر الذي اخترته
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gradient">اكتشف رسائل أحلامك الخفية الآن</span>
                  <br />
                  <span className="text-[var(--color-text-primary)] text-xl md:text-2xl mt-4 block font-normal text-gray-300 max-w-3xl mx-auto">
                    خدمة تفسير فوري بالذكاء الاصطناعي (مجاناً)، مع خيار طلب تفسير شرعي مفصل من مفسرين معتمدين لاحقاً.
                  </span>
                </>
              )}
            </h1>

            {!selectedHumanInterpreter && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 sm:mt-12 mb-8 sm:mb-16 animate-fadeInUp" style={{ animationDelay: '0.3s' }} suppressHydrationWarning>
                <button
                  onClick={() => document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn btn-primary btn-lg shadow-glow hover:shadow-lg transition-all transform hover:-translate-y-1 min-w-[200px]"
                >
                  فسّر حلمي الآن
                </button>
                <button
                  onClick={() => document.getElementById('experts-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hidden sm:block btn btn-ghost text-sm text-[var(--color-text-muted)] hover:text-white underline-offset-4 hover:underline"
                >
                  أو تصفح المفسرين
                </button>
              </div>
            )}

            {!selectedHumanInterpreter && (
              <div className="flex justify-center gap-6 md:gap-12 text-sm text-[var(--color-text-muted)] animate-fadeInUp" style={{ animationDelay: '0.4s' }} suppressHydrationWarning>
                <span className="flex items-center gap-2">✅ دقة عالية</span>
                <span className="flex items-center gap-2">🔒 خصوصية تامة</span>
                <span className="flex items-center gap-2">⚡ إجابة فورية</span>
              </div>
            )}


            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 md:gap-12 py-6 sm:py-8 md:py-12 animate-fadeIn mb-8 sm:mb-16 md:mb-24" style={{ animationDelay: '0.2s' }} suppressHydrationWarning>
              <div className="text-center min-w-[80px]" suppressHydrationWarning>
                <div className="text-xl sm:text-2xl font-bold text-[var(--color-gold)]" suppressHydrationWarning>
                  <LiveCounter start={15000} add={globalStats?.dreamsCount || 0} />
                </div>
                <div className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1" suppressHydrationWarning>حلم مفسّر</div>
              </div>
              <div className="text-center min-w-[80px]" suppressHydrationWarning>
                <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary-light)]" suppressHydrationWarning>
                  <LiveCounter start={5000} add={globalStats?.usersCount || 0} />
                </div>
                <div className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1" suppressHydrationWarning>مستخدم</div>
              </div>
              <div className="text-center min-w-[80px]" suppressHydrationWarning>
                <div className="text-xl sm:text-2xl font-bold text-yellow-400" suppressHydrationWarning>4.9/5</div>
                <div className="text-[10px] sm:text-xs text-[var(--color-text-muted)]" suppressHydrationWarning>تقييم</div>
              </div>
            </div>

            {/* Dream Input Box */}
            <div id="dream-input-section" className="dream-input-section animate-fadeInUp mb-32" suppressHydrationWarning>

              <UsageStatus />

              <div className="dream-input-header" suppressHydrationWarning>
                <h2 className="dream-input-title">🌙 أخبرنا بحلمك</h2>
                <p className="dream-input-desc">كلما زدت التفاصيل، زادت دقة التفسير</p>
              </div>

              <div className="relative" suppressHydrationWarning>
                <textarea
                  className="textarea textarea-large transition-all duration-300"
                  placeholder={isInputLocked && !user ? "لقد استخدمت التفسير المجاني. يرجى تسجيل الدخول للمتابعة." : "رأيت في منامي..."}
                  value={dreamText}
                  onChange={(e) => setDreamText(e.target.value)}
                  disabled={isAnalyzing || (isInputLocked && !user)}
                  style={isInputLocked && !user ? { opacity: 0.6, cursor: 'not-allowed', background: 'rgba(0,0,0,0.2)' } : {
                    borderColor: dreamText.length > 50 ? 'var(--color-primary)' : 'var(--color-border)'
                  }}
                />

                {/* Visual Quality Indicator */}
                {!isInputLocked && (
                  <div className="flex justify-end mt-2 px-1" suppressHydrationWarning>
                    <span className={`text-xs transition-colors duration-300 ${dreamText.length === 0 ? 'opacity-0' :
                      dreamText.length < 10 ? 'text-gray-500' :
                        dreamText.length < 50 ? 'text-yellow-500' :
                          'text-green-400 font-medium'
                      }`}>
                      {dreamText.length < 10 && "اكتب المزيد..."}
                      {dreamText.length >= 10 && dreamText.length < 50 && "بداية جيدة.. أكمل"}
                      {dreamText.length >= 50 && "تفاصيل ممتازة! 👌"}
                    </span>
                  </div>
                )}
              </div>

              {/* Mandatory Context Section (Visible) */}
              <div className="bg-[var(--color-bg-tertiary)]/30 p-6 rounded-xl border border-[var(--color-border)] mb-6" suppressHydrationWarning>
                <h3 className="text-lg font-bold mb-4 text-[var(--color-secondary)]">📝 معلومات ضرورية لتفسير أدق</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" suppressHydrationWarning>
                  <div suppressHydrationWarning>
                    <label className="block text-sm mb-2 text-gray-300">الجنس</label>
                    <div className="flex gap-3" suppressHydrationWarning>
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg border ${gender === 'male' ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:bg-white/5'}`}
                        onClick={() => setGender('male')}
                      >ذكر</button>
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg border ${gender === 'female' ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:bg-white/5'}`}
                        onClick={() => setGender('female')}
                      >أنثى</button>
                    </div>
                  </div>

                  <div suppressHydrationWarning>
                    <label className="block text-sm mb-2 text-gray-300">الحالة الاجتماعية</label>
                    <select
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white"
                      value={socialStatus}
                      onChange={(e) => setSocialStatus(e.target.value)}
                    >
                      <option value="">اختر...</option>
                      <option value="single">أعزب / عزباء</option>
                      <option value="married">متزوج / متزوجة</option>
                      <option value="divorced">مطلق / مطلقة</option>
                      <option value="widowed">أرمل / أرملة</option>
                    </select>
                  </div>

                  <div suppressHydrationWarning>
                    <label className="block text-sm mb-2 text-gray-300">الشعور أثناء الحلم</label>
                    <select
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-white"
                      value={dominantFeeling}
                      onChange={(e) => setDominantFeeling(e.target.value)}
                    >
                      <option value="">اختر...</option>
                      <option value="happy">سعادة / راحة</option>
                      <option value="anxious">قلق / خوف</option>
                      <option value="sad">حزن / ضيق</option>
                      <option value="neutral">عادي / لا أتذكر</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3" suppressHydrationWarning>
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-transparent text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <label htmlFor="recurring" className="text-sm cursor-pointer select-none">هذا الحلم يتكرر معي</label>
                  </div>
                </div>
              </div>

              {/* Human Interpreter Selection Mode */}
              {selectedHumanInterpreter ? (
                <div className="mb-8 animate-fadeIn">
                  {/* Detailed Confirmation Box */}
                  <div className="bg-[var(--color-bg-tertiary)]/30 border border-[var(--color-primary)] rounded-2xl p-6 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/10 blur-3xl -z-10" />

                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                      {/* Interpreter Info */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {selectedHumanInterpreter.avatar.startsWith('/') || selectedHumanInterpreter.avatar.startsWith('http') || selectedHumanInterpreter.avatar.startsWith('data:') ? (
                            <img src={selectedHumanInterpreter.avatar} alt={selectedHumanInterpreter.name} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-gold)]" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-3xl border-2 border-[var(--color-gold)]">
                              {selectedHumanInterpreter.avatar}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-[var(--color-bg-primary)]" title="متاح الآن"></div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--color-primary-light)] mb-1 font-bold">المفسر المختار</div>
                          <h3 className="font-bold text-xl text-white mb-1">
                            {selectedHumanInterpreter.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">⭐ {selectedHumanInterpreter.rating}</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span>{selectedHumanInterpreter.title}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details & stats */}
                      <div className="flex gap-6 text-sm border-r border-[var(--color-border)]/50 pr-0 md:pr-6 mr-0 md:mr-auto">
                        <div>
                          <div className="text-[var(--color-text-muted)] text-xs mb-1">وقت الرد</div>
                          <div className="font-bold text-green-400">
                            {selectedHumanInterpreter.responseSpeed === '6h' && '⚡ خلال 6 ساعات'}
                            {selectedHumanInterpreter.responseSpeed === '24h' && '🕑 خلال 24 ساعة'}
                            {selectedHumanInterpreter.responseSpeed === '48h' && '🕤 خلال 48 ساعة'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[var(--color-text-muted)] text-xs mb-1">السعر</div>
                          <div className="font-bold text-[var(--color-secondary)] text-lg">{selectedHumanInterpreter.price} {selectedHumanInterpreter.currency}</div>
                        </div>
                      </div>

                      {/* Change Button */}
                      <button
                        onClick={() => {
                          setSelectedHumanInterpreter(null);
                          localStorage.removeItem('selected_human_interpreter');
                          router.replace('/experts'); // Redirect back to experts list
                        }}
                        className="btn btn-outline btn-sm text-xs hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
                      >
                        تغيير المفسر ↻
                      </button>
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]/30 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className="text-green-400">🛡️</span>
                    <span>ضمان استرجاع كامل للمبلغ في حال عدم الرد خلال المدة المحددة.</span>
                  </div>
                </div>
              ) : (
                /* Classic AI Selector (Only visible if no human selected) */
                <InterpreterSelector
                  selectedInterpreter={selectedInterpreter}
                  onSelectInterpreter={setSelectedInterpreter}
                />
              )}

              <div className="flex justify-center mt-xl" suppressHydrationWarning>
                {isInputLocked && !user ? (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => router.push('/auth/register')}
                  >
                    أنشئ حساباً للتفسير
                  </button>
                ) : (
                  <button
                    className={`btn btn-lg ${selectedHumanInterpreter ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleSubmit}
                    disabled={isAnalyzing || !dreamText.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="loading-spinner" style={{ width: 20, height: 20 }}></span>
                        جاري المعالجة...
                      </>
                    ) : (
                      <>{selectedHumanInterpreter ? `متابعة مع ${selectedHumanInterpreter.name}` : 'فسّر حلمي'}</>
                    )}
                  </button>
                )}
              </div>

              {/* Contact Options - Hide if Human Selected to avoid distraction */}
              {!selectedHumanInterpreter && (
                <>
                  <div className="contact-divider" suppressHydrationWarning>
                    <span className="contact-divider-line"></span>
                    <span className="contact-divider-text">أو تواصل مع مفسر معتمد</span>
                    <span className="contact-divider-line"></span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8" suppressHydrationWarning>
                    {[
                      { id: 'call', name: 'اتصال مباشر', icon: '📞', desc: 'تحدث مع مفسر معتمد الآن', price: '$79 / 30 دقيقة' },
                      { id: 'appointment', name: 'حجز موعد', icon: '📅', desc: 'احجز جلسة في الوقت المناسب لك', price: '$59 / جلسة' },
                      { id: 'chat', name: 'دردشة مباشرة', icon: '💬', desc: 'تواصل كتابياً مع مفسر', price: '$39' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        className="contact-option-card flex flex-col items-center text-center p-6 h-full hover:bg-[var(--color-bg-glass)] transition-all"
                        onClick={() => {
                          if (option.id === 'call') {
                            router.push('/contact');
                          } else if (option.id === 'appointment') {
                            router.push('/booking');
                          } else if (option.id === 'chat') {
                            router.push('/chat');
                          } else {
                            alert(`سيتم توفير خدمة ${option.name} قريباً إن شاء الله`);
                          }
                        }}
                        type="button"
                        suppressHydrationWarning
                      >
                        <div className="contact-option-icon mb-4 mx-auto" suppressHydrationWarning>{option.icon}</div>
                        <span className="contact-option-content block w-full" suppressHydrationWarning>
                          <span className="contact-option-name block font-bold text-lg mb-2" suppressHydrationWarning>{option.name}</span>
                          <span className="contact-option-desc block text-sm opacity-70 mb-3" suppressHydrationWarning>{option.desc}</span>
                        </span>
                        <span className="contact-option-price block text-sm font-bold text-[var(--color-secondary)] mt-auto" suppressHydrationWarning>{option.price}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* AI Result */}
            {result && (
              <div ref={resultRef} className="glass-card mt-2xl animate-fadeIn relative">
                <h3 className="text-center mb-lg">🔮 التفسير الأولي</h3>

                {/* Header Actions */}
                <div className="absolute top-4 left-4">
                  {/* Additional actions can go here */}
                </div>

                {/* Interpreter Attribution */}
                {selectedInterpreter && (
                  <div className="text-center mb-lg">
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

                {/* Detected Symbols */}
                <div className="flex justify-center gap-lg mb-xl" style={{ flexWrap: 'wrap' }}>
                  {result.symbols.map((symbol, idx) => (
                    <div key={idx} className="symbol-card" style={{ minWidth: 120 }}>
                      <div className="symbol-icon">{symbol.icon}</div>
                      <div className="symbol-name">{symbol.name}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-lg">
                  <InterpretationDisplay interpretation={result.initialInterpretation} />
                </div>

                {/* Suggestions */}
                <div className="flex justify-center gap-md" style={{ flexWrap: 'wrap' }}>
                  {result.suggestions.map((suggestion, idx) => (
                    <span key={idx} className="tag" style={{ fontSize: 'var(--text-sm)', padding: '0.5rem 1rem' }}>
                      {suggestion}
                    </span>
                  ))}
                </div>

                {/* Prominent Share Action */}
                {currentDreamId && (
                  <div className="mt-xl pt-lg border-t border-[var(--color-border)] text-center">
                    <p className="text-[var(--color-text-muted)] mb-4 text-sm">
                      هل أعجبك التفسير؟ ساهم في إثراء المحتوى العربي
                    </p>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="btn btn-outline btn-lg gap-2 group hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] w-full sm:w-auto"
                    >
                      <span>📤</span>
                      <span>مشاركة الحلم مع المجتمع</span>
                    </button>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      سيتم نشره بشكل مجهول للحفاظ على خصوصيتك
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upgrade Options */}
            {showUpgrade && (
              <div className="mt-2xl animate-fadeInUp">
                <h3 className="text-center mb-lg">🌟 للتفسير المتعمق</h3>
                <div className="upgrade-grid">
                  {/* Option A: Human Expert */}
                  <div className="upgrade-card">
                    <div className="upgrade-badge" style={{ background: 'var(--gradient-primary)' }}>الأكثر دقة</div>
                    <h4 className="upgrade-title">👨‍🏫 تفسير مفسر معتمد</h4>
                    <div className="upgrade-price">$49</div>
                    <ul className="upgrade-features">
                      <li>دردشة مباشرة مع مفسر متخصص</li>
                      <li>تحليل معمق لسياق حياتك</li>
                      <li>إمكانية المحادثة الصوتية</li>
                      <li>متابعة لمدة 7 أيام</li>
                      <li>أدعية ونصائح مخصصة</li>
                    </ul>
                    <button className="btn btn-primary" style={{ width: '100%' }}>
                      تواصل مع مفسر
                    </button>
                  </div>

                  {/* Option B: Detailed Report */}
                  <div className="upgrade-card featured">
                    <div className="upgrade-badge">الأكثر شمولاً</div>
                    <h4 className="upgrade-title">📋 تقرير تفسيري مفصل</h4>
                    <div className="upgrade-price">29 ر.س</div>
                    <ul className="upgrade-features">
                      <li>تحليل AI متقدم + مراجعة بشرية</li>
                      <li>ربط بمواقف حياتية محتملة</li>
                      <li>مقارنة التفسير الشرعي والنفسي</li>
                      <li>أدعية مقترحة من السنة</li>
                      <li>PDF قابل للتحميل</li>
                    </ul>
                    <button className="btn btn-secondary" style={{ width: '100%' }}>
                      احصل على التقرير
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Re-ordered Experts Section (Moved Up) */}
        <section id="experts-section" className="section mb-32">
          <div className="container" suppressHydrationWarning>
            <div className="text-center mb-xl" suppressHydrationWarning>
              <span className="text-[var(--color-secondary)] font-bold text-sm tracking-wide uppercase mb-2 block">هل تحتاج تفسيراً أعمق؟</span>
              <h2 className="mb-4">اطلب استشارة خاصة من خبرائنا المعتمدين</h2>
              <p className="text-muted max-w-2xl mx-auto">
                خدمة مدفوعة للحصول على تفسير شرعي مفصل مع إمكانية التواصل المباشر.
              </p>
            </div>

            <div className="flex justify-center gap-xl" style={{ flexWrap: 'wrap' }} suppressHydrationWarning>
              {(expertsList.length > 0 ? expertsList.slice(0, 3) : [
                { id: '1', name: 'الشيخ أحمد السلمي', title: 'التفسير الشرعي', rating: 4.9, completedDreams: 1240, badge: 'الأكثر طلباً', badgeColor: 'bg-amber-500', avatar: '👤' },
                { id: '2', name: 'د. سارة المطيري', title: 'التحليل النفسي', rating: 4.8, completedDreams: 890, badge: 'رد سريع', badgeColor: 'bg-green-500', avatar: '👤' },
                { id: '3', name: 'الشيخ محمد الزهراني', title: 'أحلام المرأة', rating: 4.9, completedDreams: 2100, badge: 'متخصص', badgeColor: 'bg-blue-500', avatar: '👤' },
              ]).map((expert: any, idx) => {
                // Dynamic badges for fetched data if not present
                let badge = expert.badge;
                let badgeColor = expert.badgeColor;
                if (!badge && expertsList.length > 0) {
                  if (idx === 0) { badge = 'الأكثر طلباً'; badgeColor = 'bg-amber-500'; }
                  else if (idx === 1) { badge = 'رد سريع'; badgeColor = 'bg-green-500'; }
                  else if (idx === 2) { badge = 'متخصص'; badgeColor = 'bg-blue-500'; }
                }

                return (
                  <div key={idx} className="card relative transform hover:-translate-y-2 transition-all duration-300 border-opacity-30 hover:border-opacity-100" style={{ minWidth: 280, textAlign: 'center' }} suppressHydrationWarning>
                    {/* Badge */}
                    {badge && (
                      <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${badgeColor} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10`}>
                        {badge}
                      </div>
                    )}

                    <div suppressHydrationWarning style={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      margin: 'var(--spacing-sm) auto var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      border: '3px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden'
                    }}>
                      {expert.avatar?.startsWith('/') || expert.avatar?.startsWith('http') || expert.avatar?.startsWith('data:') ? (
                        <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
                      ) : (
                        expert.avatar || '👤'
                      )}
                    </div>
                    <h4 className="text-lg mb-1">{expert.name}</h4>
                    <p className="text-[var(--color-text-accent)] text-sm mb-4">{expert.title}</p>

                    <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-lg mb-4 text-sm" suppressHydrationWarning>
                      <div className="flex justify-between items-center">
                        <span className="text-muted">التقييم:</span>
                        <span className="text-gold font-bold">⭐ {expert.rating}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted">الجلسات:</span>
                        <span>{expert.completedDreams}+</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          // Ensure we save the full object structure needed for reuse or just ID
                          const storedInterpreter = {
                            ...expert,
                            // Ensure critical fields used elsewhere are present if needed, 
                            // though selectedHumanInterpreter usually just needs the base properties
                          };
                          setSelectedHumanInterpreter(storedInterpreter);
                          // Also save to local storage for persistence if needed
                          localStorage.setItem('selected_human_interpreter', expert.id);
                        }
                        // Scroll to top
                        document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="btn btn-outline btn-sm w-full hover:bg-[var(--color-primary)] hover:border-transparent hover:text-white transition-colors">
                      احجز استشارة خاصة
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pricing Info Box (New) */}
        <section className="py-12 mb-32 bg-[var(--color-bg-secondary)]/50 border-y border-[var(--color-border)]">
          <div className="container max-w-4xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 rounded-2xl bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)]">
              <div className="flex-1 text-center md:text-right">
                <h3 className="text-xl font-bold mb-2">💡 كيف تعمل التكلفة؟</h3>
                <p className="text-sm text-muted">نضمن لك الشفافية التامة في جميع تعاملاتنا</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="flex-1 p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)] text-center">
                  <div className="text-[var(--color-primary-light)] font-bold mb-1">الذكاء الاصطناعي</div>
                  <div className="text-green-400 font-bold text-lg mb-1">مجاني</div>
                  <div className="text-[10px] text-muted">عدد محدود يومياً</div>
                </div>
                <div className="flex-1 p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)] text-center">
                  <div className="text-[var(--color-secondary)] font-bold mb-1">المفسر الخاص</div>
                  <div className="text-white font-bold text-lg mb-1">من 29 ر.س</div>
                  <div className="text-[10px] text-muted">ضمان ذهبي للاسترجاع</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Symbol Library Preview */}
        <section className="section mb-32">
          <div className="container" suppressHydrationWarning>
            <div className="text-center mb-2xl" suppressHydrationWarning>
              <h2>📚 قاموس تفسير الأحلام</h2>
              <p className="text-muted mt-md">اكتشف معاني رموز الأحلام حسب ابن سيرين والنابلسي</p>
            </div>

            {/* Categories */}
            <div className="flex justify-center gap-md mb-xl" style={{ flexWrap: 'wrap' }} suppressHydrationWarning>
              {symbolCategories.slice(0, 6).map(cat => (
                <Link href={`/symbols?category=${cat.id}`} key={cat.id} className="btn btn-ghost">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>

            {/* Popular Symbols Grid */}
            <div className="symbol-grid" suppressHydrationWarning>
              {dreamSymbols.slice(0, 12).map(symbol => (
                <Link href={`/symbols/${symbol.id}`} key={symbol.id} className="symbol-card">
                  <div className="symbol-icon" suppressHydrationWarning>{symbol.icon}</div>
                  <div className="symbol-name" suppressHydrationWarning>{symbol.name}</div>
                  <div className="symbol-count" suppressHydrationWarning>{symbol.relatedSymbols.length} رموز مرتبطة</div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-xl" suppressHydrationWarning>
              <Link href="/symbols" className="btn btn-outline btn-lg">
                استكشف جميع الرموز ←
              </Link>
            </div>
          </div>
        </section>

        {/* Sheikh Abu Malik Section */}
        <section className="section py-24 mb-32" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="container" suppressHydrationWarning>
            <div className="glass-card" style={{ maxWidth: 900, margin: '0 auto' }} suppressHydrationWarning>
              <div className="text-center mb-8" suppressHydrationWarning>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">هل تبحث عن مفسر ؟</h2>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8" suppressHydrationWarning>
                <div className="w-full md:w-1/3 flex justify-center" suppressHydrationWarning>
                  <div className="relative w-48 h-48 md:w-60 md:h-60 rounded-full overflow-hidden border-4 border-[var(--color-gold)] shadow-2xl" suppressHydrationWarning>
                    <img
                      src="/cv.png"
                      alt="الشيخ ابو مالك المرسلي"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="w-full md:w-2/3 text-center md:text-right" suppressHydrationWarning>
                  <h3 className="text-xl md:text-2xl text-[var(--color-primary-light)] font-bold mb-4">
                    الشيخ ابو مالك المرسلي مفسر الرؤي والأحلام
                  </h3>
                  <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] mb-6">
                    مؤسس موقع المفسر، مفسر أحلام، وداعم نفسي. خبير في تفسير الرؤى ، مع استشارات نفسية وروحانية لمساعدتك على فهم أحلامك براحة وطمأنينة.
                  </p>

                  <div className="flex justify-center md:justify-start gap-4" suppressHydrationWarning>
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push('/booking')}
                    >
                      حجز جلسة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dream Journal CTA */}
        <section className="section mb-32">
          <div className="container" suppressHydrationWarning>
            <div className="flex items-center gap-2xl" style={{ flexWrap: 'wrap' }} suppressHydrationWarning>
              <div style={{ flex: 1, minWidth: 300 }} suppressHydrationWarning>
                <h2 className="mb-lg">📖 سجل أحلامك الشخصي</h2>
                <p className="text-muted mb-lg">
                  احتفظ بمفكرة أحلام رقمية، تتبع الأحلام المتكررة، واكتشف أنماط أحلامك عبر الزمن
                </p>
                <ul style={{ listStyle: 'none' }}>
                  <li className="mb-md flex gap-sm items-center">
                    <span className="text-gold">✓</span>
                    <span>سجل حلمك مع التاريخ ومشاعرك</span>
                  </li>
                  <li className="mb-md flex gap-sm items-center">
                    <span className="text-gold">✓</span>
                    <span>تتبع الأحلام المتكررة وتطورها</span>
                  </li>
                  <li className="mb-md flex gap-sm items-center">
                    <span className="text-gold">✓</span>
                    <span>إحصائيات: أكثر الرموز ظهوراً</span>
                  </li>
                  <li className="mb-md flex gap-sm items-center">
                    <span className="text-gold">✓</span>
                    <span>تنبيهات ذكية بمقالات ذات صلة</span>
                  </li>
                </ul>
                <Link href="/journal" className="btn btn-primary btn-lg mt-lg">
                  ابدأ سجل أحلامك ←
                </Link>
              </div>
              <div style={{ flex: 1, minWidth: 300 }} suppressHydrationWarning>
                <div className="stats-grid" suppressHydrationWarning>
                  <div className="stat-card" suppressHydrationWarning>
                    <div className="stat-value" suppressHydrationWarning>12</div>
                    <div className="stat-label" suppressHydrationWarning>حلم مسجل</div>
                  </div>
                  <div className="stat-card" suppressHydrationWarning>
                    <div className="stat-value" suppressHydrationWarning>💧</div>
                    <div className="stat-label" suppressHydrationWarning>الرمز الأكثر</div>
                  </div>
                  <div className="stat-card" suppressHydrationWarning>
                    <div className="stat-value" suppressHydrationWarning>3</div>
                    <div className="stat-label" suppressHydrationWarning>أحلام متكررة</div>
                  </div>
                  <div className="stat-card" suppressHydrationWarning>
                    <div className="stat-value" suppressHydrationWarning>😊</div>
                    <div className="stat-label" suppressHydrationWarning>المزاج العام</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Educational Content */}
        <section className="section py-24" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="container" suppressHydrationWarning>
            <div className="text-center mb-2xl" suppressHydrationWarning>
              <h2>📚 تعلّم وافهم</h2>
              <p className="text-muted mt-md">محتوى تعليمي يجمع بين الشريعة وعلم النفس الحديث</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)' }} suppressHydrationWarning>
              {/* FAQ Card */}
              <div className="card" suppressHydrationWarning>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }} suppressHydrationWarning>📜</div>
                <h4>الأسئلة الشرعية</h4>
                <p className="text-muted mt-sm mb-lg">
                  الفرق بين الرؤيا والحلم، حكم الاعتماد على التفسير، آداب النوم
                </p>
                <Link href="/learn/faq" className="btn btn-ghost btn-sm">اقرأ المزيد ←</Link>
              </div>

              {/* Psychology Card */}
              <div className="card" suppressHydrationWarning>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }} suppressHydrationWarning>🧠</div>
                <h4>فهم ذاتك عبر أحلامك</h4>
                <p className="text-muted mt-sm mb-lg">
                  مبادئ فرويد ويونغ مع الحفاظ على الثوابت الشرعية
                </p>
                <Link href="/learn/psychology" className="btn btn-ghost btn-sm">اقرأ المزيد ←</Link>
              </div>

              {/* Videos Card */}
              <div className="card" suppressHydrationWarning>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }} suppressHydrationWarning>🎬</div>
                <h4>فيديوهات قصيرة</h4>
                <p className="text-muted mt-sm mb-lg">
                  تفسير الرموز الشائعة بطريقة جذابة ومبسطة
                </p>
                <Link href="/learn/videos" className="btn btn-ghost btn-sm">شاهد الآن ←</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Action */}
        <section className="section py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/20 to-transparent pointer-events-none" />
          <div className="container text-center relative z-10" suppressHydrationWarning>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">لا تدع أحلامك تفوتك</h2>
            <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto">
              الرموز تتلاشى من الذاكرة بسرعة. سجل حلمك الآن لتعرف معناه وتطمئن قلبك.
            </p>
            <button
              onClick={() => document.getElementById('dream-input-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn btn-primary btn-lg text-lg px-12 py-4 shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:shadow-[0_0_50px_rgba(124,58,237,0.7)] transform hover:scale-105 transition-all"
            >
              ابدأ التفسير الآن 🌙
            </button>
          </div>
        </section>

      </main >

      <Footer />
      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )
      }
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
