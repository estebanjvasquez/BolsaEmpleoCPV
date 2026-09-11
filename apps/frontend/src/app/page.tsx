import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";

const ROUTES = [
  { number: "01", title: "Profesionales", description: "Construya un perfil que acerque su experiencia a las empresas afiliadas del sector.", href: "/register", label: "Crear mi perfil", icon: "person" },
  { number: "02", title: "Empresas", description: "Encuentre capacidades profesionales y publique oportunidades con acompañamiento de la CPV.", href: "/company/register", label: "Registrar empresa", icon: "business" },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f5f5f3] text-[#18212c]">
      <section className="relative isolate border-b border-[#d6d9dc] bg-[#17212c]">
        <div className="absolute inset-0">
          <Image src="/brand/talento-hero-industria.png" alt="Profesionales del sector energético frente a una instalación industrial" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-[#101923]/78" />
          <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(12,21,31,0.96)_5%,rgba(16,27,39,0.86)_45%,rgba(16,27,39,0.24)_100%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:84px_84px]" />
        </div>
        <div className="relative mx-auto grid min-h-[590px] max-w-container-max items-end px-margin-mobile pb-14 pt-20 md:min-h-[660px] md:px-margin-desktop md:pb-20 md:pt-24 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="mb-5 inline-flex items-center gap-3 border-l-2 border-[#d39736] pl-3 font-label text-label-sm uppercase tracking-[0.16em] text-[#f5d9a5]">Cámara Petrolera de Venezuela</p>
            <h1 className="max-w-3xl font-headline text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-white md:text-6xl">Talento preparado para mover la energía del país.</h1>
            <p className="mt-6 max-w-xl font-body text-body-lg text-[#dbe1e5]">Un punto de encuentro para profesionales y empresas que construyen capacidades para la industria venezolana de hidrocarburos.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#d39736] px-6 py-3.5 font-label text-label-md text-[#17212c] transition hover:bg-[#e2ad59] active:translate-y-px">Crear perfil profesional <Icon name="arrow_forward" className="text-lg" /></Link>
              <Link href="/company/register" className="inline-flex items-center justify-center rounded-md border border-white/65 px-6 py-3.5 font-label text-label-md text-white transition hover:bg-white hover:text-[#17212c] active:translate-y-px">Acceso para empresas</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d6d9dc] bg-white">
        <div className="mx-auto grid max-w-container-max gap-6 px-margin-mobile py-7 md:grid-cols-[auto_1fr_auto] md:items-center md:px-margin-desktop">
          <p className="font-label text-label-sm uppercase tracking-[0.14em] text-[#50606f]">Una iniciativa de la CPV</p>
          <p className="max-w-2xl font-body text-body-md text-[#344250]">La Cámara representa al sector productivo privado nacional de los hidrocarburos y reúne a empresas de toda la cadena de valor.</p>
          <a href="https://camarapetrolera.org/la-camara/" className="inline-flex items-center gap-1 font-label text-label-md text-[#17212c] underline decoration-[#d39736] decoration-2 underline-offset-4 hover:text-[#8b5d17]">Conozca la Cámara <Icon name="north_east" className="text-base" /></a>
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-margin-mobile py-16 md:px-margin-desktop md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5"><p className="font-label text-label-sm uppercase tracking-[0.16em] text-[#8b5d17]">Bolsa de talento CPV</p><h2 className="mt-4 max-w-md font-headline text-3xl font-semibold leading-tight tracking-[-0.025em] text-[#17212c] md:text-4xl">Dos rutas para conectar conocimiento y oportunidades.</h2></div>
          <p className="max-w-xl font-body text-body-lg text-[#50606f] lg:col-span-6 lg:col-start-7">Un entorno administrado para hacer visible la experiencia profesional y facilitar búsquedas responsables para las empresas afiliadas.</p>
        </div>
        <div className="mt-12 grid border-t border-[#bfc6cb] md:grid-cols-2">
          {ROUTES.map((route, index) => <article key={route.title} className={`group py-8 ${index === 0 ? "border-b border-[#bfc6cb] md:border-b-0 md:border-r md:pr-10" : "md:pl-10"}`}>
            <div className="flex items-start justify-between"><span className="font-label text-label-sm tracking-[0.16em] text-[#8b5d17]">{route.number}</span><Icon name={route.icon} className="text-3xl text-[#17212c]" /></div>
            <h3 className="mt-12 font-headline text-headline-lg text-[#17212c]">{route.title}</h3><p className="mt-3 max-w-sm font-body text-body-md text-[#50606f]">{route.description}</p>
            <Link href={route.href} className="mt-8 inline-flex items-center gap-2 font-label text-label-md text-[#17212c] underline decoration-[#d39736] decoration-2 underline-offset-4 transition group-hover:text-[#8b5d17]">{route.label} <Icon name="arrow_forward" className="text-lg" /></Link>
          </article>)}
        </div>
      </section>

      <section className="bg-[#e5e8e8]"><div className="mx-auto grid max-w-container-max gap-10 px-margin-mobile py-16 md:px-margin-desktop md:py-20 lg:grid-cols-12 lg:items-center"><div className="lg:col-span-4"><p className="font-headline text-6xl font-semibold tracking-[-0.06em] text-[#17212c]">+300</p><p className="mt-2 font-label text-label-sm uppercase tracking-[0.14em] text-[#50606f]">Empresas afiliadas</p></div><div className="border-l-2 border-[#d39736] pl-6 lg:col-span-7"><h2 className="font-headline text-2xl font-semibold tracking-[-0.02em] text-[#17212c] md:text-3xl">Una red que impulsa capacidades nacionales.</h2><p className="mt-4 max-w-2xl font-body text-body-lg text-[#50606f]">La CPV conecta empresas que prestan servicios y suministran bienes al sector energético. Este portal abre un canal específico para el talento que hace posible esa cadena de valor.</p></div></div></section>

      <section className="bg-[#17212c]"><div className="mx-auto flex max-w-container-max flex-col gap-8 px-margin-mobile py-16 md:px-margin-desktop md:py-20 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-label text-label-sm uppercase tracking-[0.16em] text-[#f0c675]">Comience hoy</p><h2 className="mt-4 max-w-2xl font-headline text-3xl font-semibold leading-tight tracking-[-0.025em] text-white md:text-4xl">Su experiencia puede formar parte de la próxima oportunidad.</h2></div><Link href="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-white px-6 py-3.5 font-label text-label-md text-[#17212c] transition hover:bg-[#f0c675] active:translate-y-px">Registrarme <Icon name="arrow_forward" className="text-lg" /></Link></div></section>
    </main>
  );
}
