import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "OpenPerso | AI 캐릭터와 대화하세요",
  description: "누구나 AI 캐릭터를 만들고, 대화하고, 공유하는 오픈 플랫폼",
  manifest: "/manifest.json",
  themeColor: "#1a1a2e",
  openGraph: {
    title: "OpenPerso | AI 캐릭터와 대화하세요",
    description: "누구나 AI 캐릭터를 만들고, 대화하고, 공유하는 오픈 플랫폼",
    siteName: "OpenPerso",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPerso | AI 캐릭터와 대화하세요",
    description: "누구나 AI 캐릭터를 만들고, 대화하고, 공유하는 오픈 플랫폼",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OpenPerso",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${dmSans.variable} ${sora.variable} font-sans antialiased`}
      >
        <div className="grain-overlay" />
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </body>
    </html>
  );
}
