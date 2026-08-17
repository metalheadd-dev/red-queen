import OpenAI, { toFile } from "openai";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const identity = await getAuthIdentifier(request);
  if (!identity) {
    return Response.json({ error: "Verified SOLvivor session required." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Queen Visage generation is not configured yet." }, { status: 503 });
  }

  if (!supabase) {
    return Response.json({ error: "$THREAT holder verification is unavailable." }, { status: 503 });
  }

  const { data: holder, error: holderError } = await supabase
    .from("users")
    .select("verified_balance, last_verification")
    .eq("wallet_address", getHashedWallet(identity))
    .single();
  if (holderError && holderError.code !== "PGRST116") {
    return Response.json({ error: "$THREAT holder verification failed." }, { status: 503 });
  }
  if (Number(holder?.verified_balance || 0) <= 0) {
    return Response.json(
      { error: "Queen Visage is reserved for verified $THREAT holders.", code: "HOLDER_REQUIRED" },
      { status: 403 },
    );
  }

  const form = await request.formData();
  const photo = form.get("photo");
  if (!(photo instanceof File)) {
    return Response.json({ error: "Choose a portrait image first." }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.has(photo.type)) {
    return Response.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 400 });
  }
  if (photo.size <= 0 || photo.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Image must be smaller than 6 MB." }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const source = await toFile(Buffer.from(await photo.arrayBuffer()), photo.name || "solvivor-portrait", {
      type: photo.type,
    });

    const result = await client.images.edit({
      model: "gpt-image-2",
      image: source,
      size: "1024x1024",
      quality: "medium",
      output_format: "webp",
      prompt: [
        "Transform the uploaded portrait into an original RED QUEEN SOLvivor identity portrait.",
        "Preserve the person's recognizable facial structure, expression, skin tone, hair, and identity.",
        "Visual language: black void background, precise red and white neon linework, subtle apocalyptic survival-intelligence HUD geometry, restrained crown-like tactical halo, cinematic contrast, clean centered shoulders-up composition.",
        "The person is a capable survivor guided by RED QUEEN, not RED QUEEN herself.",
        "No text, no logos, no watermarks, no weapons, no gore, no extra faces, no face covering.",
      ].join(" "),
    });

    const encoded = result.data?.[0]?.b64_json;
    if (!encoded) throw new Error("Image generation returned no portrait.");

    return Response.json({
      avatarDataUrl: `data:image/webp;base64,${encoded}`,
      storage: "local-device",
      utility: "$THREAT_HOLDER",
    });
  } catch (error) {
    console.error("Queen Visage generation failed:", error);
    return Response.json(
      { error: "RED QUEEN could not complete this portrait. Try a clear front-facing image." },
      { status: 502 },
    );
  }
}
