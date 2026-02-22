import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FilledInputBackground } from "@/components/FilledInputBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KikanCloud | 外国人材・受入企業管理クラウド",
  description: "監理団体・登録支援機関向けの次世代クラウド管理システム",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <FilledInputBackground />
      </body>
    </html>
  );
}
