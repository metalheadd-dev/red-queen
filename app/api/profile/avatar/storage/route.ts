import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "solvivor-avatars";
const AVATAR_NAME = "avatar.webp";
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

type AvatarKind = "CUSTOM" | "QUEEN_VISAGE";

async function getAvatarOwner(request: Request) {
  if (!supabase) return { error: Response.json({ error: "Avatar storage is not configured." }, { status: 503 }) } as const;
  const identity = await getAuthIdentifier(request);
  if (!identity) return { error: Response.json({ error: "Verified SOLvivor session required." }, { status: 401 }) } as const;
  const anonymousId = getHashedWallet(identity);
  if (!anonymousId) return { error: Response.json({ error: "Profile identity could not be resolved." }, { status: 401 }) } as const;
  return { anonymousId } as const;
}

function avatarPath(anonymousId: string) {
  return `${anonymousId}/${AVATAR_NAME}`;
}

export async function GET(request: Request) {
  const owner = await getAvatarOwner(request);
  if ("error" in owner) return owner.error;

  const folder = owner.anonymousId;
  const { data: files, error: listError } = await supabase!.storage.from(BUCKET).list(folder, { limit: 10 });
  if (listError) return Response.json({ error: "Private avatar storage is temporarily unavailable." }, { status: 503 });
  const file = files.find((entry) => entry.name === AVATAR_NAME);
  if (!file) return Response.json({ exists: false }, { headers: { "Cache-Control": "private, no-store" } });

  const { data: signed, error: signedError } = await supabase!.storage.from(BUCKET).createSignedUrl(avatarPath(folder), 10 * 60);
  if (signedError || !signed?.signedUrl) return Response.json({ error: "Private avatar could not be opened." }, { status: 503 });

  const metadata = file.metadata as Record<string, unknown> | null;
  const kind = metadata?.kind === "QUEEN_VISAGE" ? "QUEEN_VISAGE" : "CUSTOM";
  return Response.json({
    exists: true,
    avatarUrl: signed.signedUrl,
    kind,
    storage: "private-cloud",
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const owner = await getAvatarOwner(request);
  if ("error" in owner) return owner.error;

  const form = await request.formData();
  const avatar = form.get("avatar");
  const kind = form.get("kind");
  if (!(avatar instanceof File) || avatar.type !== "image/webp" || avatar.size <= 0 || avatar.size > MAX_AVATAR_BYTES) {
    return Response.json({ error: "Upload one processed WebP avatar smaller than 4 MB." }, { status: 400 });
  }
  if (kind !== "CUSTOM" && kind !== "QUEEN_VISAGE") {
    return Response.json({ error: "Avatar kind is invalid." }, { status: 400 });
  }

  const { error: uploadError } = await supabase!.storage.from(BUCKET).upload(
    avatarPath(owner.anonymousId),
    Buffer.from(await avatar.arrayBuffer()),
    {
      upsert: true,
      contentType: "image/webp",
      cacheControl: "3600",
      metadata: { kind: kind satisfies AvatarKind },
    },
  );
  if (uploadError) return Response.json({ error: "Private avatar could not be saved." }, { status: 503 });

  return Response.json({ success: true, storage: "private-cloud", kind });
}

export async function DELETE(request: Request) {
  const owner = await getAvatarOwner(request);
  if ("error" in owner) return owner.error;

  const { error } = await supabase!.storage.from(BUCKET).remove([avatarPath(owner.anonymousId)]);
  if (error) return Response.json({ error: "Private avatar could not be deleted." }, { status: 503 });
  return Response.json({ success: true, storage: "deleted" });
}
