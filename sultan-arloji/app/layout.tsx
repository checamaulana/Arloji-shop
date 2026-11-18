import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sultan Arloji — Jam Tangan Mewah & Berkelas",
  description: "Katalog Jam Tangan Mewah Terlengkap & Terpercaya. Pesan Cepat Langsung ke WhatsApp.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-950 text-neutral-100 antialiased font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <div className="min-h-screen bg-neutral-950 flex justify-center">
          <main className="w-full max-w-md min-h-screen bg-[#0B0B0B] border-x border-neutral-800/80 shadow-2xl relative flex flex-col">
            {children}
          </main>
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
