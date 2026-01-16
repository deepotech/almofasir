'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Globe, Award, Save, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        type: 'mixed',
        status: 'active',
        price: '30',
        avatar: ''
    });

    useEffect(() => {
        if (!authLoading && user) {
            fetchProfile();
        }
    }, [user, authLoading]);

    const fetchProfile = async () => {
        try {
            const token = await user!.getIdToken();
            const res = await fetch('/api/user/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const iProfile = data.interpreterProfile;

                setFormData({
                    name: data.user.displayName || iProfile?.displayName || '',
                    email: data.user.email || '',
                    bio: iProfile?.bio || '',
                    type: iProfile?.interpretationType || 'mixed',
                    status: iProfile?.status || 'active',
                    price: iProfile?.price?.toString() || '30',
                    avatar: iProfile?.avatar || ''
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل الملف الشخصي');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            // Simple resize logic could go here, but for now just raw base64
            // ideally we resize to 300x300 to save DB space
            const img = new Image();
            img.src = reader.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setFormData(prev => ({ ...prev, avatar: dataUrl }));
            };
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = await user!.getIdToken();

            // Validate Price
            const numPrice = parseFloat(formData.price);
            if (isNaN(numPrice) || numPrice < 1 || numPrice > 100) {
                toast.error('السعر يجب أن يكون بين 1 و 100 دولار');
                setSaving(false);
                return;
            }

            const body = {
                displayName: formData.name,
                bio: formData.bio,
                price: numPrice,
                avatar: formData.avatar
            };

            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success('تم حفظ التغييرات بنجاح');
            } else {
                toast.error('حدث خطأ أثناء الحفظ');
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold mb-2">الملف الشخصي</h1>
                <p className="text-gray-400">تحكم في بياناتك الظاهرة للمستخدمين</p>
            </div>

            <div className="glass-card p-8">
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input')?.click()}>
                        <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-4xl font-bold border-4 border-[var(--color-bg-secondary)] shadow-xl overflow-hidden">
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                formData.name.charAt(0)
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-white">تغيير</span>
                        </div>
                        <input
                            type="file"
                            id="avatar-input"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{formData.name}</h2>
                        <p className="text-gray-400 text-sm mb-3">مفسر معتمد لدى منصة المفسر</p>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">حساب موثوق</span>
                            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded border border-amber-500/20">Pro Plan</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">الاسم المعروض</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full pl-10"
                                />
                                <User className="absolute left-3 top-3 text-gray-500" size={18} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">البريد الإلكتروني</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={formData.email}
                                    className="input w-full pl-10 text-left"
                                    dir="ltr"
                                    disabled
                                />
                                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">النبذة التعريفية</label>
                        <textarea
                            rows={4}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="textarea w-full"
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-2">هذه النبذة ستظهر للمستخدمين في صفحة ملفك الشخصي.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">منهج التفسير</label>
                            <div className="relative">
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="input w-full pl-10 cursor-pointer"
                                    disabled // Disabled until API supports it
                                >
                                    <option value="religious">شرعي</option>
                                    <option value="psychological">نفسي</option>
                                    <option value="symbolic">رمزي</option>
                                    <option value="mixed">مختلط</option>
                                </select>
                                <Award className="absolute left-3 top-3 text-gray-500" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gold mb-2">سعر التفسير (USD)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="input w-full pl-10 border-gold/50 focus:border-gold"
                                    placeholder="30"
                                />
                                <DollarSign className="absolute left-3 top-3 text-gold" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary px-8 py-3 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
