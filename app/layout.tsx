import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat, Montserrat_Alternates } from "next/font/google";
import localFont from "next/font/local";

import Toaster from "@/src/components/ui/Toaster";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const montserratAlternates = Montserrat_Alternates({
  variable: "--font-montserrat-alt",
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
});

// DSEG7-Classic (OFL) — open-source 7-segment LED font used by the countdown
// digit tiles (Figma "Digital Numbers" stand-in). Self-hosted under
// `public/fonts/dseg7/` so we never depend on a CDN at request time.
const dseg7 = localFont({
  variable: "--font-dseg7",
  src: "../public/fonts/dseg7/DSEG7Classic-Regular.woff2",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sun Annual Awards 2025",
  description: "Bắt đầu hành trình của bạn cùng SAA 2025.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${montserratAlternates.variable} ${dseg7.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
