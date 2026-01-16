"use client";

import React, { useEffect, useRef, useState } from "react";

interface Star {
    x: number;
    y: number;
    size: number;
    opacity: number;
    speedX: number;
    speedY: number;
}

interface StarBackgroundProps {
    starCount?: number;
    speed?: number;
}

export default function StarBackground({
    starCount = 150,
    speed = 0.05,
}: StarBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Mouse position state
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = {
                x: e.clientX,
                y: e.clientY,
            };
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);

        // Initial size
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // Initialize stars
        const stars: Star[] = [];
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * dimensions.width,
                y: Math.random() * dimensions.height,
                size: Math.random() * 1.5 + 0.5, // 0.5 to 2.0
                opacity: Math.random(),
                speedX: (Math.random() - 0.5) * speed,
                speedY: (Math.random() - 0.5) * speed,
            });
        }

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

            // Draw stars
            stars.forEach((star) => {
                // Update position based on base speed
                star.x += star.speedX;
                star.y += star.speedY;

                // Interaction: Move slightly away from mouse
                const dx = star.x - mouseRef.current.x;
                const dy = star.y - mouseRef.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 200; // Interaction radius

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    const moveX = (dx / distance) * force * 2; // Repulsion strength
                    const moveY = (dy / distance) * force * 2;

                    star.x += moveX;
                    star.y += moveY;
                }

                // Wrap around screen
                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;

                // Draw star
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();

                // Twinkle effect
                if (Math.random() > 0.95) {
                    star.opacity = Math.random();
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [dimensions, starCount, speed]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10"
            style={{ background: 'transparent' }}
        />
    );
}
