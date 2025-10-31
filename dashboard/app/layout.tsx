import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cert-framework Dashboard",
  description: "EU AI Act Article 15 Compliance Monitoring",
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
