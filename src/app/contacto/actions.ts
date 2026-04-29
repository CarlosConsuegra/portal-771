"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ContactFormState = {
  ok: boolean;
  message: string;
};

const SUCCESS_MESSAGE = "Mensaje enviado.";
const ERROR_MESSAGE = "No pudimos enviar el mensaje. Intenta de nuevo más tarde.";
const DEFAULT_CONTACT_FROM = "Portal 771 <no-reply@consuegra.tech>";
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT_MAX_ATTEMPTS = 3;
const SPAM_PHRASE_PATTERNS = [
  /googlesearchindex/i,
  /searchregister/i,
  /index your site/i,
  /appear in web search results/i,
  /\bseo\b/i,
  /domain listing/i,
];
const DIRECT_URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;
const BARE_DOMAIN_PATTERN =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:\/[^\s]*)?\b/gi;

const initialError: ContactFormState = {
  ok: false,
  message: ERROR_MESSAGE,
};

function getRequiredField(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Falta ${name}.`);
  }

  return value.trim();
}

function getOptionalField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getSuccessState(): ContactFormState {
  return {
    ok: true,
    message: SUCCESS_MESSAGE,
  };
}

function hasSpamPhrase(message: string) {
  return SPAM_PHRASE_PATTERNS.some((pattern) => pattern.test(message));
}

function countUrlLikeMatches(message: string) {
  const normalizedMessage = message
    .normalize("NFKC")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, " ");
  const matches = new Set<string>();

  for (const pattern of [DIRECT_URL_PATTERN, BARE_DOMAIN_PATTERN]) {
    pattern.lastIndex = 0;

    for (const match of normalizedMessage.matchAll(pattern)) {
      const value = match[0]?.trim().toLowerCase();

      if (value) {
        matches.add(value);
      }
    }
  }

  return matches.size;
}

function shouldDiscardAsSpam(message: string) {
  const spamPhraseMatch = hasSpamPhrase(message);
  const urlLikeMatchCount = countUrlLikeMatches(message);

  if (spamPhraseMatch) {
    return true;
  }

  return urlLikeMatchCount >= 2;
}

async function getRequestIp() {
  const headerStore = await headers();
  const forwardedFor =
    headerStore.get("x-forwarded-for") ??
    headerStore.get("x-real-ip") ??
    headerStore.get("cf-connecting-ip") ??
    headerStore.get("x-vercel-forwarded-for");

  if (!forwardedFor) {
    return null;
  }

  return forwardedFor.split(",")[0]?.trim() || null;
}

async function isRateLimited() {
  const requestIp = await getRequestIp();

  if (!requestIp) {
    return false;
  }

  const supabase = await createClient();
  const ipHash = createHash("sha256").update(requestIp).digest("hex");
  const { data, error } = await supabase.rpc("check_contact_rate_limit", {
    p_identifier_hash: ipHash,
    p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    p_max_attempts: RATE_LIMIT_MAX_ATTEMPTS,
  });

  if (error) {
    throw error;
  }

  return data === false;
}

export async function submitContactMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  try {
    if (!isSupabaseConfigured()) {
      return initialError;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationTo = process.env.CONTACT_NOTIFICATION_TO;
    const contactFrom = process.env.CONTACT_FROM?.trim() || DEFAULT_CONTACT_FROM;

    if (!resendApiKey || !notificationTo) {
      return initialError;
    }

    if (getOptionalField(formData, "website")) {
      return getSuccessState();
    }

    const nombre = getRequiredField(formData, "nombre");
    const correo = getRequiredField(formData, "correo");
    const mensaje = getRequiredField(formData, "mensaje");

    if (shouldDiscardAsSpam(mensaje)) {
      return getSuccessState();
    }

    if (await isRateLimited()) {
      return initialError;
    }

    const createdAt = new Date();

    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: nombre,
      email: correo,
      message: mensaje,
      created_at: createdAt.toISOString(),
    });

    if (error) {
      return initialError;
    }

    const resend = new Resend(resendApiKey);
    const email = await resend.emails.send({
      from: contactFrom,
      to: notificationTo,
      subject: "Nuevo mensaje desde Portal 771",
      text: [
        "Nuevo mensaje desde Portal 771",
        "",
        `Nombre: ${nombre}`,
        `Correo: ${correo}`,
        `Fecha: ${createdAt.toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
        })}`,
        "",
        "Mensaje:",
        mensaje,
      ].join("\n"),
      replyTo: correo,
    });

    if (email.error) {
      return initialError;
    }

    return getSuccessState();
  } catch {
    return initialError;
  }
}
