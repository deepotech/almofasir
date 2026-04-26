'use client';

import { useState, useEffect, useRef } from 'react';

// Declare standard Web Speech API types to fix TS errors
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Props {
  onTextResult: (text: string) => void;
}

export default function VoiceInput({ onTextResult }: Props) {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA'; // Arabic

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTextResult(finalTranscript + ' ');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('يرجى السماح للميكروفون');
        } else if (event.error === 'no-speech') {
           // just ignore no-speech
        } else if (event.error === 'network') {
           setError('يتطلب اتصال آمن (HTTPS) أو إذن الميكروفون');
        } else {
           setError('حدث خطأ بالصوت');
        }
        
        // Clear error after 4 seconds
        setTimeout(() => setError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError('المتصفح لا يدعم التسجيل');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTextResult]);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Handle case where recognition is already started
        console.error(e);
      }
    }
  };

  return (
    <div className="relative inline-flex items-center z-10">
      <button
        onClick={toggleListen}
        type="button"
        title="تحدث بدلاً من الكتابة"
        className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
          isListening 
            ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-[var(--color-primary)] border border-white/5 hover:border-white/20'
        }`}
      >
        {isListening ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {error && (
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] text-red-400 bg-red-900/40 px-2 py-0.5 rounded backdrop-blur-sm">
          {error}
        </span>
      )}
      
      {isListening && !error && (
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] text-red-400 font-medium animate-pulse">
          تحدث الآن...
        </span>
      )}
    </div>
  );
}
