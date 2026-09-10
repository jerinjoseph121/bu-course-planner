import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { AssistantWidget } from "@/components/AssistantWidget";

export const metadata: Metadata = {
  title: "BU Course Planner",
  description: "Browse BU courses and build your class schedule.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <NavBar />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <AssistantWidget />
      </body>
    </html>
  );
}
