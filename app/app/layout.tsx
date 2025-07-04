import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Concert Reservation Platform",
  description: "Concert Reservation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <SidebarProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
