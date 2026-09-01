import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import { Providers } from "./providers";
import TopNav from "@/components/layout/topnav";
import { isJwtValid } from "@/lib/jwt";
import { isLocale, localeFromHeader, type Locale } from "@/lib/i18n-shared";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

async function resolveLocale(): Promise<Locale> {
  const cookie = (await cookies()).get("tt-locale")?.value;
  if (isLocale(cookie)) return cookie;
  return localeFromHeader((await headers()).get("accept-language"));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = (await resolveLocale()) === "es" ? es : en;
  return {
    title: dict["meta.title"],
    description: dict["meta.description"],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authed = isJwtValid((await cookies()).get("tt-token")?.value);
  const locale = await resolveLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}>
        <Providers locale={locale}>
          <TopNav authed={authed} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
