import type { Metadata } from "next";
import "./globals.css";
import "./rq-experience.css";
import "./rq-boot.css";
import RqWelcome from "@/components/RqWelcome";
import RqBootGate from "@/components/RqBootGate";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SolanaProvider from "@/components/SolanaProvider";
import QueenDock from "@/components/QueenDock";
import MobileExperienceProvider from "@/components/MobileExperienceProvider";

const themeBootstrapScript = `
  try {
    var savedTheme = localStorage.getItem("rq-theme-v1");
    var theme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = "dark";
  }
  try {
    document.documentElement.dataset.rqBoot = sessionStorage.getItem("rq-boot-seen-v1") === "1" ? "seen" : "show";
  } catch (_) {
    document.documentElement.dataset.rqBoot = "show";
  }
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://redqueen.space"),
  title: "RQ | Your next move, with Red Queen",
  description:
    "RQ is a survival ecosystem on Solana. Ask Red Queen, understand threats, build plans, buy x402 intelligence and find real-world gear.",
  keywords: ["survival intelligence", "threat monitoring", "red queen", "Solana", "AI agent", "$THREAT token", "preparedness"],
  openGraph: {
    title: "RQ | Your next move, with Red Queen",
    description: "The survival ecosystem on Solana. Red Queen turns signals into decisions, x402 intelligence, preparedness and real-world action.",
    type: "website",
    siteName: "RQ",
    images: [
      {
        url: "/red-queen-social-card.png",
        width: 1200,
        height: 600,
        alt: "RED QUEEN, the survival intelligence system of SOLVIVAL CORP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RQ | Your next move, with Red Queen",
    description: "The survival ecosystem on Solana. Signals, decisions, x402 intelligence and real-world action with Red Queen.",
    images: ["/red-queen-social-card.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" data-theme="dark" suppressHydrationWarning>
      <head>
        <script id="rq-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <RqBootGate />
        <SolanaProvider>
          <div className="page-bg">
            <MobileExperienceProvider />
            <NavBar />
            <main className="page-content" id="rq-main" tabIndex={-1}>{children}</main>
            <RqWelcome />
            <QueenDock />
            <Footer />
          </div>
        </SolanaProvider>
      </body>
    </html>
  );
}
