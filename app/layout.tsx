import type { Metadata } from "next";
import { Pacifico, Lekton } from "next/font/google";
import "./globals.css";

const pacifico = Pacifico({
  weight: "400",
  variable: "--font-pacifico",
  subsets: ["latin"],
});

const lekton = Lekton({
  weight: ["400", "700"],
  variable: "--font-lekton",
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
        className={`${pacifico.variable} ${lekton.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
