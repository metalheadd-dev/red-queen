import type { Metadata } from "next";
import GamingQueen from "@/components/GamingQueen";

export const metadata: Metadata = { title: "Ask the Queen | RED QUEEN Gaming", description: "Choose a survival game, plan your first session and review your run with Red Queen." };

export default function GamingQueenPage() { return <GamingQueen />; }
