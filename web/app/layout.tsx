import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickBite | Modern Food Delivery Platform & Web Portal",
  description: "Full-stack food delivery ecosystem connecting customers, local restaurant merchants, dispatch riders, and administrators.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100">{children}</body>
    </html>
  );
}
