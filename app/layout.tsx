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
      <body className="min-h-screen bg-background text-[--color-text] font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
