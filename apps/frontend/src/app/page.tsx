import Link from "next/link";
import { Icon } from "@/components/icon";

const BENEFITS = [
  {
    title: "Visibilidad con Empresas Líderes",
    description:
      "Su perfil profesional será visible para directores de RRHH de las operadoras y empresas de servicios más importantes del país.",
  },
  {
    title: "Perfiles Calificados y Verificados",
    description:
      "Para empresas, garantizamos una base de datos de profesionales con experiencia real en el sector petrolero venezolano.",
  },
  {
    title: "Entorno Seguro y Confiable",
    description: "Manejamos su información con estricta confidencialidad bajo los parámetros de la Cámara Petrolera.",
  },
];

/** Placeholder for real site photography — swap the gradient divs below once assets are supplied. */
function IndustrialPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`bg-[radial-gradient(circle_at_30%_20%,#3f4754_0%,#141c27_55%,#000000_100%)] ${className ?? ""}`}
    >
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(254,152,25,0)_0%,rgba(254,152,25,0.08)_100%)]">
        <Icon name="oil_barrel" className="text-8xl text-secondary-container/40" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto flex min-h-[80vh] max-w-container-max flex-col items-center justify-center px-margin-mobile py-16 text-center md:py-24">
        <div className="mb-6 inline-flex items-center rounded-full bg-secondary-fixed px-4 py-1.5 font-label text-label-sm text-on-secondary-fixed">
          <Icon name="stars" className="mr-2 text-sm" filled />
          Liderazgo Energético en Venezuela
        </div>
        <h1 className="max-w-4xl font-headline text-headline-lg-mobile text-primary-container md:text-headline-xl">
          Bolsa de Talento CPV: El punto de encuentro del sector petrolero
        </h1>
        <p className="mt-6 max-w-2xl font-body text-body-lg text-on-surface-variant">
          Conectamos el talento más calificado de Venezuela con las empresas líderes afiliadas a la Cámara Petrolera,
          impulsando el futuro energético del país.
        </p>
        <div className="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-full bg-primary-container px-8 py-4 font-headline text-headline-md text-on-primary transition-opacity hover:opacity-90"
          >
            Soy Profesional
            <Icon name="arrow_forward" className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/search"
            className="flex items-center justify-center rounded-full border-2 border-primary-container px-8 py-4 font-headline text-headline-md text-primary-container transition-colors hover:bg-primary-container hover:text-on-primary"
          >
            Soy Empresa
          </Link>
        </div>
        <div className="mt-16 w-full max-w-5xl overflow-hidden rounded-xl border border-border-subtle shadow-lg">
          <IndustrialPlaceholder className="h-[300px] w-full md:h-[500px]" />
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-container-max px-margin-mobile py-20">
        <div className="flex flex-col items-center gap-16 lg:flex-row">
          <div className="lg:w-1/2">
            <div className="h-[400px] w-full overflow-hidden rounded-xl border border-border-subtle shadow-md">
              <IndustrialPlaceholder className="h-full w-full" />
            </div>
          </div>
          <div className="lg:w-1/2">
            <h2 className="mb-8 font-headline text-headline-lg text-primary-container">
              ¿Por qué unirse a la Bolsa de Talento CPV?
            </h2>
            <ul className="space-y-6">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-4">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
                    <Icon name="check" className="text-sm font-bold text-white" />
                  </div>
                  <div>
                    <h4 className="font-headline text-lg font-semibold text-primary-container">{benefit.title}</h4>
                    <p className="font-body text-body-sm text-on-surface-variant">{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-12">
              <Link
                href="/register"
                className="inline-block rounded-lg bg-primary-container px-10 py-4 font-headline text-headline-md text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
              >
                Registrarme Ahora
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
