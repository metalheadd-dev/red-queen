import type { Metadata } from "next";
import "./globals.css";
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
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://redqueen.space"),
  title: "RED QUEEN | Survival Intelligence on Solana",
  description:
    "RED QUEEN is an AI survival intelligence system that turns verified threat signals into clear assessments, practical actions, and readiness training on Solana.",
  keywords: ["survival intelligence", "threat monitoring", "red queen", "Solana", "AI agent", "$THREAT token", "preparedness"],
  openGraph: {
    title: "RED QUEEN | Survival Intelligence on Solana",
    description: "Meet RED QUEEN, the AI survival intelligence system that watches the field, removes the noise, and gives you one clear move.",
    type: "website",
    siteName: "RED QUEEN | SOLVIVAL CORP",
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
    title: "RED QUEEN | Survival Intelligence on Solana",
    description: "The AI survival intelligence system that watches the field, removes the noise, and gives you one clear move.",
    images: ["/red-queen-social-card.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <SolanaProvider>
          <div className="page-bg">
            <MobileExperienceProvider />
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
