'use client';

import { useEffect, useRef, useState } from 'react';

interface TikTokEmbedProps {
    videoId: string;
    videoUrl: string;
    title: string;
    thumbnailUrl?: string;
}

export default function TikTokEmbed({
    videoId,
    videoUrl,
    title,
    thumbnailUrl,
}: TikTokEmbedProps) {
    const [isPlayerActive, setIsPlayerActive] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sanitize videoId to digits only (prevent any injection)
    const cleanVideoId = (videoId || '').replace(/[^0-9]/g, '');
    const cleanVideoUrl = (videoUrl || '').startsWith('https://')
        ? videoUrl
        : `https://www.tiktok.com/@almofasir_/video/${cleanVideoId}`;

    useEffect(() => {
        if (!isPlayerActive || !cleanVideoId) return;

        // Dynamically load TikTok's official embed.js once active
        const scriptId = 'tiktok-embed-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
        } else if ((window as any).tiktokEmbed) {
            try {
                (window as any).tiktokEmbed.load();
            } catch {
                // Safe ignore
            }
        }
    }, [isPlayerActive, cleanVideoId]);

    return (
        <div className="w-full max-w-md mx-auto my-6">
            <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl min-h-[580px] flex items-center justify-center"
            >
                {!isPlayerActive ? (
                    /* Performance & Core Web Vitals Facade: Fast thumbnail preview with click-to-play */
                    <div
                        onClick={() => setIsPlayerActive(true)}
                        className="relative w-full h-[580px] cursor-pointer group flex items-center justify-center bg-black/40 overflow-hidden"
                        title="انقر لتشغيل الفيديو"
                    >
                        {thumbnailUrl ? (
                            <img
                                src={thumbnailUrl}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="text-6xl">🎬</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center gap-3">
                            <span className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center text-2xl shadow-2xl transition-transform group-hover:scale-110">
                                ▶
                            </span>
                            <span className="text-xs bg-black/70 text-white px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                انقر للتشغيل عبر مشغل TikTok
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Secure Official TikTok Embed: sandboxed & XSS-immune */
                    <iframe
                        src={`https://www.tiktok.com/embed/v2/${cleanVideoId}?lang=ar`}
                        className="w-full h-[600px] border-0"
                        title={title}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                    />
                )}
            </div>

            {/* Direct Link to Official TikTok Profile / Video */}
            <div className="text-center mt-3">
                <a
                    href={cleanVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-muted hover:text-[var(--color-primary-light)] transition-colors"
                    dir="ltr"
                >
                    <span>Watch on TikTok @almofasir_</span>
                    <span>↗</span>
                </a>
            </div>
        </div>
    );
}
