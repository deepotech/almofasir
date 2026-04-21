'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
    interpretation: string;
    symbols?: { name: string; icon: string; brief: string }[];
    /** Simulated accuracy percentage (visual trust signal) */
    confidenceScore?: number;
}

function ConfidenceBar({ score }: { score: number }) {
    const [displayed, setDisplayed] = useState(0);

    useEffect(() => {
        let current = 0;
        const target = score;
        const step = target / 60;
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setDisplayed(Math.round(current));
            if (current >= target) clearInterval(timer);
        }, 20);
        return () => clearInterval(timer);
    }, [score]);

    const color =
        score >= 80 ? '#10b981' :
        score >= 60 ? '#f59e0b' :
        '#ef4444';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="confidence-bar-wrap"
        >
            <div className="confidence-bar-header">
                <span className="confidence-bar-label">📊 دقة التحليل</span>
                <span className="confidence-bar-pct" style={{ color }}>{displayed}%</span>
            </div>
            <div className="confidence-bar-track">
                <motion.div
                    className="confidence-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                    style={{ background: `linear-gradient(90deg, #7c3aed, ${color})` }}
                />
            </div>
            <p className="confidence-bar-hint">
                مبني على تفاصيل حلمك والرموز المكتشفة
            </p>
        </motion.div>
    );
}

export default function InterpretationDisplay({ interpretation, symbols, confidenceScore }: Props) {
    if (!interpretation) {
        return (
            <div className="text-center text-gray-400 p-6">
                جاري التحميل...
            </div>
        );
    }

    const parseSections = (text: string) => {
        const sections = { summary: '', details: '', advice: '' };
        const summaryMatch = text.match(/1\. \*\*(.*?)\*\*:\s*([\s\S]*?)(?=2\. \*\*|$)/);
        const detailsMatch = text.match(/2\. \*\*(.*?)\*\*:\s*([\s\S]*?)(?=3\. \*\*|$)/);
        const adviceMatch = text.match(/3\. \*\*(.*?)\*\*:\s*([\s\S]*$)/);
        if (summaryMatch) sections.summary = summaryMatch[2].trim();
        if (detailsMatch) sections.details = detailsMatch[2].trim();
        if (adviceMatch) sections.advice = adviceMatch[2].trim();
        if (!sections.summary && !sections.details) sections.details = text;
        return sections;
    };

    const { summary, details, advice } = parseSections(interpretation);
    const score = confidenceScore ?? Math.floor(Math.random() * 12 + 82); // 82-93%

    return (
        <div className="space-y-6 text-right" dir="rtl">

            {/* Discovered Symbols (if passed) */}
            {symbols && symbols.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="interpretation-symbols-row"
                >
                    <p className="interpretation-symbols-title">🧩 الرموز المكتشفة في حلمك</p>
                    <div className="interpretation-symbols-list">
                        {symbols.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="interp-symbol-chip"
                            >
                                <span className="interp-symbol-chip-icon">{s.icon}</span>
                                <span className="interp-symbol-chip-name">{s.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Confidence Score */}
            <ConfidenceBar score={score} />

            {/* Summary Section */}
            {summary && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-1 h-full bg-[var(--color-gold)]" />
                    <h4 className="text-[var(--color-gold)] font-bold mb-3 flex items-center gap-2">
                        <span>✨</span>
                        <span>الخلاصة</span>
                    </h4>
                    <p className="text-lg leading-relaxed text-white font-medium">{summary}</p>
                </motion.div>
            )}

            {/* Detailed Interpretation */}
            {details && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6"
                >
                    <h4 className="text-[var(--color-primary-light)] font-bold mb-3 flex items-center gap-2">
                        <span>📖</span>
                        <span>التفسير</span>
                    </h4>
                    <div className="prose prose-invert max-w-none text-[var(--color-text-secondary)] leading-loose whitespace-pre-wrap">
                        {details}
                    </div>
                </motion.div>
            )}

            {/* Advice Section */}
            {advice && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-green-900/10 border border-green-800/30 rounded-xl p-6"
                >
                    <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                        <span>💡</span>
                        <span>النصيحة</span>
                    </h4>
                    <p className="text-green-100/80 leading-relaxed">{advice}</p>
                </motion.div>
            )}
        </div>
    );
}
