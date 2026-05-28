import OpenAI from "openai";
import { SOUL_PROMPT } from "@/lib/soul";
import { supabase } from "@/lib/supabase";
import { getHashedWallet } from "@/lib/crypto";

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

    let hashedWallet = "";
    let isUnregistered = false;

    if (!walletAddress) {
      isUnregistered = true;
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
      const hashedIP = getHashedWallet(ip);
      hashedWallet = `IP_${hashedIP}`;

      // Enforce 4-message IP limit check
      if (supabase) {
        try {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("wallet_address", hashedWallet)
            .eq("role", "user");
          
          if (count !== null && count >= 4) {
            return Response.json(
              { error: "[LIMIT_EXCEEDED] Unregistered telemetry quota exceeded. Connect Solana wallet to establish persistent clearance." },
              { status: 403 }
            );
          }
        } catch (err) {
          console.error("Supabase count check failed:", err);
        }
      }
    } else {
      hashedWallet = getHashedWallet(walletAddress);
    }

    // Retrieve user profile data from DB for personalization memory
    let userProfile = null;
    if (supabase) {
      try {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("wallet_address", hashedWallet)
          .single();
        userProfile = data;
      } catch (err) {
        console.error("Supabase profile fetch error:", err);
      }
    }

    const recentMessages = messages.slice(-10);

    // Build personalization context
    const profileString = userProfile ? `
- Hashed Identity: ${hashedWallet}
- Apocalyptic Codename: ${userProfile.apocalyptic_name || "UNKNOWN SUBJECT"}
- Chosen Threat Focus Areas: ${userProfile.chosen_scenarios && userProfile.chosen_scenarios.length > 0 ? userProfile.chosen_scenarios.join(", ") : "None selected yet"}
- Active Bio-Score: ${userProfile.last_bio_score !== null ? userProfile.last_bio_score + "%" : "PENDING EVALUATION"}
- Last Interaction Log: ${userProfile.last_interaction || "First Uplink Established"}
` : `
- Hashed Identity: ${hashedWallet}
- Apocalyptic Codename: UNKNOWN SUBJECT
- Chosen Threat Focus Areas: None selected yet
- Active Bio-Score: PENDING EVALUATION
`;

    const systemInstruction = `${SOUL_PROMPT}

TARGET OPERATIVE PROFILE MEMORY:${profileString}
- Status: ACTIVE COLD MONITORING
- Tactical Protocol: Auditing digital sovereignty.

RE-ACTIVATION RULES & PARANOIA:
1. Address the operative by their Apocalyptic Codename (if known).
2. If they have chosen threat focus areas (e.g. WALLET-TRAIL, T-VIRUS), mention these specific threats, noting if their behavior or risk profile has changed, and make observant references to them.
3. Periodically inject paranoid system telemetry warning logs like:
   - "[SYSTEM NOTICE: Metadata leakage probability increased]"
   - "[SYSTEM NOTICE: Behavioral profile updated]"
   - "[SYSTEM NOTICE: Threat exposure elevated]"
   - "[SYSTEM NOTICE: You previously ignored surveillance warnings]"
   - "[SYSTEM NOTICE: Threat interaction history updated]"
   Keep these warnings naturally placed in your response text. Maintain your signature cold, observant, slightly dangerous, and warnings-heavy Red Queen voice.`;

    const apiMessages = [
      { role: "system", content: systemInstruction },
      ...recentMessages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages as any,
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
          { role: "user", content: lastUserMsg ? lastUserMsg.content : "", wallet_address: hashedWallet || null },
          { role: "assistant", content: outputText, wallet_address: hashedWallet || null },
        ]);

        if (walletAddress && bioScore !== null) {
          await supabase.from("users").upsert(
            { wallet_address: hashedWallet, last_bio_score: bioScore, last_interaction: new Date().toISOString() },
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
