import type { Metadata } from "next";
import Link from "next/link";
import RqPageIntro from "@/components/RqPageIntro";
import SurvivalMarketClient from "@/components/SurvivalMarketClient";
import RetailerCheckout from "@/components/RetailerCheckout";

export const metadata: Metadata = {
  title: "Survival loadout | RQ",
  description: "Build a threat-specific loadout with Red Queen. Review products and shop through SP3ND.",
};

export default function ShopPage() {
  return <div className="rq-experience rq-product-page rq-shop-page">
    <div className="rq-shell onchain-main">
      <RqPageIntro eyebrow="LOADOUT // QUARTERMASTER" title="Equip for the threat."
        description="Tell Red Queen what you’re preparing for and who’s coming with you. She builds a threat-specific loadout. You review every item before checkout."
        action={{ href: "/red-queen?mode=PREPARE&prompt=Help%20me%20build%20a%20survival%20kit.%20Ask%20about%20the%20threat%20and%20my%20household%20first.", label: "Build with Red Queen" }} />
      <ol className="rq-shopping-steps">
        <li><b>01</b><span>Describe your needs</span></li>
        <li><b>02</b><span>Review the loadout</span></li>
        <li><b>03</b><span>Approve products & checkout</span></li>
      </ol>
      <SurvivalMarketClient />
      <RetailerCheckout />
      <div className="rq-product-footnote">
        <p>Retailer search results are not guaranteed stock or price. The checkout provider confirms your order details.</p>
        <Link href="/reports">Looking for an intelligence report? ↗</Link>
      </div>
    </div>
  </div>;
}
