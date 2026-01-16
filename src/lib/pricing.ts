export const PLANS = {
    'ai-single': {
        id: 'ai-single',
        name: 'تفسيرات إضافية',
        price: 2.99,
        credits: 3,
        features: [
            '3 تفسيرات ذكاء اصطناعي إضافية',
            'رصيد صالح لمدة 30 يوماً',
            'بدون اشتراك أو تجديد تلقائي'
        ],
        type: 'one-time',
        highlight: false
    },
    'ai-monthly': {
        id: 'ai-monthly',
        name: 'الباقة الشهرية',
        price: 7.99,
        creditsPerMonth: 15,
        features: [
            '15 تفسير شهرياً',
            'سجل أحلام منظم',
            'توفير 50% مقارنة بالمفرد',
            'إلغاء في أي وقت'
        ],
        type: 'subscription',
        highlight: true
    },
    'human-single': {
        id: 'human-single',
        name: 'تفسير بشري متخصص',
        priceFrom: 12,
        features: [
            'مفسر حقيقي يقرأ حلمك',
            'يراعي سياقك الشخصي',
            'رد خلال 24-48 ساعة'
        ],
        type: 'service',
        highlight: false
    }
};

export const FREE_DAILY_LIMIT = 1;
export const RESET_HOUR_UTC = 0; // Midnight UTC
