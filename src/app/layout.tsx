import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "SENTINEL GESTION — Plateforme professionnelle de gestion de projets",
  description: "Organisez vos projets, planifiez les échéances et collaborez en toute fluidité avec Sentinel Gestion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SENTINEL GESTION",
  },
  icons: {
    icon: "/sentinel-icon.svg",
    apple: "/sentinel-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-slate-100 font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
