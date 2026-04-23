"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ContactFormState = {
  ok: boolean;
  message: string;
};

const initialError: ContactFormState = {
  ok: false,
  message: "No se pudo enviar el mensaje.",
};

function getRequiredField(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Falta ${name}.`);
  }

  return value.trim();
}

export async function submitContactMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        message: "Supabase no está configurado.",
      };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationTo = process.env.CONTACT_NOTIFICATION_TO;
    const contactFrom = process.env.CONTACT_FROM;

    if (!resendApiKey || !notificationTo || !contactFrom) {
      return {
        ok: false,
        message: "El envío de correo no está configurado.",
      };
    }

    const nombre = getRequiredField(formData, "nombre");
    const correo = getRequiredField(formData, "correo");
    const mensaje = getRequiredField(formData, "mensaje");
    const createdAt = new Date();

    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: nombre,
      email: correo,
      message: mensaje,
      created_at: createdAt.toISOString(),
    });

    if (error) {
      return {
        ok: false,
        message: "No se pudo guardar el mensaje.",
      };
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
      return {
        ok: false,
        message: "El mensaje se guardó, pero no se pudo enviar el correo.",
      };
    }

    return {
      ok: true,
      message: "mensaje enviado",
    };
  } catch {
    return initialError;
  }
}
