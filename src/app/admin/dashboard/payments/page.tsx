'use client';

import { DollarSign, Check, X } from 'lucide-react';

export default function PaymentsPage() {
    // Mock Withdrawal Requests
    const withdrawals = [
        { id: 1, interpreter: 'أحمد محمد', amount: '$150.00', method: 'PayPal', account: 'ahmed@email.com', date: '2025-01-07', status: 'pending' },
        { id: 2, interpreter: 'سارة علي', amount: '$320.00', method: 'Bank Transfer', account: 'SA88200...', date: '2025-01-08', status: 'pending' },
        { id: 3, interpreter: 'خالد عمر', amount: '$50.00', method: 'PayPal', account: 'khaled@email.com', date: '2025-01-05', status: 'approved' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">إجمالي الإيرادات</p>
                    <h3 className="text-3xl font-bold text-white">$45,200</h3>
                </div>
                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">أرباح المفسرين (موزعة)</p>
                    <h3 className="text-3xl font-bold text-orange-400">$31,640</h3>
                </div>
                <div className="bg-[#0a0a1a] border border-white/5 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">صافي ربح المنصة</p>
                    <h3 className="text-3xl font-bold text-green-400">$13,560</h3>
                </div>
            </div>

            {/* Withdrawal Requests */}
            <div>
                <h2 className="text-xl font-bold mb-4">طلبات السحب المعلقة</h2>
                <div className="bg-[#0a0a1a] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-white/5 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4">المفسر</th>
                                <th className="p-4">المبلغ</th>
                                <th className="p-4">طريقة الدفع</th>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4">إجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {withdrawals.map((req) => (
                                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold">{req.interpreter}</td>
                                    <td className="p-4 font-mono text-emerald-400 font-bold">{req.amount}</td>
                                    <td className="p-4 text-sm text-gray-300">
                                        <div className="flex flex-col">
                                            <span>{req.method}</span>
                                            <span className="text-xs text-gray-500">{req.account}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">{req.date}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${req.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {req.status === 'pending' ? 'بانتظار الموافقة' : 'تم التحويل'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {req.status === 'pending' && (
                                            <div className="flex items-center gap-2">
                                                <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-colors">
                                                    <Check size={14} /> قبول
                                                </button>
                                                <button className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors">
                                                    <X size={14} /> رفض
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
