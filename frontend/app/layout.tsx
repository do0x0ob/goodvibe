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
          <Toaster position="bottom-right" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
