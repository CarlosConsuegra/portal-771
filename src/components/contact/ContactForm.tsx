"use client";

import { useActionState } from "react";
import { submitContactMessage } from "@/app/contacto/actions";

const initialState = {
  ok: false,
  message: "",
};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactMessage,
    initialState
  );

  return (
    <form action={formAction} className="mt-8 flex max-w-[28rem] flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-[0.82rem] text-muted">nombre</span>
        <input
          type="text"
          name="nombre"
          required
          className="min-h-11 border border-line bg-transparent px-3 py-2 text-[1rem] text-foreground outline-none transition-colors focus:border-technical"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[0.82rem] text-muted">correo</span>
        <input
          type="email"
          name="correo"
          required
          className="min-h-11 border border-line bg-transparent px-3 py-2 text-[1rem] text-foreground outline-none transition-colors focus:border-technical"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[0.82rem] text-muted">mensaje</span>
        <textarea
          name="mensaje"
          rows={6}
          required
          className="border border-line bg-transparent px-3 py-2 text-[1rem] leading-[1.8] text-foreground outline-none transition-colors focus:border-technical"
        />
      </label>

      {state.message ? (
        <p
          className={`text-[0.88rem] ${
            state.ok ? "text-technical" : "text-muted"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit border border-technical px-4 py-2 text-[0.92rem] text-foreground transition-colors hover:bg-technical hover:text-background disabled:opacity-50"
      >
        {isPending ? "enviando" : "enviar"}
      </button>
    </form>
  );
}
