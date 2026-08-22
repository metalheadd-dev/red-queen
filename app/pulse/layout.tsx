import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Pulse | RED QUEEN",
  description: "Review RED QUEEN's verified Daily Pulse, choose a broad area, inspect live signals and receive one clear next action.",
};

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
