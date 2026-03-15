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
    title: {
        default: "KikanCloud | 外国人材・受入企業管理クラウド",
        template: "%s | KikanCloud",
    },
    description: "監理団体・登録支援機関向けの次世代クラウド管理システム。外国人材・受入企業・業務・監査をワンストップで管理。",
    openGraph: {
        title: "KikanCloud | 外国人材・受入企業管理クラウド",
        description: "監理団体・登録支援機関向けの次世代クラウド管理システム",
        locale: "ja_JP",
        type: "website",
    },
    robots: { index: false, follow: false }, // 社内システムのためインデックス不要
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
