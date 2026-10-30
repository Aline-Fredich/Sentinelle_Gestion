import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "SENTINEL GESTION — Plateforme professionnelle de gestion de projets",
  description: "Organisez vos projets, planifiez les échéances et collaborez en toute fluidité avec Sentinel Gestion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SENTINEL GESTION",
  },
  icons: {
    icon: "/sentinel-icon.png",
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
      data-theme="nuit"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem('sentinel_appearance');if(a==='sentinel_rouge'){document.documentElement.setAttribute('data-appearance','sentinel_rouge');}var t=localStorage.getItem('sentinel_theme');if(!t){var lm=localStorage.getItem('sentinel_theme_mode');var lv=localStorage.getItem('sentinel_theme_variant');if(lm==='light'||lv==='light'){t='blanc';}else if(lv==='red'){t='nuit';}else{t='nuit';}localStorage.setItem('sentinel_theme',t);}var r=t;if(t==='auto'){var d=window.matchMedia('(prefers-color-scheme: dark)').matches;r=d?'nuit':'blanc';}if(r!=='blanc'&&r!=='noir'&&r!=='bleu'&&r!=='nuit'){r='nuit';}document.documentElement.setAttribute('data-theme',r);document.documentElement.setAttribute('data-theme-preference',t);if(r==='blanc'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');document.documentElement.style.colorScheme='dark';}}catch(e){document.documentElement.setAttribute('data-theme','nuit');}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)] font-ui selection:bg-[var(--button-primary-bg)] selection:text-[var(--button-primary-text)] transition-colors duration-150">
        <ThemeProvider>
          {children}
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
