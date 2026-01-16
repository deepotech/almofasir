
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    interpretation: string;
}

export default function InterpretationDisplay({ interpretation }: Props) {
    // Guard against undefined/null interpretation
    if (!interpretation) {
        return (
            <div className="text-center text-gray-400 p-6">
                جاري التحميل...
            </div>
        );
    }

    // Parsing Logic
    // We look for the patterns "1. **Title**:" or similar markers.
    // Since the AI output can vary slightly, we'll try to be robust.

    const parseSections = (text: string) => {
        const sections = {
            summary: '',
            details: '',
            advice: ''
        };

        // Regex to match the requested format
        // 1. **خلاصة سريعة**: 
        // 2. **تفسير تفصيلي**: 
        // 3. **نصيحة أو تنبيه**: 

        const summaryMatch = text.match(/1\. \*\*(.*?)\*\*:\s*([\s\S]*?)(?=2\. \*\*|$)/);
        const detailsMatch = text.match(/2\. \*\*(.*?)\*\*:\s*([\s\S]*?)(?=3\. \*\*|$)/);
        const adviceMatch = text.match(/3\. \*\*(.*?)\*\*:\s*([\s\S]*$)/);

        if (summaryMatch) sections.summary = summaryMatch[2].trim();
        if (detailsMatch) sections.details = detailsMatch[2].trim();
        if (adviceMatch) sections.advice = adviceMatch[2].trim();

        // Fallback if parsing fails (e.g. older format)
        if (!sections.summary && !sections.details) {
            sections.details = text; // Just treat everything as details
        }

        return sections;
    };

    const { summary, details, advice } = parseSections(interpretation);

    return (
        <div className="space-y-6 text-right" dir="rtl">

            {/* Summary Section */}
            {summary && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--color-bg-tertiary)]/50 border border-[var(--color-border)] rounded-xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-1 h-full bg-[var(--color-gold)]"></div>
                    <h4 className="text-[var(--color-gold)] font-bold mb-3 flex items-center gap-2">
                        <span>✨</span>
                        <span>خلاصة سريعة</span>
                    </h4>
                    <p className="text-lg leading-relaxed text-white font-medium">
                        {summary}
                    </p>
                </motion.div>
            )}

            {/* Detailed Interpretation */}
            {details && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6"
                >
                    <h4 className="text-[var(--color-primary-light)] font-bold mb-3 flex items-center gap-2">
                        <span>📖</span>
                        <span>التفسير التفصيلي</span>
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
                    transition={{ delay: 0.2 }}
                    className="bg-green-900/10 border border-green-800/30 rounded-xl p-6"
                >
                    <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                        <span>💡</span>
                        <span>نصيحة وتنبيه</span>
                    </h4>
                    <p className="text-green-100/80 leading-relaxed">
                        {advice}
                    </p>
                </motion.div>
            )}
        </div>
    );
}
