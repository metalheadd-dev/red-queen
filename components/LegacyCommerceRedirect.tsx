"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { commerceDestination } from "@/lib/rq-navigation";

export default function LegacyCommerceRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace(commerceDestination(window.location.search, window.location.hash)); }, [router]);
  return <p className="rq-redirect-note" role="status">Opening your RQ workspace…</p>;
}
