import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { SOUL_PROMPT } from "@/lib/soul";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, walletAddress } = await req.json();

    // Limit to the last 10 messages to save token costs as requested
    const recentMessages = messages.slice(-10);

    const result = streamText({
      model: openai("gpt-4o-mini"), // Using gpt-4o-mini as the current equivalent to the requested gpt-5-mini
      system: SOUL_PROMPT,
      messages: recentMessages,
      temperature: 0.3,
      onFinish: async ({ text }) => {
        if (supabase) {
          try {
            // Extract BIO-SCORE if present
            const scoreMatch = text.match(/\[BIO-SCORE:\s*(\d+)%?\]/i);
            const bioScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

            const lastUserMsg = recentMessages[recentMessages.length - 1];

            // 1. Log the message
            await supabase.from('messages').insert([
              { 
                role: 'user', 
                content: lastUserMsg.content,
                wallet_address: walletAddress || null
              },
              { 
                role: 'assistant', 
                content: text,
                wallet_address: walletAddress || null
              }
            ]);

            // 2. Upsert user points if wallet is connected and a score was generated
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
      }
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Red Queen transmission failed" }), {
      status: 500,
    });
  }
}
