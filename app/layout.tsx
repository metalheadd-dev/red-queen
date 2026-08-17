import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SolanaProvider from "@/components/SolanaProvider";
import QueenDock from "@/components/QueenDock";

export const metadata: Metadata = {
  title: "RED QUEEN — Survival Intelligence on Solana",
  description:
    "Verified threat signals, practical preparedness, and a context-aware AI survival agent powered by the Solana ecosystem.",
  keywords: ["survival intelligence", "threat monitoring", "red queen", "Solana", "AI agent", "$THREAT token", "preparedness"],
  openGraph: {
    title: "RED QUEEN — Survival Intelligence on Solana",
    description: "Know what matters. Prepare before it does.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>
          <div className="page-bg">
            <NavBar />
            <main className="page-content">{children}</main>
            <QueenDock />
            <Footer />
          </div>
        </SolanaProvider>
      </body>
    </html>
  );
}
