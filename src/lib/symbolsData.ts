import { supabaseAdmin } from '@/lib/supabase';
import { dreamSymbols as staticSymbols } from '@/data/symbols';

export type UnifiedSymbol = {
    id: string; // The unified slug string
    name: string;
    icon: string;
    category: string;
    aliases: string[];
    interpretations: {
        general: string;
        ibnSirin?: string;
        nabulsi?: string;
        psychological?: string;
        forMarried?: string;
        forSingle?: string;
        forMan?: string;
        forPregnant?: string;
    };
    relatedSymbols: string[];
};

export async function getSymbolData(slug: string): Promise<UnifiedSymbol | null> {
    try {
        const { data: dbSymbol } = await supabaseAdmin
            .from('symbols')
            .select('*')
            .eq('slug', slug)
            .single();

        if (dbSymbol) {
            return {
                id: dbSymbol.slug,
                name: dbSymbol.name,
                icon: dbSymbol.icon || '💭',
                category: dbSymbol.category,
                aliases: dbSymbol.aliases || [],
                interpretations: {
                    general: dbSymbol.interpretations?.general || '',
                    ibnSirin: dbSymbol.interpretations?.ibn_sirin || '',
                    nabulsi: dbSymbol.interpretations?.nabulsi || '',
                    psychological: dbSymbol.interpretations?.psychological || '',
                },
                relatedSymbols: dbSymbol.related_symbols || []
            };
        }
    } catch (e) {
        console.warn('[Supabase] Symbol fetch failed, falling back to static:', e);
    }

    // Static data fallback
    const staticData = staticSymbols.find(s => s.id === slug);
    if (!staticData) return null;

    return {
        id: staticData.id,
        name: staticData.name,
        icon: staticData.icon,
        category: staticData.category,
        aliases: staticData.relatedSymbols || [],
        interpretations: {
            general: staticData.interpretations.general,
            forMarried: staticData.interpretations.forMarried,
            forSingle: staticData.interpretations.forSingle,
            forMan: staticData.interpretations.forMan,
            forPregnant: staticData.interpretations.forPregnant,
            psychological: staticData.interpretations.psychological,
            ibnSirin: staticData.ibnSirin,
            nabulsi: staticData.nabulsi,
        },
        relatedSymbols: staticData.relatedSymbols || []
    };
}

export async function getAllSymbols(): Promise<UnifiedSymbol[]> {
    try {
        const { data: dbSymbols } = await supabaseAdmin
            .from('symbols')
            .select('*')
            .order('name');

        if (dbSymbols && dbSymbols.length > 0) {
            return dbSymbols.map((dbSymbol: any) => ({
                id: dbSymbol.slug,
                name: dbSymbol.name,
                icon: dbSymbol.icon || '💭',
                category: dbSymbol.category,
                aliases: dbSymbol.aliases || [],
                interpretations: {
                    general: dbSymbol.interpretations?.general || '',
                    ibnSirin: dbSymbol.interpretations?.ibn_sirin || '',
                    nabulsi: dbSymbol.interpretations?.nabulsi || '',
                    psychological: dbSymbol.interpretations?.psychological || '',
                },
                relatedSymbols: dbSymbol.related_symbols || []
            }));
        }
    } catch (e) {
        console.warn('[Supabase] Symbol list fetch failed, falling back to static:', e);
    }

    // Static data fallback
    return staticSymbols.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        category: s.category,
        aliases: s.relatedSymbols || [],
        interpretations: {
            general: s.interpretations.general,
            forMarried: s.interpretations.forMarried,
            forSingle: s.interpretations.forSingle,
            forMan: s.interpretations.forMan,
            forPregnant: s.interpretations.forPregnant,
            psychological: s.interpretations.psychological,
            ibnSirin: s.ibnSirin,
            nabulsi: s.nabulsi,
        },
        relatedSymbols: s.relatedSymbols || []
    }));
}
