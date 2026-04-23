import Link from "next/link";
import { ReactNode } from "react";

type EditorialLinkProps = {
  href: string;
  children: ReactNode;
};

export function EditorialLink({ href, children }: EditorialLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex text-sm leading-6 text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
    >
      {children}
    </Link>
  );
}
