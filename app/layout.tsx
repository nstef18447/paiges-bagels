import type { Metadata } from "next";
import { Arapey } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const arapey = Arapey({
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-arapey",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paige's Bagels - Sourdough Bagels",
  description: "Fresh sourdough bagels made to order. Worth waking up for!",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Paige's Bagels",
    description: "Fresh sourdough bagels made to order. Worth waking up for!",
    url: "https://paigesbagels.com",
    siteName: "Paige's Bagels",
    images: [
      {
        url: "https://paigesbagels.com/logo.png",
        width: 822,
        height: 452,
        alt: "Paige's Bagels Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paige's Bagels",
    description: "Fresh sourdough bagels made to order. Worth waking up for!",
    images: ["https://paigesbagels.com/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${arapey.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
