import OpenAI from "openai";
import { SOUL_PROMPT } from "@/lib/soul";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;

export async function POST(req: Request) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy_key",
  });

  try {
    const body = await req.json();
    const messages = body.messages || [];
    const walletAddress = body.walletAddress;

    const recentMessages = messages.slice(-10);

    const formattedInput = recentMessages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Used 4o-mini as the current equivalent to requested gpt-5-mini
      messages: [
        { role: "system", content: SOUL_PROMPT },
        { role: "user", content: formattedInput }
      ],
      temperature: 0.3,
    });

    const outputText = response.choices[0].message.content || "";

    // Save to database
    if (supabase) {
      try {
        const scoreMatch = outputText.match(/\[BIO-SCORE:\s*(\d+)%?\]/i);
        const bioScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
        const lastUserMsg = recentMessages[recentMessages.length - 1];

        await supabase.from('messages').insert([
          { role: 'user', content: lastUserMsg ? lastUserMsg.content : "", wallet_address: walletAddress || null },
          { role: 'assistant', content: outputText, wallet_address: walletAddress || null }
        ]);

        if (walletAddress && bioScore !== null) {
          await supabase.from('users').upsert({
            wallet_address: walletAddress,
            last_bio_score: bioScore,
            last_interaction: new Date().toISOString()
          }, { onConflict: 'wallet_address' });
        }
      } catch (dbError) {
        console.error("Failed to log to Supabase:", dbError);
      }
    }

    return Response.json({
      message: outputText,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return Response.json(
      { error: "Red Queen transmission failed" },
      { status: 500 }
    );
  }
}
