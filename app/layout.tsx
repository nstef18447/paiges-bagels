import type { Metadata } from "next";
import { Arapey } from "next/font/google";
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
      </body>
    </html>
  );
}
