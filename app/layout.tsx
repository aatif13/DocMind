import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import ShaderBackground from "@/components/ui/asd";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocMind | Drop a PDF. Ask anything.",
  description: "Understand any document instantly. Powered by Groq LLaMA 3.3.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={dmSans.className} style={{ margin: 0, background: 'black' }}>
        <ShaderBackground />
        <div className="relative z-10 min-h-[100dvh]">
          {children}
        </div>
      </body>
    </html>
  );
}
