'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Video, VideoFAQ } from '@/types/video';
import {
    Plus,
    Video as VideoIcon,
    ExternalLink,
    Edit3,
    Trash2,
    Eye,
    EyeOff,
    Check,
    X,
    Loader2,
    RefreshCw,
    Search,
    AlertCircle,
} from 'lucide-react';

export default function AdminVideosPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [oembedLoading, setOembedLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('الكل');

    // Form Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
    const [deleteModalVideo, setDeleteModalVideo] = useState<Video | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form fields
    const [formData, setFormData] = useState({
        tiktokUrl: '',
        tiktokVideoId: '',
        title: '',
        slug: '',
        category: 'تفسير الرموز',
        description: '',
        thumbnailUrl: '',
        authorName: 'المُفسِّر',
        authorUsername: 'almofasir_',
        duration: '',
        seoTitle: '',
        seoDescription: '',
        articleContent: '',
        takeawaysText: '',
        faqList: [] as VideoFAQ[],
        isPublished: true,
        embedHtml: '',
    });

    // Helper to fetch videos
    const fetchVideos = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/videos', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setVideos(data.videos || []);
            } else {
                const errData = await res.json().catch(() => ({}));
                setFeedback({
                    type: 'error',
                    message: errData.error || 'فشل تحميل الفيديوهات من قاعدة البيانات'
                });
            }
        } catch (e: any) {
            console.error('Failed to fetch videos', e);
            setFeedback({
                type: 'error',
                message: e?.message || 'خطأ في الاتصال بالسيرفر'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [user]);

    // Handle Fetch TikTok oEmbed
    const handleFetchOEmbed = async () => {
        if (!formData.tiktokUrl.trim() || !user) return;
        setOembedLoading(true);
        setFeedback(null);

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/videos/oembed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ url: formData.tiktokUrl.trim() }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                setFeedback({ type: 'error', message: result.error || 'فشل جلب بيانات TikTok.' });
            } else {
                const oData = result.data;
                setFormData((prev) => ({
                    ...prev,
                    tiktokVideoId: oData.videoId,
                    title: prev.title || oData.title,
                    slug: prev.slug || oData.suggestedSlug,
                    thumbnailUrl: oData.thumbnailUrl,
                    authorName: oData.authorName,
                    authorUsername: oData.authorUsername,
                    embedHtml: oData.embedHtml,
                    seoTitle: prev.seoTitle || `${oData.title} | المُفسِّر`,
                }));
                setFeedback({ type: 'success', message: 'تم استرجاع بيانات TikTok الرسمية بنجاح!' });
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: 'حدث خطأ في الاتصال أثناء جلب بيانات TikTok.' });
        } finally {
            setOembedLoading(false);
        }
    };

    // Open Modal for Create or Edit
    const handleOpenCreate = () => {
        setEditingVideoId(null);
        setFormData({
            tiktokUrl: '',
            tiktokVideoId: '',
            title: '',
            slug: '',
            category: 'تفسير الرموز',
            description: '',
            thumbnailUrl: '',
            authorName: 'المُفسِّر',
            authorUsername: 'almofasir_',
            duration: '',
            seoTitle: '',
            seoDescription: '',
            articleContent: '',
            takeawaysText: '',
            faqList: [],
            isPublished: true,
            embedHtml: '',
        });
        setFeedback(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (v: Video) => {
        setEditingVideoId(v.id);
        setFormData({
            tiktokUrl: v.tiktokUrl || '',
            tiktokVideoId: v.tiktokVideoId || '',
            title: v.title || '',
            slug: v.slug || '',
            category: v.category || 'تفسير الرموز',
            description: v.description || '',
            thumbnailUrl: v.thumbnailUrl || '',
            authorName: v.authorName || 'المُفسِّر',
            authorUsername: v.authorUsername || 'almofasir_',
            duration: v.duration || '',
            seoTitle: v.seoTitle || '',
            seoDescription: v.seoDescription || '',
            articleContent: v.articleContent || '',
            takeawaysText: (v.takeaways || []).join('\n'),
            faqList: v.faq || [],
            isPublished: v.isPublished ?? true,
            embedHtml: v.embedHtml || '',
        });
        setFeedback(null);
        setIsModalOpen(true);
    };

    // Save Video
    const handleSaveVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setActionLoading(true);
        setFeedback(null);

        const takeaways = formData.takeawaysText
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean);

        const payload: Partial<Video> = {
            id: editingVideoId || undefined,
            title: formData.title.trim(),
            slug: formData.slug.trim(),
            tiktokUrl: formData.tiktokUrl.trim(),
            tiktokVideoId: formData.tiktokVideoId.trim(),
            category: formData.category,
            description: formData.description.trim(),
            thumbnailUrl: formData.thumbnailUrl.trim(),
            authorName: formData.authorName.trim(),
            authorUsername: formData.authorUsername.trim(),
            duration: formData.duration.trim() || undefined,
            seoTitle: formData.seoTitle.trim() || undefined,
            seoDescription: formData.seoDescription.trim() || undefined,
            articleContent: formData.articleContent.trim() || undefined,
            takeaways,
            faq: formData.faqList,
            isPublished: formData.isPublished,
            embedHtml: formData.embedHtml || undefined,
        };

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/admin/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                setFeedback({ type: 'error', message: result.error || 'فشل حفظ الفيديو.' });
            } else {
                setIsModalOpen(false);
                await fetchVideos();
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: 'خطأ في الاتصال بالخادم.' });
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle Published Status
    const handleTogglePublish = async (v: Video) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await fetch('/api/admin/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...v,
                    isPublished: !v.isPublished,
                }),
            });
            await fetchVideos();
        } catch (err) {
            console.error('Toggle publish error', err);
        }
    };

    // Delete Video
    const handleConfirmDelete = async () => {
        if (!deleteModalVideo || !user) return;
        setActionLoading(true);

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/videos?id=${deleteModalVideo.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setDeleteModalVideo(null);
                await fetchVideos();
            }
        } catch (err) {
            console.error('Delete error', err);
        } finally {
            setActionLoading(false);
        }
    };

    // FAQ Handlers inside modal
    const handleAddFaq = () => {
        setFormData((prev) => ({
            ...prev,
            faqList: [...prev.faqList, { question: '', answer: '' }],
        }));
    };

    const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
        setFormData((prev) => {
            const updated = [...prev.faqList];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, faqList: updated };
        });
    };

    const handleRemoveFaq = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            faqList: prev.faqList.filter((_, i) => i !== index),
        }));
    };

    // Filter videos
    const filteredVideos = videos.filter((v) => {
        const matchesSearch =
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'الكل' || v.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categoriesList = ['الكل', 'تعليمي', 'مفاهيم', 'رموز', 'آداب', 'تساؤلات', 'تاريخ'];

    return (
        <div className="space-y-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <VideoIcon className="text-red-500" />
                        <span>إدارة مكتبة الفيديو ومحتوى TikTok</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        إضافة وتحرير مقاطع الفيديو المرتبطة بـ @almofasir_ وإثراء محتوى الـ SEO
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchVideos}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                        title="تحديث القائمة"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-600/20"
                    >
                        <Plus size={18} />
                        <span>إضافة فيديو جديد</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a0a1a] p-4 rounded-2xl border border-white/5">
                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute right-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث بالعنوان أو الـ slug..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                    />
                </div>

                <div className="flex gap-2 flex-wrap w-full md:w-auto">
                    {categoriesList.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedCategory === cat
                                    ? 'bg-red-600 text-white font-bold'
                                    : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Videos Table */}
            {loading ? (
                <div className="text-center py-20 bg-[#0a0a1a] rounded-2xl border border-white/5">
                    <Loader2 size={32} className="animate-spin text-red-500 mx-auto mb-3" />
                    <p className="text-gray-400">جاري تحميل الفيديوهات...</p>
                </div>
            ) : filteredVideos.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a1a] rounded-2xl border border-white/5">
                    <VideoIcon size={40} className="text-gray-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-300 mb-1">لا توجد فيديوهات مطابقة</h3>
                    <p className="text-sm text-gray-500">أضف فيديو جديد أو عدل معايير البحث.</p>
                </div>
            ) : (
                <div className="bg-[#0a0a1a] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-white/5 text-gray-400 font-bold border-b border-white/5">
                                <tr>
                                    <th className="p-4">الفيديو</th>
                                    <th className="p-4">التصنيف</th>
                                    <th className="p-4">المسار (Slug)</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredVideos.map((v) => (
                                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 relative">
                                                    {v.thumbnailUrl ? (
                                                        <img
                                                            src={v.thumbnailUrl}
                                                            alt={v.title}
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />

                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs">
                                                            🎬
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white truncate max-w-xs md:max-w-md">
                                                        {v.title}
                                                    </p>
                                                    <span className="text-xs text-gray-500" dir="ltr">
                                                        ID: {v.tiktokVideoId}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
                                                {v.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs text-gray-400 font-mono truncate block max-w-[150px]">
                                                {v.slug}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleTogglePublish(v)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                                    v.isPublished
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                }`}
                                            >
                                                {v.isPublished ? (
                                                    <>
                                                        <Eye size={12} />
                                                        <span>منشور</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff size={12} />
                                                        <span>مسودة</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {v.isPublished && (
                                                    <Link
                                                        href={`/learn/videos/${v.slug}`}
                                                        target="_blank"
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                        title="معاينة الصفحة الحية"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleOpenEdit(v)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModalVideo(v)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-[#0e0e24] border border-white/10 rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <VideoIcon className="text-red-500" />
                                <span>{editingVideoId ? 'تعديل الفيديو ومحتوى الـ SEO' : 'إضافة فيديو TikTok جديد'}</span>
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveVideo} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                            {feedback && (
                                <div
                                    className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                                        feedback.type === 'success'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}
                                >
                                    <AlertCircle size={16} />
                                    <span>{feedback.message}</span>
                                </div>
                            )}

                            {/* TikTok URL + Fetch Section */}
                            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3">
                                <label className="block font-bold text-gray-300">
                                    رابط فيديو TikTok (الرسمي):
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        placeholder="https://www.tiktok.com/@almofasir_/video/..."
                                        value={formData.tiktokUrl}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tiktokUrl: e.target.value })
                                        }
                                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
                                        dir="ltr"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleFetchOEmbed}
                                        disabled={oembedLoading || !formData.tiktokUrl}
                                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {oembedLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <RefreshCw size={16} />
                                        )}
                                        <span>جلب بيانات TikTok</span>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    يستدعي خدمة oEmbed الرسمية المعتمدة من TikTok لاستخراج الغلاف والعنوان وكود التضمين فوراً.
                                </p>
                            </div>

                            {/* Thumbnail & Video ID Preview */}
                            {(formData.thumbnailUrl || formData.tiktokVideoId) && (
                                <div className="flex items-center gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                    {formData.thumbnailUrl && (
                                        <img
                                            src={formData.thumbnailUrl}
                                            alt="Preview"
                                            className="w-20 h-28 object-cover rounded-lg border border-white/10"
                                            referrerPolicy="no-referrer"
                                        />

                                    )}
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">
                                            معرّف الفيديو (Video ID):{' '}
                                            <span className="font-mono text-white" dir="ltr">
                                                {formData.tiktokVideoId}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            الحساب:{' '}
                                            <span className="text-red-400" dir="ltr">
                                                @{formData.authorUsername}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-300 mb-1">
                                        عنوان الفيديو: *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-300 mb-1">
                                        المسار في الرابط (Slug): *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) =>
                                            setFormData({ ...formData, slug: e.target.value })
                                        }
                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                                        required
                                        dir="ltr"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-300 mb-1">
                                        التصنيف:
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                        className="w-full px-4 py-2 rounded-xl bg-[#0a0a1a] border border-white/10 text-white focus:outline-none focus:border-red-500"
                                    >
                                        <option value="تفسير الرموز">تفسير الرموز</option>
                                        <option value="تعليمي">تعليمي</option>
                                        <option value="مفاهيم">مفاهيم</option>
                                        <option value="رموز">رموز</option>
                                        <option value="آداب">آداب</option>
                                        <option value="تساؤلات">تساؤلات</option>
                                        <option value="تاريخ">تاريخ</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-300 mb-1">
                                        مدة الفيديو (اختياري):
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="05:30"
                                        value={formData.duration}
                                        onChange={(e) =>
                                            setFormData({ ...formData, duration: e.target.value })
                                        }
                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block font-bold text-gray-300 mb-1">
                                    الوصف المختصر:
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                                />
                            </div>

                            {/* Key Takeaways */}
                            <div>
                                <label className="block font-bold text-gray-300 mb-1">
                                    ماذا ستتعلم من هذا الفيديو؟ (اكتب كل نقطة في سطر مستقل):
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="النقطة الأولى&#10;النقطة الثانية&#10;النقطة الثالثة"
                                    value={formData.takeawaysText}
                                    onChange={(e) =>
                                        setFormData({ ...formData, takeawaysText: e.target.value })
                                    }
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 leading-relaxed"
                                />
                            </div>

                            {/* Editorial Article Content */}
                            <div>
                                <label className="block font-bold text-gray-300 mb-1">
                                    المقال التحريري الأصيل (SEO Editorial Article):
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    شرح مفصل وأصيل لموضوع الفيديو لرفع جودة الـ SEO وتحويل الزوار. افصل بين الفقرات بسطر فارغ.
                                </p>
                                <textarea
                                    rows={6}
                                    value={formData.articleContent}
                                    onChange={(e) =>
                                        setFormData({ ...formData, articleContent: e.target.value })
                                    }
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 leading-relaxed"
                                    placeholder="اكتب التحليل التحريري المفصل هنا..."
                                />
                            </div>

                            {/* FAQ Section */}
                            <div className="border border-white/10 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-gray-200">الأسئلة الشائعة (FAQ):</h4>
                                    <button
                                        type="button"
                                        onClick={handleAddFaq}
                                        className="text-xs text-red-400 hover:text-red-300 font-bold"
                                    >
                                        + إضافة سؤال
                                    </button>
                                </div>
                                {formData.faqList.map((faq, idx) => (
                                    <div key={idx} className="space-y-2 bg-white/[0.02] p-3 rounded-lg border border-white/5 relative">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFaq(idx)}
                                            className="absolute top-2 left-2 text-gray-500 hover:text-red-400"
                                        >
                                            <X size={14} />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="السؤال..."
                                            value={faq.question}
                                            onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                        />
                                        <textarea
                                            rows={2}
                                            placeholder="الإجابة..."
                                            value={faq.answer}
                                            onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* SEO Overrides */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-300 mb-1">
                                        عنوان الـ SEO (Meta Title):
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.seoTitle}
                                        onChange={(e) =>
                                            setFormData({ ...formData, seoTitle: e.target.value })
                                        }
                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-300 mb-1">
                                        وصف الـ SEO (Meta Description):
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.seoDescription}
                                        onChange={(e) =>
                                            setFormData({ ...formData, seoDescription: e.target.value })
                                        }
                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            {/* Publish Toggle */}
                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublished}
                                        onChange={(e) =>
                                            setFormData({ ...formData, isPublished: e.target.checked })
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                                <span className="font-bold text-gray-200">
                                    {formData.isPublished ? 'نشر الفيديو للعامة' : 'حفظ كمسودة غير منشورة'}
                                </span>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
                                >
                                    {actionLoading && <Loader2 size={16} className="animate-spin" />}
                                    <span>{editingVideoId ? 'حفظ التعديلات' : 'إضافة الفيديو'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#0e0e24] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white mb-2">تأكيد حذف الفيديو</h3>
                            <p className="text-sm text-gray-400">
                                هل أنت متأكد من حذف الفيديو: &quot;{deleteModalVideo.title}&quot;؟
                                لا يمكن التراجع عن هذا الإجراء.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteModalVideo(null)}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                                <span>تأكيد الحذف</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
