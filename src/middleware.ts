import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge Middleware — Minimal
 * 
 * Strategy A: No slug redirects needed.
 * Old slugs stay as-is, new slugs use strict Arabic rules.
 * Only trailing slash normalization is performed.
 */

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ─── Trailing Slash Normalization ──────────────────────────
    // Remove trailing slash (except root "/") to prevent duplicate URLs
    if (pathname !== '/' && pathname.endsWith('/')) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.slice(0, -1);
        return NextResponse.redirect(url, 301);
    }

    return NextResponse.next();
}

// ─── Matcher: Only run on page routes ────────────────────────────
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|ads\\.txt|.*\\..*).*)',
    ],
};
