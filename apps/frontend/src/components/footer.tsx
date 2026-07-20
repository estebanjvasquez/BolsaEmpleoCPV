import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-on-primary-fixed-variant bg-primary-container py-12">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-gutter px-margin-mobile md:grid-cols-4 md:px-margin-desktop">
        <div className="col-span-1 md:col-span-2">
          <div className="mb-6">
            <Logo variant="light" />
          </div>
          <p className="max-w-md font-body text-body-sm text-surface">
            La Cámara Petrolera de Venezuela es la asociación empresarial que agrupa a las empresas privadas
            nacionales que prestan servicios y suministran bienes al sector energético.
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-label text-label-md text-on-primary-fixed">Enlaces de Interés</h4>
          <nav className="flex flex-col gap-2">
            <a className="font-body text-body-sm text-on-primary-container transition-colors hover:text-secondary-fixed-dim" href="#">
              Afiliación
            </a>
            <a className="font-body text-body-sm text-on-primary-container transition-colors hover:text-secondary-fixed-dim" href="#">
              Empresas
            </a>
            <a className="font-body text-body-sm text-on-primary-container transition-colors hover:text-secondary-fixed-dim" href="#">
              Talento
            </a>
            <a className="font-body text-body-sm text-on-primary-container transition-colors hover:text-secondary-fixed-dim" href="#">
              Contacto
            </a>
          </nav>
        </div>
        <div>
          <h4 className="mb-4 font-label text-label-md text-on-primary-fixed">Legal</h4>
          <nav className="flex flex-col gap-2">
            <a className="font-body text-body-sm text-on-primary-container transition-colors hover:text-secondary-fixed-dim" href="#">
              Privacidad
            </a>
            <a className="font-body text-body-sm text-on-primary-container transition-colors hover:text-secondary-fixed-dim" href="#">
              Términos de Servicio
            </a>
          </nav>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-container-max border-t border-white/10 px-margin-mobile pt-8 text-center md:px-margin-desktop">
        <p className="font-body text-body-sm text-on-primary-container">
          © {new Date().getFullYear()} Cámara Petrolera de Venezuela. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
