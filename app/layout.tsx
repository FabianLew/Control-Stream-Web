import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Providers } from "./providers"; // Zaraz stworzymy

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ControlStream.io",
  description: "Enterprise Event Streaming Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen">
            {/* Lewy panel */}
            <Sidebar />
            
            {/* Główny obszar */}
            <div className="flex-1 ml-[280px] flex flex-col">
              <TopNav />
              <main className="flex-1 p-8 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}