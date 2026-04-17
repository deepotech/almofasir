import React from 'react';
import Link from 'next/link';
import { dreamSymbols } from '@/data/symbols';

let dictionaryMemo: { pattern: RegExp; url: string }[] | null = null;
const MAX_LINKS = 3;

function getDictionary() {
    if (dictionaryMemo) return dictionaryMemo;
    
    // Flatten all keywords from all symbols
    const mappings: { keyword: string; url: string }[] = [];
    dreamSymbols.forEach(symbol => {
        const url = `/symbols/${symbol.id}`;
        mappings.push({ keyword: symbol.name, url });
        symbol.relatedSymbols?.forEach(alias => {
            mappings.push({ keyword: alias, url });
        });
    });
    
    // Sort by longest keyword first to prevent partial overlaps
    mappings.sort((a, b) => b.keyword.length - a.keyword.length);
    
    // Build regex patterns
    // Matches the keyword, optionally prefixed by Arabic conjunctions/articles (و, ف, ك, ب, ال)
    dictionaryMemo = mappings.map(m => ({
        pattern: new RegExp(`(?:^|\\s)([وفكب]?(?:ال)?${m.keyword})(?=\\s|[.،!؟]|$)`, 'g'),
        url: m.url
    }));
    
    return dictionaryMemo;
}

// ── Smart semantic renderer (Bold + SEO Links) ──
export function renderTextWithBoldAndLinks(text: string): (string | React.ReactElement)[] {
    if (!text) return [text];
    
    const dictionary = getDictionary();
    let linkCount = 0;
    
    // 1. Split by bold first to preserve formatting
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.flatMap((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            const innerText = part.slice(2, -2);
            return (
                <strong key={`bold-${i}`} className="text-[var(--color-primary-light)] font-semibold">
                    {innerText}
                </strong>
            );
        }
        
        if (linkCount >= MAX_LINKS) return part;
        
        let processedPart: (string | React.ReactElement)[] = [part];
        
        for (const entry of dictionary) {
            if (linkCount >= MAX_LINKS) break;
            
            const newProcessedPart: (string | React.ReactElement)[] = [];
            for (let k = 0; k < processedPart.length; k++) {
                const chunk = processedPart[k];
                // Don't split already-formed React elements
                if (typeof chunk !== 'string') {
                    newProcessedPart.push(chunk);
                    continue;
                }
                
                // We split by the exact regex, which captures the matched string exactly
                const splitChunk = chunk.split(entry.pattern);
                
                for (let j = 0; j < splitChunk.length; j++) {
                    const subChunk = splitChunk[j];
                    if (!subChunk) continue;
                    
                    // If the subChunk perfectly matches our regex criteria, it was extracted by a capturing group
                    // By checking entry.pattern.test(subChunk) we might get false positives, so we check if it's the exact extracted match
                    // But split using a capturing group isolates the exact matched substring.
                    // A simple check: if the subChunk contains the keyword exactly (or prefixed), we link it.
                    // Because we generated the regex dynamically, the capturing group `([وفكب]?(?:ال)?${m.keyword})` is at index 1.
                    // Split results interleave non-matches and matches: [nonMatch, match, nonMatch, match...].
                    // So odd indices (j % 2 === 1) are our matches!
                    
                    if (j % 2 === 1 && linkCount < MAX_LINKS) {
                        // This is the captured term!
                        linkCount++;
                        newProcessedPart.push(
                            <Link key={`link-${entry.url}-${i}-${k}-${j}`} href={entry.url} className="text-[var(--color-secondary)] hover:underline opacity-90 transition-opacity border-b border-[var(--color-secondary)]/30">
                                {subChunk}
                            </Link>
                        );
                    } else {
                        newProcessedPart.push(subChunk);
                    }
                }
            }
            processedPart = newProcessedPart;
        }
        
        return processedPart;
    });
}
