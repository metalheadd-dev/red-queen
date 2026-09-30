import type { Metadata } from "next";
import "./gaming.css";

export const metadata: Metadata = {
  title: "Gaming Room | RED QUEEN",
  description: "The RED QUEEN survival gaming room: curated Steam games, RQ titles, and verified community competitions.",
};

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
