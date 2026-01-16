'use client';

import { Search, Eye, RefreshCw, XCircle } from 'lucide-react';

export default function DreamsPage() {
    // Mock Dreams Data
    const dreams = [
        { id: 101, title: 'حلم الطيران فوق البحر', user: 'User123', interpreter: 'أحمد محمد', status: 'new', time: 'منذ ساعتين' },
        { id: 102, title: 'سقوط الأسنان', user: 'Guest_55', interpreter: 'سارة علي', status: 'in_progress', time: 'منذ 5 ساعات' },
        { id: 103, title: 'رؤية الميت', user: 'Amal', interpreter: 'أحمد محمد', status: 'completed', time: 'منذ يوم' },
        { id: 104, title: 'الثعبان الأسود', user: 'Khaled', interpreter: '-', status: 'new', time: 'منذ 3 ساعات' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold">إدارة الأحلام</h1>

            <div className="bg-[#0a0a1a] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-white/5 text-gray-400 text-sm">
                        <tr>
                            <th className="p-4">الحلم</th>
                            <th className="p-4">المستخدم</th>
                            <th className="p-4">المفسر المعيّل</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {dreams.map((dream) => (
                            <tr key={dream.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-white text-sm">{dream.title}</p>
                                    <p className="text-xs text-gray-500">{dream.time}</p>
                                </td>
                                <td className="p-4 text-sm text-gray-300">{dream.user}</td>
                                <td className="p-4 text-sm text-gray-300">{dream.interpreter}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${dream.status === 'new' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            dream.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                        {dream.status === 'new' ? 'جديد' :
                                            dream.status === 'in_progress' ? 'قيد التفسير' : 'مكتمل'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20" title="عرض">
                                            <Eye size={16} />
                                        </button>
                                        {dream.status !== 'completed' && (
                                            <>
                                                <button className="p-2 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20" title="إعادة تعيين">
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20" title="إلغاء الحلم">
                                                    <XCircle size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
