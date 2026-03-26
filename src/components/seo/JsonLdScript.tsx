// Server Component - no 'use client' needed for static JSON-LD injection
import { generateHomepageSchemas } from '@/lib/seo';

// Combined schema for homepage (server-rendered)
export function HomePageJsonLd() {
    const schemas = generateHomepageSchemas();
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
    );
}

export default function JsonLdScript() {
    return null; // Deprecated - use HomePageJsonLd or page-level schema injection
}
