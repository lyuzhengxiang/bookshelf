import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, username, first_name, last_name, image_url } = evt.data;

    const displayName =
      [first_name, last_name].filter(Boolean).join(" ") || "User";
    const finalUsername = username || `user_${id.slice(-8)}`;

    const supabase = createClient();
    const { error } = await supabase.from("users").insert({
      clerk_id: id,
      username: finalUsername,
      display_name: displayName,
      avatar_url: image_url || "",
    });

    if (error) {
      console.error("Failed to create user:", error);
      return new Response("Failed to create user", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
