import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost Trade — Master the Market",
  description: "AI-powered paper trading platform. Trade with ₹10L virtual cash, zero risk.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Ghost Trade",
    description: "Master the Market with AI-powered paper trading",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="bg-bg text-gt-text antialiased">{children}</body>
    </html>
  );
}
