import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
    return (
        <>
            <Header />
            <main className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Cosmic Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black -z-20" />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="container mx-auto px-4 z-10" suppressHydrationWarning>
                    <div className="glass-card max-w-lg mx-auto p-12 border border-white/10 shadow-2xl">
                        <div className="text-8xl mb-6 filter drop-shadow-lg">🌑</div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">404</h1>
                        <h2 className="text-2xl font-bold mb-6 text-[var(--color-primary-light)]">
                            الصفحة غير موجودة
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            يبدو أنك ضللت الطريق في عالم الأحلام. هذه الصفحة قد تكون اختفت أو لم تكن موجودة من الأساس.
                        </p>
                        <Link
                            href="/"
                            className="btn btn-primary btn-lg inline-flex items-center gap-2 group"
                        >
                            <span>🏠</span>
                            <span>العودة للرئيسية</span>
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
