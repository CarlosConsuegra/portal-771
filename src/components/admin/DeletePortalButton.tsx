"use client";

type DeletePortalButtonProps = {
  action: () => void | Promise<void>;
};

export function DeletePortalButton({ action }: DeletePortalButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "¿Eliminar este portal? Esta acción no se puede deshacer."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
      >
        eliminar portal
      </button>
    </form>
  );
}
