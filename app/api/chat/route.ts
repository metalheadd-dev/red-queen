import OpenAI from "openai";
import { SOUL_PROMPT } from "@/lib/soul";
import { supabase } from "@/lib/supabase";
import { getHashedWallet } from "@/lib/crypto";
import { getStatsFromScenarios, updateStatsInScenarios, getCleanScenarios, parseStatsFromAI, applyStatGains, calculateBioScore } from "@/lib/progression";
import { Connection, PublicKey } from "@solana/web3.js";

const THREAT_MINT = new PublicKey("3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump");

async function getThreatBalance(walletAddress: string): Promise<number> {
  try {
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const pubkey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      mint: THREAT_MINT,
    });
    if (tokenAccounts.value.length === 0) {
      return 0;
    }
    const balanceInfo = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
    return balanceInfo.uiAmount || 0;
  } catch (err) {
    console.error("Failed to query $THREAT balance in API:", err);
    return 0;
  }
}

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
    const stats = getStatsFromScenarios(userProfile?.chosen_scenarios);
    const cleanScenarios = getCleanScenarios(userProfile?.chosen_scenarios);
    const currentBioScore = userProfile ? calculateBioScore(stats) : 0;

    const profileString = userProfile ? `
- Hashed Identity: ${hashedWallet}
- Apocalyptic Codename: ${userProfile.apocalyptic_name || "UNKNOWN SUBJECT"}
- Chosen Threat Focus Areas: ${cleanScenarios.length > 0 ? cleanScenarios.join(", ") : "None selected yet"}
- Active Bio-Score: ${currentBioScore}% (Level ${stats.level}, XP ${stats.xp})
- Sub-Stats:
  * Threat Awareness: ${stats.threat_awareness}
  * Operational Discipline: ${stats.operational_discipline}
  * Psychological Stability: ${stats.psychological_stability}
  * Technical Preparedness: ${stats.technical_preparedness}
  * Adaptability: ${stats.adaptability}
  * Resourcefulness: ${stats.resourcefulness}
  * Surveillance Resistance: ${stats.surveillance_resistance}
- Last Interaction Log: ${userProfile.last_interaction || "First Uplink Established"}
` : `
- Hashed Identity: ${hashedWallet}
- Apocalyptic Codename: UNKNOWN SUBJECT
- Chosen Threat Focus Areas: None selected yet
- Active Bio-Score: PENDING EVALUATION (0%)
- Sub-Stats: All at 0
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
        const lastUserMsg = recentMessages[recentMessages.length - 1];

        await supabase.from("messages").insert([
          { role: "user", content: lastUserMsg ? lastUserMsg.content : "", wallet_address: hashedWallet || null },
          { role: "assistant", content: outputText, wallet_address: hashedWallet || null },
        ]);

         if (walletAddress) {
          const parsed = parseStatsFromAI(outputText);
          const currentStats = getStatsFromScenarios(userProfile?.chosen_scenarios);
          let updatedStats = currentStats;

          // Compute multipliers
          let tokenMultiplier = 1.0;
          const balance = await getThreatBalance(walletAddress);
          if (balance > 0) {
            tokenMultiplier = 2.0;
          }
          const level = currentStats.level || 1;
          const clearanceMultiplier = level >= 5 ? 2.0 : 
                                      level >= 4 ? 1.75 : 
                                      level >= 3 ? 1.5 : 
                                      level >= 2 ? 1.25 : 1.0;
          const totalMultiplier = tokenMultiplier * clearanceMultiplier;

          if (parsed) {
            const boostedXp = Math.round(parsed.xpGain * totalMultiplier);
            updatedStats = applyStatGains(currentStats, boostedXp, parsed.gains, userProfile?.last_interaction);
          } else {
            const scoreMatch = outputText.match(/\[BIO-SCORE:\s*(\d+)%?\]/i);
            const fallbackScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
            if (fallbackScore !== null) {
              const boostedXp = Math.round(5 * totalMultiplier);
              updatedStats = applyStatGains(currentStats, boostedXp, { threat_awareness: 1 }, userProfile?.last_interaction);
            }
          }

          const newBioScore = calculateBioScore(updatedStats);
          const updatedScenarios = updateStatsInScenarios(userProfile?.chosen_scenarios || [], updatedStats);

          await supabase.from("users").upsert(
            { 
              wallet_address: hashedWallet, 
              last_bio_score: newBioScore, 
              chosen_scenarios: updatedScenarios,
              last_interaction: new Date().toISOString() 
            },
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
