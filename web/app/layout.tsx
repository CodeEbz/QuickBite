import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickBite Admin",
  description: "QuickBite admin and merchant management portal",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
