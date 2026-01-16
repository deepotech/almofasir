'use client';

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface LiveCounterProps {
    start: number;
    add: number; // The additional real count to add to the start
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

export default function LiveCounter({
    start,
    add,
    duration = 2000,
    className = "",
    prefix = "",
    suffix = "+"
}: LiveCounterProps) {
    const [count, setCount] = useState(start);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    // We only want to animate the "additional" part effectively, or the whole thing?
    // User asked to "start from the same numbers shown" (e.g. 15000) and count "real users".
    // So if real users = 10, total = 15010.
    // Ideally we animate from 15000 -> 15010 slowly, or if the number is large, we animate all of it.
    // Let's animate from 'start' to 'start + add'.

    const end = start + add;

    useEffect(() => {
        if (isInView) {
            let startTime: number | null = null;
            let animationFrameId: number;

            const step = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);

                // Easing function (easeOutExpo)
                const easeOut = (x: number): number => {
                    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
                };

                const currentCount = Math.floor(start + (add * easeOut(progress)));
                setCount(currentCount);

                if (progress < 1) {
                    animationFrameId = window.requestAnimationFrame(step);
                }
            };

            animationFrameId = window.requestAnimationFrame(step);

            return () => {
                if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
            };
        }
    }, [isInView, start, add, duration]);

    return (
        <span ref={ref} className={className} suppressHydrationWarning>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}
