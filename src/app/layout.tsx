import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "./globals.css";
import { AppProviders } from "./providers";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Golden City — Vòng quay tết thiếu nhi 1/6",
  description: "Golden City — Vòng quay tết thiếu nhi 1/6",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
  openGraph: {
    images: "/logo.png",
    title: "Golden City — Vòng quay tết thiếu nhi 1/6",
    description: "Golden City — Vòng quay tết thiếu nhi 1/6",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={fredoka.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
