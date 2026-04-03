import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alpax Agent Zero — Dashboard",
  description: "Agent Zero AI dashboard — Kanban, observability, memory",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 min-h-screen">{children}</body>
    </html>
  );
}
