export interface HumanInterpreter {
    id: string;
    name: string;
    slug: string; // for SEO friendly URLs if needed later
    title: string;
    bio: string;
    isVerified: boolean;
    isExpert: boolean;
    rating: number;
    reviewsCount: number;
    completedDreams: number;
    responseSpeed: '24h' | '48h' | '6h'; // Speed options
    price: number;
    currency: string;
    avatar: string; // Path to image or emoji for now
    types: ('religious' | 'psychological' | 'symbolic')[];
    status: 'available' | 'busy' | 'offline';
}

export const humanInterpreters: HumanInterpreter[] = [
    {
        id: 'int_001',
        name: 'الشيخ أبو مالك المرسلي',
        slug: 'abu-malik',
        title: 'مفسر رؤى شرعي ونفسي',
        bio: 'خبرة 15 عاماً في التفسير الشرعي المقارن، مع مراعاة الحالة النفسية للرائي. متخصص في الرموز المعقدة.',
        isVerified: true,
        isExpert: true,
        rating: 4.9,
        reviewsCount: 342,
        completedDreams: 1540,
        responseSpeed: '24h',
        price: 49,
        currency: '$',
        avatar: '/cv.png',
        types: ['religious', 'psychological'],
        status: 'available'
    }
];
