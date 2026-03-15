import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { FilledInputBackground } from "@/components/FilledInputBackground";

const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-dm-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "KikanCloud | 外国人材・受入企業管理クラウド",
    description: "監理団体・登録支援機関向けの次世代クラウド管理システム",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ja" className={dmSans.variable}>
            <body suppressHydrationWarning>
                {children}
                <FilledInputBackground />
            </body>
        </html>
    );
}
