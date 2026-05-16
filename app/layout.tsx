import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "InnovatEPAM Portal",
  description: "EPAM Innovation Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] font-sans antialiased selection:bg-[var(--color-primary)] selection:text-white">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
