import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bagel Fest — Paige's Bagels",
  description:
    "You just tried Chicago's best sourdough bagels. Now order them fresh — every week.",
};

export default function BagelfestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
