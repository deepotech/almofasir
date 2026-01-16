import { classicInterpreters } from '@/data/interpreters';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Props {
    params: Promise<{ name: string }>;
}

export function generateStaticParams() {
    return classicInterpreters.map((interpreter) => ({
        name: interpreter.id,
    }));
}

export async function generateMetadata({ params }: Props) {
    const { name } = await params;
    const interpreter = classicInterpreters.find((i) => i.id === name);

    if (!interpreter) {
        return {
            title: 'المفسر غير موجود',
        };
    }

    return {
        title: `تفسير الأحلام على منهج ${interpreter.name} | المفسر`,
        description: `احصل على تفسير دقيق لحلمك وفق منهج ${interpreter.name} (${interpreter.title}). تفسير شامل يعتمد على ${interpreter.book || 'كتب التراث'}.`,
    };
}

export default async function InterpreterPage({ params }: Props) {
    const { name } = await params;
    const interpreter = classicInterpreters.find((i) => i.id === name);

    if (!interpreter) {
        notFound();
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-12 relative overflow-hidden">
                {/* Cosmic Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black -z-20" />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    {/* Hero Section */}
                    <div className="glass-card max-w-4xl mx-auto p-8 md:p-12 text-center mb-12 animate-fadeIn relative overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20">
                        {/* Shine Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-300 inline-block drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {interpreter.icon}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-indigo-200">
                            تفسير الأحلام على منهج {interpreter.name}
                        </h1>
                        <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                            {interpreter.description}
                        </p>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                        <div className="glass-card p-8 hover:bg-white/5 transition-colors border border-white/5 text-center h-full flex flex-col justify-center">
                            <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3 text-gold">
                                <span className="text-3xl">📚</span> المرجع المعتمد
                            </h2>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                يعتمد التفسير على كتاب <strong className="text-white border-b border-gold/30 pb-0.5">{interpreter.book || 'كتب التراث المعتمدة'}</strong>، وهو من أهم المراجع المصنفة في علم تعبير الرؤى عبر التاريخ الإسلامي.
                            </p>
                        </div>
                        <div className="glass-card p-8 hover:bg-white/5 transition-colors border border-white/5 text-center h-full flex flex-col justify-center">
                            <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3 text-blue-300">
                                <span className="text-3xl">⏳</span> العصر والسيرة
                            </h2>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                عاش في الفترة <strong className="text-white">{interpreter.era}</strong>، وعُرف بلقب <span className="bg-white/10 px-2 py-0.5 rounded text-white text-sm">"{interpreter.title}"</span> لما تميز به من دقة وفهم عميق للرموز.
                            </p>
                        </div>
                    </div>

                    {/* Specialty Badges - Redesigned */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-gray-400 inline-block border-b-2 border-white/5 pb-2">مميزات منهجه</h3>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            {interpreter.specialty.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 text-gray-200 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-default"
                                >
                                    ✨ {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center pb-8">
                        <div className="glass-card max-w-2xl mx-auto p-12 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h2 className="text-2xl font-bold mb-8 relative z-10">هل ترغب بتفسير حلمك وفق هذا المنهج؟</h2>
                            <Link
                                href={`/?interpreter=${interpreter.id}`}
                                className="relative z-10 btn btn-primary btn-lg inline-flex items-center gap-3 px-8 py-4 text-lg shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all"
                            >
                                <span className="text-2xl">🌙</span>
                                <span>فسّر حلمك الآن بمنهج {interpreter.name}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
