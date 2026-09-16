import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vortex Wallet",
  description: "Secure Digital Wallet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
