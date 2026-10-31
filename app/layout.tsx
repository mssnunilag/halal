import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halal Bites — UNILAG",
  description:
    "Where to eat halal around UNILAG, and an honest record of how we know each place is what it says.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
