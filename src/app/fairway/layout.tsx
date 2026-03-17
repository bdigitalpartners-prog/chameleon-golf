import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Fairway — Golf Architecture Articles, Videos & Books | golfEQUALIZER",
  description:
    "Curated collection of golf course architecture articles, videos, podcasts, and books — all cross-linked to architects and courses in the golfEQUALIZER database.",
  openGraph: {
    title: "The Fairway — Golf Architecture Content Hub",
    description:
      "Articles, videos, podcasts, and books about golf course architecture.",
  },
};

export default function FairwayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
