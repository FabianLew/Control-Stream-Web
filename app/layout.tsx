import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ControlStream.io",
  description: "Enterprise Event Streaming Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            {/* Sidebar - fixed, never scrolls */}
            <Sidebar />

            {/* Main shell */}
            <div
              className="pl-[280px] min-h-screen flex flex-col"
              style={{
                ["--sidebar-width" as any]: "280px",
                ["--topnav-height" as any]: "64px",
              }}
            >
              {/* <TopNav /> */}

              {/* scroll container */}
              <main id="app-scroll" className="flex-1 overflow-auto relative">
                {children}
              </main>
            </div>
          </div>

          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
