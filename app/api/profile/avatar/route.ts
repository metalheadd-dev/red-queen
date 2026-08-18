import OpenAI, { toFile } from "openai";
import { readFile } from "fs/promises";
import path from "path";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { isHolderProofFresh } from "@/lib/holder-proof";
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
  if (!isHolderProofFresh(holder?.verified_balance, holder?.last_verification)) {
    return Response.json(
      {
        error: "Refresh your $THREAT balance before using Queen Visage. Holder proof expires after 30 minutes.",
        code: "HOLDER_REVERIFY_REQUIRED",
      },
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
    let editImages: Parameters<typeof client.images.edit>[0]["image"] = source;
    try {
      const houseStyle = await toFile(
        await readFile(path.join(process.cwd(), "public", "art", "red-queen-sigil.png")),
        "red-queen-house-style.png",
        { type: "image/png" },
      );
      editImages = [source, houseStyle];
    } catch (styleError) {
      console.warn("Queen Visage house-style reference unavailable; using the strict visual prompt.", styleError);
    }

    const result = await client.images.edit({
      model: "gpt-image-2",
      image: editImages,
      size: "1024x1024",
      quality: "medium",
      output_format: "webp",
      prompt: [
        "RQ VISAGE / V2. Input image 1 is the person's identity source. If input image 2 is present, it is the RED QUEEN house-style reference only. Transform image 1 into an original RED QUEEN SOLvivor profile avatar; never replace the person with the reference subject.",
        "Preserve the person's recognizable facial geometry, expression, hairstyle, age presentation, gender presentation, and identity. Do not beautify them into a different person.",
        "Composition: square 1:1 social avatar, perfectly centered head and upper shoulders, symmetrical frontal or source-faithful angle, generous black negative space, readable at small profile-icon size.",
        "Visual language: near-black silhouette, elegant precise white contour linework defining face and shoulders, sparse crimson neural-circuit traces across the temples and cheeks, luminous white eyes, deep black background, restrained red circular intelligence HUD behind the head, and a minimal geometric red crown or crown-halo motif that does not obscure the subject.",
        "Mood: serious, calm, intelligent, protective and post-apocalyptic; Resident-Evil-inspired survival command atmosphere without copying any copyrighted character, logo, costume, or exact artwork.",
        "The person is a capable survivor guided by RED QUEEN, not RED QUEEN herself.",
        "No text, no letters, no logos, no watermarks, no poster layout, no weapons, no gore, no zombie damage, no extra faces, no face covering, no decorative border touching the crop.",
      ].join(" "),
    });

    const encoded = result.data?.[0]?.b64_json;
    if (!encoded) throw new Error("Image generation returned no portrait.");

    return Response.json({
      avatarDataUrl: `data:image/webp;base64,${encoded}`,
      storage: "local-device",
      utility: "$THREAT_HOLDER",
      visualStyle: "RQ_VISAGE_V2",
      socialReady: true,
      aspectRatio: "1:1",
    });
  } catch (error) {
    console.error("Queen Visage generation failed:", error);
    return Response.json(
      { error: "RED QUEEN could not complete this portrait. Try a clear front-facing image." },
      { status: 502 },
    );
  }
}
