'use client';

import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/pricing';
import { X, Zap, User } from 'lucide-react';

interface UpgradePromptProps {
    onClose?: () => void;
}

export default function UpgradePrompt({ onClose }: UpgradePromptProps) {
    const router = useRouter();

    const handleSelect = (planId: string) => {
        // Redirect to register/checkout flow
        router.push(`/pricing/confirm?method=ai&plan=${planId}`);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden animate-scaleIn shadow-2xl">

                {/* Header */}
                <div className="p-6 text-center border-b border-white/5 relative">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute left-4 top-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">استخدمت تفسيرك المجاني اليوم 🌙</h3>
                    <p className="text-gray-400 text-sm">
                        لا تقلق، سيتجدد رصيدك المجاني غداً. <br />
                        هل تريد تفسير حلم آخر الآن؟
                    </p>
                </div>

                {/* Options */}
                <div className="p-6 space-y-4">

                    {/* Wait Option */}
                    <button
                        onClick={onClose}
                        className="w-full p-4 rounded-xl border border-white/10 hover:bg-white/5 text-right transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-medium mb-1">🕐 انتظر حتى الغد</h4>
                                <p className="text-gray-500 text-xs">سيتوفر لك تفسير مجاني جديد بعد منتصف الليل</p>
                            </div>
                            <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                حسناً
                            </span>
                        </div>
                    </button>

                    {/* Extra Credits Option */}
                    <button
                        onClick={() => handleSelect('ai-single')}
                        className="w-full p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/50 hover:bg-indigo-600/20 text-right transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h4 className="text-indigo-300 font-bold mb-1">⚡ 3 تفسيرات إضافية</h4>
                                    <p className="text-indigo-400/70 text-xs">صلاحية 30 يوم • بدون اشتراك</p>
                                </div>
                            </div>
                            <span className="font-bold text-white bg-indigo-600 px-3 py-1 rounded-full text-sm">
                                $2.99
                            </span>
                        </div>
                    </button>

                    {/* Human Option */}
                    <button
                        onClick={() => router.push('/experts')}
                        className="w-full p-4 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-right transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h4 className="text-emerald-300 font-medium mb-1">👤 استشارة مفسر خاص</h4>
                                    <p className="text-emerald-400/70 text-xs">تحليل بشري معمق لحالتك</p>
                                </div>
                            </div>
                            <span className="text-emerald-400 text-sm flex items-center gap-1">
                                تصفح المفسرين &larr;
                            </span>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
}
