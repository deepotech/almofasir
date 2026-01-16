'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Calendar, Clock, User as UserIcon, Loader, Plus } from 'lucide-react';

interface Booking {
    _id: string;
    interpreterName: string;
    date: string;
    timeSlot: string;
    amount: number;
    status: string;
    createdAt: string;
}

export default function AppointmentsPage() {
    const { user, loading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchBookings = async () => {
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/bookings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setBookings(data.bookings);
                }
            } catch (error) {
                console.error('Failed to fetch bookings', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user]);

    if (authLoading || (loading && user)) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-white">
                <Loader className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans">
            <Header />
            <div className="flex pt-20 min-h-screen">
                <Sidebar />

                <main className="flex-1 p-6 lg:p-10 ml-0 lg:ml-64 transition-all duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">مواعيدي</h1>
                        <Link href="/booking" className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white px-10 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 font-bold text-xl min-w-[240px]">
                            <Plus size={28} />
                            <span>حجز موعد جديد</span>
                        </Link>
                    </div>

                    {bookings.length === 0 ? (
                        <div className="glass-card p-10 text-center">
                            <Calendar size={48} className="mx-auto mb-4 text-gray-500" />
                            <h2 className="text-xl font-bold mb-2">لا توجد حجوزات حالياً</h2>
                            <p className="text-gray-400 mb-6">لم تقم بحجز أي جلسة مع مفسر بعد.</p>
                            <Link href="/booking" className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white px-10 py-4 rounded-xl transition-all shadow-xl shadow-orange-500/30 font-bold text-xl hover:scale-105 transform">
                                <span>احجز موعدك الأول</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="glass-card p-6 relative overflow-hidden group hover:bg-white/5 transition-colors">
                                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg">{booking.interpreterName}</h3>
                                            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                                                {booking.status === 'confirmed' ? 'مؤكد' : booking.status}
                                            </span>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                                            <UserIcon size={20} className="text-emerald-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-500" />
                                            <span>{booking.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-500" />
                                            <span>{booking.timeSlot}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-between items-center text-sm">
                                        <span className="text-gray-400">قيمة الحجز</span>
                                        <span className="font-bold text-white">${booking.amount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
}
