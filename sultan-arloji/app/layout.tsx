import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sultan Arloji — Jam Tangan Mewah & Berkelas",
  description: "Jelajahi katalog jam tangan Sultan Arloji dan pesan langsung melalui WhatsApp.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = { viewportFit: "cover", interactiveWidget: "resizes-content" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <a href="#konten" className="skip-link action action-secondary">Lewati ke konten</a>
        {children}
        <Toaster position="top-center" theme="light" />
      </body>
    </html>
  );
}
