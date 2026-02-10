import type { Metadata } from "next";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";

export const metadata: Metadata = {
  title: "GoodVibe - Fund Projects, Earn Yield",
  description: "Deposit USDC into Stable Layer, earn yield, and automatically donate to projects you support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-canvas-default text-ink-900">
        <Providers>
          <Header />
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#1A1A1A',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                border: '1px solid #E5E5E5',
              },
              success: {
                iconTheme: {
                  primary: '#1A1A1A',
                  secondary: '#FFFFFF',
                },
                style: {
                  border: '1px solid #E5E5E5',
                }
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
                style: {
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                }
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
