import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SolanaProvider from "@/components/SolanaProvider";

export const metadata: Metadata = {
  title: "SOLVIVAL CORP — RED QUEEN TERMINAL",
  description:
    "The RED QUEEN is online. Survival intelligence, threat assessment, and classified apocalypse briefings. Are you prepared?",
  keywords: ["apocalypse", "survival", "red queen", "solvival corp", "AI agent", "$THREAT token", "THREAT"],
  openGraph: {
    title: "SOLVIVAL CORP — RED QUEEN",
    description: "The AI that decides who survives. Talk to the RED QUEEN.",
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
            <Footer />
          </div>
        </SolanaProvider>
      </body>
    </html>
  );
}
