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

import { NextAuthProvider } from "@/components/providers";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Inventory Master | Precision Tracking",
  description: "Next-generation inventory management for modern projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col md:flex-row bg-[#0f172a]`}
      >
        <NextAuthProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
