import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from "next/script";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "المفسر | أكبر موقع عربي لتفسير الأحلام والرؤى",
  description: "تفسير أحلام فوري ومجاني بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي. قاموس رموز شامل وتفسير الرؤى بالقرآن، مع نخبة من المفسرين المعتمدين.",
  keywords: "تفسير الأحلام مجانا, تفسير الأحلام بالذكاء الاصطناعي, تفسير الاحلام لابن سيرين, تفسير حلم, قاموس تفسير الأحلام بالحروف, موقع تفسير الأحلام, تفسير الأحلام مجانا اكتب حلمك, تفسير الرؤى, النابلسي, تفسير الأحلام بالقران والسنة, تعبير الرؤيا",
  authors: [{ name: "المُفسِّر", url: "https://almofasir.com" }],
  creator: "المُفسِّر",
  publisher: "المُفسِّر",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "تفسير الأحلام مجاناً | المفسر - اكتب حلمك وفسره فوراً",
    description: "موقع المفسر لتفسير الأحلام مجاناً بالذكاء الاصطناعي وفق منهج ابن سيرين والنابلسي. قاموس الرموز، تفسير بالقرآن والسنة، ومفسرين حقيقيين.",
    locale: "ar_SA",
    type: "website",
    siteName: "المُفسِّر",
    url: "https://almofasir.com",
    images: [{ url: "https://almofasir.com/og-image.jpg", width: 1200, height: 630, alt: "المفسر - تفسير الأحلام" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "تفسير الأحلام مجاناً | المفسر",
    description: "اكتب حلمك واحصل على تفسير فوري بالذكاء الاصطناعي وفق ابن سيرين والنابلسي",
    creator: "@almofasir",
  },
  alternates: {
    canonical: "https://almofasir.com",
    languages: {
      'ar': 'https://almofasir.com',
    },
  },
  category: "تفسير الأحلام",
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { HomePageJsonLd } from "@/components/seo/JsonLdScript";
import StarBackground from "@/components/ui/StarBackground";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="flex flex-col items-center w-full min-h-screen overflow-x-hidden" suppressHydrationWarning>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""} />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6331163447795368"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <HomePageJsonLd />
        <StarBackground />
        <AuthProvider>
          <div className="w-full flex flex-col items-center">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

