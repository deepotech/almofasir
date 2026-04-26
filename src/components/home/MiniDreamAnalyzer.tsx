'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  symbolName: string;
}

export default function MiniDreamAnalyzer({ symbolName }: Props) {
  const [text, setText] = useState('');
  const router = useRouter();

  const handleAnalyze = () => {
    if (!text.trim()) return;
    // Save to localStorage so the home page can pick it up
    localStorage.setItem('prefill_dream_text', text);
    router.push('/');
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[var(--color-primary)]/30 shadow-2xl relative overflow-hidden mb-12 transform hover:scale-[1.01] transition-transform duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-primary)]/10 rounded-bl-full pointer-events-none blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-secondary)]/10 rounded-tr-full pointer-events-none blur-2xl" />
      
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="animate-pulse">✨</span>
          هل رأيت {symbolName} في منامك؟
        </h3>
        <p className="text-gray-300 text-sm mb-5 leading-relaxed">
          لا تبحث كثيراً، اكتب تفاصيل حلمك هنا وسنقوم بتحليل رموزه واستخراج رسالته وفق منهج ابن سيرين والنابلسي الآن.
        </p>
        
        <div className="relative">
          <textarea
            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-primary)] transition-all resize-none mb-4"
            rows={3}
            placeholder={`اكتب حلمك هنا... (مثال: رأيت ${symbolName} وكنت أشعر بـ...)`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text.length > 0 && (
             <div className="absolute left-3 bottom-7 text-xs text-green-400 font-medium">
               ممتاز، استمر في كتابة التفاصيل...
             </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleAnalyze}
            disabled={!text.trim()}
            className="btn btn-primary w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all"
          >
            <span>🔮</span>
            <span>اكتشف رسالة الحلم الآن (مجاناً)</span>
          </button>
          <div className="flex items-center gap-1 text-[11px] text-green-500/90 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            خصوصية تامة
          </div>
        </div>
      </div>
    </div>
  );
}
