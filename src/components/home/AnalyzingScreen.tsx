'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
    { icon: '🧠', label: 'استخراج الرموز من حلمك...', duration: 1000 },
    { icon: '🔍', label: 'تحليل المعاني والإشارات...', duration: 1200 },
    { icon: '🔗', label: 'ربط التفسير بحالتك وشعورك...', duration: 1000 },
    { icon: '✨', label: 'التفسير جاهز!', duration: 600 },
];

interface Props {
    isVisible: boolean;
}

export default function AnalyzingScreen({ isVisible }: Props) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isVisible) {
            setCurrentStep(0);
            setProgress(0);
            return;
        }

        let elapsed = 0;
        const total = STEPS.reduce((sum, s) => sum + s.duration, 0);

        // Smooth progress bar
        const progressInterval = setInterval(() => {
            elapsed += 50;
            setProgress(Math.min((elapsed / total) * 100, 98));
            if (elapsed >= total) {
                clearInterval(progressInterval);
                setProgress(100);
            }
        }, 50);

        // Step cycling
        let stepIdx = 0;
        const advance = () => {
            if (stepIdx < STEPS.length - 1) {
                stepIdx++;
                setCurrentStep(stepIdx);
                setTimeout(advance, STEPS[stepIdx].duration);
            }
        };
        const firstTimeout = setTimeout(advance, STEPS[0].duration);

        return () => {
            clearTimeout(firstTimeout);
            clearInterval(progressInterval);
        };
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="analyzing-screen"
                >
                    {/* Cosmic bg orbs */}
                    <div className="analyzing-orb analyzing-orb-1" />
                    <div className="analyzing-orb analyzing-orb-2" />

                    {/* Central icon */}
                    <motion.div
                        className="analyzing-icon-wrap"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    >
                        <div className="analyzing-icon-ring" />
                        <div className="analyzing-icon-core">🔮</div>
                    </motion.div>

                    {/* Step label */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.35 }}
                            className="analyzing-step"
                        >
                            <span className="analyzing-step-icon">{STEPS[currentStep].icon}</span>
                            <span className="analyzing-step-label">{STEPS[currentStep].label}</span>
                        </motion.div>
                    </AnimatePresence>

                    {/* Steps dots */}
                    <div className="analyzing-dots">
                        {STEPS.map((_, i) => (
                            <motion.div
                                key={i}
                                className={`analyzing-dot ${i <= currentStep ? 'analyzing-dot-active' : ''}`}
                                animate={i === currentStep ? { scale: [1, 1.4, 1] } : {}}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            />
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="analyzing-progress-track">
                        <motion.div
                            className="analyzing-progress-fill"
                            style={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>

                    <p className="analyzing-hint">
                        كلما كتبت تفاصيل أكثر… كان التفسير أدق
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
