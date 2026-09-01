import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import TopNav from "@/components/layout/topnav";
import { isJwtValid } from "@/lib/jwt";

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

export const metadata: Metadata = {
  title: "TaleTrack — Every story finds its place",
  description:
    "Automatic book tracking via KOReader and film & series tracking via Netflix. Your personal library, beautifully organised.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authed = isJwtValid((await cookies()).get("tt-token")?.value);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}>
        <Providers>
          <TopNav authed={authed} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
