import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hangover Bagels - Paige's Bagels",
  description: "Need bagels NOW? Fresh sourdough ready in 1 hour. Order now, thank us later.",
  openGraph: {
    title: "Hangover Bagels - Paige's Bagels",
    description: "Fresh sourdough ready in 1 hour. Order now, thank us later.",
    url: "https://paigesbagels.com/hangover",
    siteName: "Paige's Bagels",
    images: [{ url: "https://paigesbagels.com/logo.png", width: 822, height: 452 }],
    type: "website",
  },
};

export default function HangoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
