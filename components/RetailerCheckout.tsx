"use client";
import { useEffect, useRef } from "react";
import Sp3ndCheckoutClient from "@/components/Sp3ndCheckoutClient";

export default function RetailerCheckout() {
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    let frame = 0;
    function revealCheckout() {
      const params = new URLSearchParams(window.location.search);
      if (window.location.hash !== "#sp3nd-checkout" && ![...params.keys()].some(key => key.startsWith("sp3nd"))) return;
      if (disclosure.current) disclosure.current.open = true;
      frame = requestAnimationFrame(() => disclosure.current?.scrollIntoView({ block: "start" }));
    }
    revealCheckout();
    window.addEventListener("hashchange", revealCheckout);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", revealCheckout); };
  }, []);
  return <details ref={disclosure} className="rq-checkout-disclosure">
    <summary><span><small>ALREADY HAVE PRODUCT LINKS?</small><strong>Review an Amazon or eBay purchase</strong></span><b>+</b></summary>
    <p className="rq-checkout-explainer">Paste exact product links below. Connect to SP3ND, review the quoted total and delivery details, then approve checkout with USDC on Solana.</p>
    <Sp3ndCheckoutClient />
  </details>;
}
