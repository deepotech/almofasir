'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSymbolById, dreamSymbols } from '@/data/symbols';

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default function SymbolDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const symbol = getSymbolById(resolvedParams.symbol);

    if (!symbol) {
        notFound();
    }

    const tabs = [
        { id: 'general', label: 'التفسير العام', content: symbol.interpretations.general },
        { id: 'married', label: 'للمتزوجة', content: symbol.interpretations.forMarried },
        { id: 'single', label: 'للعزباء', content: symbol.interpretations.forSingle },
        { id: 'man', label: 'للرجل', content: symbol.interpretations.forMan },
        { id: 'pregnant', label: 'للحامل', content: symbol.interpretations.forPregnant },
        { id: 'psychology', label: 'التحليل النفسي', content: symbol.interpretations.psychological },
    ];

    return (
        <>
            <Header />

            <main style={{ paddingTop: 100 }}>
                <section className="section">
                    <div className="container" style={{ maxWidth: 900 }}>
                        {/* Breadcrumb */}
                        <div className="mb-xl">
                            <Link href="/symbols" className="text-muted">مكتبة الرموز</Link>
                            <span className="text-muted"> ← </span>
                            <span>{symbol.name}</span>
                        </div>

                        {/* Symbol Header */}
                        <div className="glass-card text-center mb-2xl">
                            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>{symbol.icon}</div>
                            <h1 className="mb-md">{symbol.name}</h1>
                            <p className="text-muted">{symbol.interpretations.general}</p>

                            <div className="flex justify-center gap-md mt-xl" style={{ flexWrap: 'wrap' }}>
                                {symbol.relatedSymbols.map((rs, idx) => (
                                    <span key={idx} className="tag">{rs}</span>
                                ))}
                            </div>
                        </div>

                        {/* Interpretation Tabs */}
                        <div className="card mb-2xl">
                            <h3 className="mb-xl">📋 التفسير حسب الحالة</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
                                {tabs.map(tab => (
                                    <div key={tab.id} className="card" style={{ background: 'var(--color-bg-glass)' }}>
                                        <h4 className="text-gold mb-md">{tab.label}</h4>
                                        <p className="text-muted" style={{ lineHeight: 1.8 }}>{tab.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Classical References */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-xl)' }}>
                            {/* Ibn Sirin */}
                            <div className="card">
                                <h4 className="mb-lg" style={{ color: 'var(--color-secondary)' }}>📜 ابن سيرين</h4>
                                <p style={{ lineHeight: 2, fontStyle: 'italic' }}>{symbol.ibnSirin}</p>
                            </div>

                            {/* Nabulsi */}
                            <div className="card">
                                <h4 className="mb-lg" style={{ color: 'var(--color-primary-light)' }}>📚 النابلسي</h4>
                                <p style={{ lineHeight: 2, fontStyle: 'italic' }}>{symbol.nabulsi}</p>
                            </div>
                        </div>

                        {/* Real Examples */}
                        <div className="card mt-2xl">
                            <h3 className="mb-xl">💡 أمثلة واقعية</h3>
                            {symbol.examples.map((example, idx) => (
                                <div key={idx} className="mb-lg" style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--color-bg-glass)',
                                    borderRadius: 'var(--radius-md)',
                                    borderRight: '3px solid var(--color-primary)'
                                }}>
                                    <p className="text-muted">{example}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="glass-card text-center mt-2xl">
                            <h3 className="mb-md">🌟 هل تريد تفسيراً مخصصاً لحلمك؟</h3>
                            <p className="text-muted mb-xl">تواصل مع مفسر متخصص للحصول على تفسير يراعي سياق حياتك</p>
                            <div className="flex justify-center gap-md">
                                <Link href="/" className="btn btn-primary">فسّر حلمك الآن</Link>
                                <Link href="/experts" className="btn btn-outline">تواصل مع مفسر</Link>
                            </div>
                        </div>

                        {/* Related Symbols */}
                        <div className="mt-2xl">
                            <h3 className="mb-xl">🔗 رموز ذات صلة</h3>
                            <div className="symbol-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                                {dreamSymbols
                                    .filter(s => s.id !== symbol.id && s.category === symbol.category)
                                    .slice(0, 4)
                                    .map(s => (
                                        <Link href={`/symbols/${s.id}`} key={s.id} className="symbol-card">
                                            <div className="symbol-icon">{s.icon}</div>
                                            <div className="symbol-name">{s.name}</div>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
