import type { Metadata } from "next";
import "./globals.css";
import { FetchSanitizer } from "./components/fetch-sanitizer";

export const metadata: Metadata = {
  title: "ContentAI – Génère ton contenu Instagram & TikTok",
  description: "Générateur de contenu IA pour petits business belges. Instagram + TikTok en FR, NL ou EN en quelques secondes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-black text-white">
        <FetchSanitizer />
        {children}
      </body>
    </html>
  );
}
