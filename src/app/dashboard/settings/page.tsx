'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    User,
    Mail,
    Settings as SettingsIcon,
    DollarSign,
    FileText,
    Save,
    Loader2,
    Shield,
    ArrowRight
} from 'lucide-react';
import AccountStatusCard from '@/components/dashboard/AccountStatusCard';

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null); // New Stats State
    const [interpreterProfile, setInterpreterProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [price, setPrice] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            loadData();
        }
    }, [user, authLoading]);

    const loadData = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Parallel Fetch: Profile + Real Stats
            const [profileRes, statsRes] = await Promise.all([
                fetch('/api/user/profile', { headers }),
                fetch('/api/user/stats', { headers })
            ]);

            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.user);
                setInterpreterProfile(data.interpreterProfile);
                setDisplayName(data.user.displayName || '');
                if (data.interpreterProfile) {
                    setBio(data.interpreterProfile.bio || '');
                    setPrice(data.interpreterProfile.price?.toString() || '');
                    setAvatar(data.interpreterProfile.avatar || '');
                    setAvatarPreview(data.interpreterProfile.avatar || '');
                }
            } else {
                toast.error('فشل في تحميل الملف الشخصي');
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

        } catch (error) {
            console.error(error);
            toast.error('فشل في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('يرجى اختيار صورة صالحة');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setAvatar(base64String);
            setAvatarPreview(base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const token = await user.getIdToken();
            const body: any = { displayName };
            if (interpreterProfile) {
                body.bio = bio;
                if (avatar) {
                    body.avatar = avatar;
                }
                const numPrice = parseFloat(price);
                if (!isNaN(numPrice)) {
                    if (numPrice < 1 || numPrice > 100) {
                        toast.error('السعر يجب أن يكون بين 1 و 100 دولار');
                        setSaving(false);
                        return;
                    }
                    body.price = numPrice;
                }
            }

            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.user);
                toast.success('تم تحديث الملف الشخصي بنجاح');
                // Refresh to ensure sync
                loadData();
            } else {
                const errData = await res.json();
                toast.error(errData.error || 'حدث خطأ أثناء التحديث');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
            </div>
        );
    }

    if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/';
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <SettingsIcon className="text-[var(--color-primary)]" />
                        الإعدادات
                    </h1>
                    <p className="text-gray-400 mt-1">تعديل بياناتك الشخصية وتفضيلات الحساب</p>
                </div>
                <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-2">
                    <ArrowRight size={16} />
                    لوحة التحكم
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Profile Form */}
                <div className="glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 pb-4 border-b border-white/5">
                        <User size={20} className="text-[var(--color-primary)]" />
                        الملف الشخصي
                    </h3>

                    <form onSubmit={handleSave} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Mail size={16} /> البريد الإلكتروني
                            </label>
                            <input
                                type="text"
                                value={profile?.email || user.email}
                                disabled
                                className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-gray-500 cursor-not-allowed font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <User size={16} /> اسم العرض
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all text-white placeholder-gray-600"
                                placeholder="الاسم الظاهر للمستخدمين"
                            />
                        </div>

                        {interpreterProfile && (
                            <>
                                <div className="space-y-2 animate-fadeIn">
                                    <label className="text-sm text-amber-400 font-medium flex items-center gap-2">
                                        <User size={16} /> الصورة الشخصية
                                    </label>

                                    <div className="flex items-center gap-4">
                                        {/* Avatar Preview */}
                                        <div className="w-24 h-24 rounded-xl bg-[var(--color-bg-tertiary)] border-2 border-amber-500/20 flex items-center justify-center text-4xl overflow-hidden shadow-lg">
                                            {avatarPreview ? (
                                                avatarPreview.startsWith('data:') || avatarPreview.startsWith('http') ? (
                                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{avatarPreview}</span>
                                                )
                                            ) : (
                                                <User size={32} className="text-gray-500" />
                                            )}
                                        </div>

                                        {/* Upload Button */}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 rounded-xl text-amber-200 transition-all font-medium text-sm"
                                            >
                                                <User size={16} />
                                                اختر صورة
                                            </label>
                                            <p className="text-xs text-amber-500/70 mt-2">
                                                حجم الصورة يجب أن يكون أقل من 2 ميجابايت
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 animate-fadeIn">
                                    <label className="text-sm text-amber-400 font-medium flex items-center gap-2">
                                        <DollarSign size={16} /> سعر التفسير (USD)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-amber-900/10 border border-amber-500/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-amber-100 placeholder-amber-900/50"
                                        placeholder="5.00"
                                    />
                                    <p className="text-xs text-amber-500/70">السعر المسموح به: من 1 إلى 100 دولار.</p>
                                </div>

                                <div className="space-y-2 animate-fadeIn">
                                    <label className="text-sm text-amber-400 font-medium flex items-center gap-2">
                                        <FileText size={16} /> النبذة التعريفية
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-amber-900/10 border border-amber-500/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-amber-100 placeholder-amber-900/50 min-h-[120px] resize-none"
                                        placeholder="اكتب نبذة مختصرة عن خبرتك ومنهجك في التفسير..."
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 bg-[var(--color-primary)] hover:bg-violet-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    حفظ التغييرات
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">

                    {/* Interpreter Card */}
                    {interpreterProfile && (
                        <div className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-transparent">
                            <h3 className="text-lg font-bold mb-4 text-amber-400 flex items-center gap-2">
                                <Shield size={18} />
                                لوحة المفسر
                            </h3>
                            <p className="text-sm text-amber-200/70 mb-6 leading-relaxed">
                                بصفتك مفسرًا معتمدًا، يمكنك إدارة ملفك المهني وعروضك من خلال لوحة تحكم المفسرين المخصصة.
                            </p>
                            <Link
                                href="/interpreter/dashboard"
                                className="block w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-center transition-colors mb-3"
                            >
                                الذهاب للوحة المفسرين
                            </Link>
                        </div>
                    )}

                    {/* Account Stats - USING NEW COMMON COMPONENT */}
                    {stats && (
                        <div>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                <Shield size={18} className="text-emerald-400" />
                                حالة الحساب
                            </h3>
                            <div className="space-y-4"> {/* Wrapper for spacing */}
                                <AccountStatusCard
                                    plan={stats.plan}
                                    credits={stats.credits}
                                    isDailyFreeAvailable={stats.isDailyFreeAvailable}
                                    nextFreeAt={stats.nextFreeAt}
                                />
                            </div>

                            {/* Additional info not in card */}
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 mt-4">
                                <span className="text-sm text-gray-400">تاريخ الانضمام</span>
                                <span className="text-sm dir-ltr">
                                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US') : '-'}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="glass-card p-6 rounded-2xl border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                        <Link href="/contact" className="flex items-center justify-between text-gray-400 hover:text-white">
                            <span className="flex items-center gap-2">
                                <Mail size={16} />
                                هل تحتاج مساعدة؟
                            </span>
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
