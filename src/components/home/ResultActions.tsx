'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Props {
    dreamId?: string | null;
    dreamText?: string;
    interpretation?: string;
    onInterpretAnother: () => void;
    onSave?: () => void;
    isLoggedIn: boolean;
}

export default function ResultActions({
    dreamId,
    dreamText,
    interpretation,
    onInterpretAnother,
    onSave,
    isLoggedIn,
}: Props) {
    const router = useRouter();

    const handleWhatsApp = () => {
        const text = encodeURIComponent(
            `🔮 تفسير حلمي من المفسر:\n\n${interpretation?.substring(0, 300)}...\n\nفسّر حلمك الآن: https://almofasser.com`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleDeepInterpretation = () => {
        router.push('/experts');
    };

    const handleReport = () => {
        router.push('/pricing');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="result-actions-wrap"
        >
            {/* Upsell Banner */}
            <div className="result-upsell-banner">
                <div className="result-upsell-content">
                    <div className="result-upsell-icon">💡</div>
                    <div>
                        <p className="result-upsell-title">هل تريد تفسيراً أعمق؟</p>
                        <p className="result-upsell-desc">
                            احصل على تحليل نفسي + تحليل علاقات + تفسير مستقبلي من مفسر معتمد
                        </p>
                    </div>
                </div>
                <div className="result-upsell-btns">
                    <button
                        className="btn btn-secondary result-upsell-cta"
                        onClick={handleDeepInterpretation}
                    >
                        👨‍🏫 تفسير متقدم من مفسر
                    </button>
                    <button
                        className="btn btn-outline result-upsell-cta-secondary"
                        onClick={handleReport}
                    >
                        📋 تقرير مفصل
                    </button>
                </div>
            </div>

            {/* Retention Actions */}
            <div className="result-retention-row">
                {/* Save dream */}
                {isLoggedIn ? (
                    <button
                        className="result-action-btn"
                        onClick={onSave}
                        title="احفظ هذا الحلم"
                    >
                        <span className="result-action-icon">💾</span>
                        <span>احفظ الحلم</span>
                    </button>
                ) : (
                    <button
                        className="result-action-btn"
                        onClick={() => router.push('/auth/register')}
                        title="سجّل لحفظ الحلم"
                    >
                        <span className="result-action-icon">💾</span>
                        <span>احفظ الحلم</span>
                    </button>
                )}

                {/* WhatsApp share */}
                {interpretation && (
                    <button
                        className="result-action-btn result-action-whatsapp"
                        onClick={handleWhatsApp}
                        title="أرسل التفسير لواتساب"
                    >
                        <span className="result-action-icon">📲</span>
                        <span>شارك واتساب</span>
                    </button>
                )}

                {/* Interpret another */}
                <button
                    className="result-action-btn result-action-another"
                    onClick={onInterpretAnother}
                    title="فسّر حلماً آخر"
                >
                    <span className="result-action-icon">🔮</span>
                    <span>فسّر حلماً آخر</span>
                </button>
            </div>

            {/* Loop hook */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="result-loop-hook"
            >
                هل حلمت بشيء مشابه من قبل؟ ←{' '}
                <button
                    className="result-loop-link"
                    onClick={onInterpretAnother}
                >
                    جرّب حلماً آخر
                </button>
            </motion.p>
        </motion.div>
    );
}
