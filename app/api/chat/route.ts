import OpenAI from "openai";
import { SOUL_PROMPT } from "@/lib/soul";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "[ERR_0x9B] OPENAI_API_KEY not configured. Add it to Vercel Environment Variables and redeploy." },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey });

  try {
    const body = await req.json();
    const messages = body.messages || [];
    const walletAddress = body.walletAddress;

    if (!walletAddress) {
      return Response.json(
        { error: "[ERR_0x1E] Unauthorized access. Connected Solana wallet required to initiate uplink." },
        { status: 401 }
      );
    }

    const recentMessages = messages.slice(-10);
    const formattedInput = recentMessages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SOUL_PROMPT },
        { role: "user", content: formattedInput },
      ],
      temperature: 0.3,
    });

    const outputText = response.choices[0].message.content || "";

    // Save to Supabase
    if (supabase) {
      try {
        const scoreMatch = outputText.match(/\[BIO-SCORE:\s*(\d+)%?\]/i);
        const bioScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
        const lastUserMsg = recentMessages[recentMessages.length - 1];

        await supabase.from("messages").insert([
          { role: "user", content: lastUserMsg ? lastUserMsg.content : "", wallet_address: walletAddress || null },
          { role: "assistant", content: outputText, wallet_address: walletAddress || null },
        ]);

        if (walletAddress && bioScore !== null) {
          await supabase.from("users").upsert(
            { wallet_address: walletAddress, last_bio_score: bioScore, last_interaction: new Date().toISOString() },
            { onConflict: "wallet_address" }
          );
        }
      } catch (dbError) {
        console.error("Supabase log error:", dbError);
      }
    }

    return Response.json({ message: outputText });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `[ERR_0x9B] Red Queen transmission failed: ${msg}` },
      { status: 500 }
    );
  }
}
