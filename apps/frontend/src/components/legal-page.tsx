"use client";

import Link from "next/link";
import { getLegalDocument } from "@/lib/legal-content";
import { useLanguage } from "./language-provider";

export function LegalPage({ document }: { document: "terms" | "privacy" | "portal" }) {
  const { locale, t } = useLanguage();
  const content = getLegalDocument(locale, document);
  return <main className="mx-auto w-full max-w-3xl px-margin-mobile py-12 md:px-margin-desktop">
    <h1 className="font-headline text-headline-lg text-primary-container">{content.title}</h1>
    <p className="mt-4 font-body text-body-md">{content.intro}</p>
    <p className="mt-3 font-body text-body-sm text-on-surface-variant">{content.updated}</p>
    <div className="mt-8 space-y-8 font-body text-body-md">
      {content.sections.map((section) => <section key={section.id} id={section.id}>
        <h2 className="font-headline text-headline-md">{section.title}</h2>
        {section.paragraphs.map((paragraph) => <p className="mt-3" key={paragraph}>{paragraph}</p>)}
        {section.items && <ul className="mt-3 list-disc space-y-2 pl-6">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
      </section>)}
    </div>
    <Link href="/" className="mt-8 inline-block text-primary-container underline">{t("Volver al inicio")}</Link>
  </main>;
}
