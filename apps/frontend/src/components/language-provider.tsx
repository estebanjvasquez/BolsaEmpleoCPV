"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LOCALE_STORAGE_KEY, type SupportedLocale, readLocale } from "@/lib/i18n";

type Translation = Partial<Record<Exclude<SupportedLocale, "es">, string>>;

const messages: Record<string, Translation> = {
  "Cámara Petrolera de Venezuela": { en: "Venezuelan Petroleum Chamber", fr: "Chambre pétrolière du Venezuela", it: "Camera Petrolifera del Venezuela", "pt-BR": "Câmara Petrolífera da Venezuela" },
  "La Cámara Petrolera de Venezuela es la asociación empresarial que agrupa a las empresas privadas nacionales que prestan servicios y suministran bienes al sector energético.": { en: "The Venezuelan Petroleum Chamber is the business association that brings together private national companies providing services and goods to the energy sector.", fr: "La Chambre pétrolière du Venezuela est l'association professionnelle qui rassemble les entreprises privées nationales fournissant des services et des biens au secteur énergétique.", it: "La Camera Petrolifera del Venezuela è l'associazione imprenditoriale che riunisce le aziende private nazionali che forniscono servizi e beni al settore energetico.", "pt-BR": "A Câmara Petrolífera da Venezuela é a associação empresarial que reúne empresas privadas nacionais que prestam serviços e fornecem bens ao setor energético." },
  "Afiliación": { en: "Membership", fr: "Adhésion", it: "Adesione", "pt-BR": "Filiação" },
  "Vacantes": { en: "Jobs", fr: "Offres", it: "Posizioni", "pt-BR": "Vagas" },
  "Ingresar": { en: "Sign in", fr: "Se connecter", it: "Accedi", "pt-BR": "Entrar" },
  "Administración": { en: "Administration", fr: "Administration", it: "Amministrazione", "pt-BR": "Administração" },
  "Mi panel": { en: "My dashboard", fr: "Mon espace", it: "La mia area", "pt-BR": "Meu painel" },
  "Talento preparado para mover la energía del país.": { en: "Talent ready to power the country.", fr: "Des talents prêts à faire avancer l'énergie du pays.", it: "Talenti pronti a muovere l'energia del Paese.", "pt-BR": "Talentos preparados para movimentar a energia do país." },
  "Un punto de encuentro para profesionales y empresas que construyen capacidades para la industria venezolana de hidrocarburos.": { en: "A meeting point for professionals and companies building capabilities for Venezuela's hydrocarbon industry.", fr: "Un lieu de rencontre pour les professionnels et les entreprises qui développent les capacités de l'industrie vénézuélienne des hydrocarbures.", it: "Un punto d'incontro per professionisti e aziende che sviluppano competenze per l'industria venezuelana degli idrocarburi.", "pt-BR": "Um ponto de encontro para profissionais e empresas que desenvolvem capacidades para a indústria venezuelana de hidrocarbonetos." },
  "Crear perfil profesional": { en: "Create professional profile", fr: "Créer mon profil professionnel", it: "Crea il profilo professionale", "pt-BR": "Criar perfil profissional" },
  "Acceso para empresas": { en: "Company access", fr: "Accès entreprises", it: "Accesso aziende", "pt-BR": "Acesso para empresas" },
  "Una iniciativa de la CPV": { en: "A CPV initiative", fr: "Une initiative de la CPV", it: "Un'iniziativa della CPV", "pt-BR": "Uma iniciativa da CPV" },
  "La Cámara representa al sector productivo privado nacional de los hidrocarburos y reúne a empresas de toda la cadena de valor.": { en: "The Chamber represents the country's private hydrocarbon productive sector and brings together companies across the value chain.", fr: "La Chambre représente le secteur productif privé national des hydrocarbures et réunit les entreprises de toute la chaîne de valeur.", it: "La Camera rappresenta il settore produttivo privato nazionale degli idrocarburi e riunisce imprese di tutta la catena del valore.", "pt-BR": "A Câmara representa o setor produtivo privado nacional de hidrocarbonetos e reúne empresas de toda a cadeia de valor." },
  "Conozca la Cámara": { en: "About the Chamber", fr: "Découvrir la Chambre", it: "Scopri la Camera", "pt-BR": "Conheça a Câmara" },
  "Bolsa de talento CPV": { en: "CPV talent hub", fr: "Plateforme de talents CPV", it: "Portale talenti CPV", "pt-BR": "Banco de talentos CPV" },
  "Dos rutas para conectar conocimiento y oportunidades.": { en: "Two paths to connect expertise and opportunity.", fr: "Deux parcours pour relier savoir-faire et opportunités.", it: "Due percorsi per collegare competenze e opportunità.", "pt-BR": "Dois caminhos para conectar conhecimento e oportunidades." },
  "Un entorno administrado para hacer visible la experiencia profesional y facilitar búsquedas responsables para las empresas afiliadas.": { en: "A managed environment that makes professional experience visible and enables responsible searches for affiliated companies.", fr: "Un environnement administré qui valorise l'expérience professionnelle et facilite des recherches responsables pour les entreprises affiliées.", it: "Un ambiente gestito che rende visibile l'esperienza professionale e favorisce ricerche responsabili per le aziende affiliate.", "pt-BR": "Um ambiente administrado que dá visibilidade à experiência profissional e facilita buscas responsáveis para empresas afiliadas." },
  "Profesionales": { en: "Professionals", fr: "Professionnels", it: "Professionisti", "pt-BR": "Profissionais" },
  "Construya un perfil que acerque su experiencia a las empresas afiliadas del sector.": { en: "Build a profile that brings your experience closer to affiliated companies in the sector.", fr: "Créez un profil qui rapproche votre expérience des entreprises affiliées du secteur.", it: "Crea un profilo che avvicini la tua esperienza alle aziende affiliate del settore.", "pt-BR": "Crie um perfil que aproxime sua experiência das empresas afiliadas do setor." },
  "Encuentre capacidades profesionales y publique oportunidades con acompañamiento de la CPV.": { en: "Find professional capabilities and publish opportunities with CPV support.", fr: "Trouvez des compétences professionnelles et publiez des opportunités avec l'accompagnement de la CPV.", it: "Trova competenze professionali e pubblica opportunità con il supporto della CPV.", "pt-BR": "Encontre competências profissionais e publique oportunidades com o apoio da CPV." },
  "Empresas": { en: "Companies", fr: "Entreprises", it: "Aziende", "pt-BR": "Empresas" },
  "Crear mi perfil": { en: "Create my profile", fr: "Créer mon profil", it: "Crea il mio profilo", "pt-BR": "Criar meu perfil" },
  "Registrar empresa": { en: "Register a company", fr: "Enregistrer une entreprise", it: "Registra un'azienda", "pt-BR": "Cadastrar empresa" },
  "+300": { en: "+300", fr: "+300", it: "+300", "pt-BR": "+300" },
  "Empresas afiliadas": { en: "Affiliated companies", fr: "Entreprises affiliées", it: "Aziende affiliate", "pt-BR": "Empresas afiliadas" },
  "Una red que impulsa capacidades nacionales.": { en: "A network that strengthens national capabilities.", fr: "Un réseau qui renforce les capacités nationales.", it: "Una rete che rafforza le competenze nazionali.", "pt-BR": "Uma rede que impulsiona capacidades nacionais." },
  "La CPV conecta empresas que prestan servicios y suministran bienes al sector energético. Este portal abre un canal específico para el talento que hace posible esa cadena de valor.": { en: "CPV connects companies that provide services and supply goods to the energy sector. This portal creates a dedicated channel for the talent that makes that value chain possible.", fr: "La CPV relie les entreprises qui fournissent des services et des biens au secteur énergétique. Ce portail crée un canal dédié aux talents qui rendent cette chaîne de valeur possible.", it: "La CPV collega le aziende che forniscono servizi e beni al settore energetico. Questo portale apre un canale dedicato ai talenti che rendono possibile questa catena del valore.", "pt-BR": "A CPV conecta empresas que prestam serviços e fornecem bens ao setor energético. Este portal cria um canal específico para os talentos que tornam essa cadeia de valor possível." },
  "Comience hoy": { en: "Start today", fr: "Commencez aujourd'hui", it: "Inizia oggi", "pt-BR": "Comece hoje" },
  "Su experiencia puede formar parte de la próxima oportunidad.": { en: "Your experience can be part of the next opportunity.", fr: "Votre expérience peut faire partie de la prochaine opportunité.", it: "La tua esperienza può far parte della prossima opportunità.", "pt-BR": "Sua experiência pode fazer parte da próxima oportunidade." },
  "Registrarme": { en: "Register", fr: "M'inscrire", it: "Registrati", "pt-BR": "Cadastrar-me" },
  "Vacantes activas": { en: "Active jobs", fr: "Offres actives", it: "Posizioni attive", "pt-BR": "Vagas ativas" },
  "Cargando…": { en: "Loading…", fr: "Chargement…", it: "Caricamento…", "pt-BR": "Carregando…" },
  "No hay vacantes activas por ahora.": { en: "There are no active jobs at the moment.", fr: "Aucune offre active pour le moment.", it: "Non ci sono posizioni attive al momento.", "pt-BR": "Não há vagas ativas no momento." },
  "Iniciar Sesión": { en: "Sign in", fr: "Se connecter", it: "Accedi", "pt-BR": "Entrar" },
  "Cerrar sesión": { en: "Sign out", fr: "Se déconnecter", it: "Esci", "pt-BR": "Sair" },
  "Buscar talento": { en: "Search talent", fr: "Rechercher des talents", it: "Cerca talenti", "pt-BR": "Buscar talentos" },
  "Mis vacantes": { en: "My jobs", fr: "Mes offres", it: "Le mie posizioni", "pt-BR": "Minhas vagas" },
  "Mi empresa": { en: "My company", fr: "Mon entreprise", it: "La mia azienda", "pt-BR": "Minha empresa" },
  "Ver portal": { en: "View portal", fr: "Voir le portail", it: "Vedi il portale", "pt-BR": "Ver portal" },
  "Datos personales": { en: "Personal data", fr: "Données personnelles", it: "Dati personali", "pt-BR": "Dados pessoais" },
  "Uso del portal": { en: "Using the portal", fr: "Utilisation du portail", it: "Uso del portale", "pt-BR": "Uso do portal" },
  "Contacto": { en: "Contact", fr: "Contact", it: "Contatto", "pt-BR": "Contato" },
  "Enlaces de Interés": { en: "Useful links", fr: "Liens utiles", it: "Link utili", "pt-BR": "Links úteis" },
  "Información": { en: "Information", fr: "Informations", it: "Informazioni", "pt-BR": "Informações" },
  "Nombre": { en: "First name", fr: "Prénom", it: "Nome", "pt-BR": "Nome" }, "Apellido": { en: "Last name", fr: "Nom", it: "Cognome", "pt-BR": "Sobrenome" },
  "Correo": { en: "Email", fr: "E-mail", it: "Email", "pt-BR": "E-mail" }, "Correo Electrónico": { en: "Email address", fr: "Adresse e-mail", it: "Indirizzo email", "pt-BR": "E-mail" },
  "Contraseña": { en: "Password", fr: "Mot de passe", it: "Password", "pt-BR": "Senha" }, "Teléfono": { en: "Phone", fr: "Téléphone", it: "Telefono", "pt-BR": "Telefone" },
  "Ciudad": { en: "City", fr: "Ville", it: "Città", "pt-BR": "Cidade" }, "Estado": { en: "State", fr: "État", it: "Stato", "pt-BR": "Estado" },
  "Área": { en: "Area", fr: "Domaine", it: "Area", "pt-BR": "Área" }, "Subárea": { en: "Subarea", fr: "Sous-domaine", it: "Sottoarea", "pt-BR": "Subárea" },
  "Sector": { en: "Sector", fr: "Secteur", it: "Settore", "pt-BR": "Setor" }, "Idiomas": { en: "Languages", fr: "Langues", it: "Lingue", "pt-BR": "Idiomas" },
  "Certificaciones": { en: "Certifications", fr: "Certifications", it: "Certificazioni", "pt-BR": "Certificações" }, "Experiencia mínima (años)": { en: "Minimum experience (years)", fr: "Expérience minimale (années)", it: "Esperienza minima (anni)", "pt-BR": "Experiência mínima (anos)" },
  "Buscar": { en: "Search", fr: "Rechercher", it: "Cerca", "pt-BR": "Buscar" }, "Filtrar": { en: "Filter", fr: "Filtrer", it: "Filtra", "pt-BR": "Filtrar" },
  "Todas": { en: "All", fr: "Toutes", it: "Tutte", "pt-BR": "Todas" }, "Todos": { en: "All", fr: "Tous", it: "Tutti", "pt-BR": "Todos" },
  "Pendientes": { en: "Pending", fr: "En attente", it: "In attesa", "pt-BR": "Pendentes" }, "Aprobados": { en: "Approved", fr: "Approuvés", it: "Approvati", "pt-BR": "Aprovados" }, "Rechazados": { en: "Rejected", fr: "Refusés", it: "Rifiutati", "pt-BR": "Rejeitados" },
  "Aprobar": { en: "Approve", fr: "Approuver", it: "Approva", "pt-BR": "Aprovar" }, "Rechazar": { en: "Reject", fr: "Refuser", it: "Rifiuta", "pt-BR": "Rejeitar" },
  "Editar": { en: "Edit", fr: "Modifier", it: "Modifica", "pt-BR": "Editar" }, "Guardar cambios": { en: "Save changes", fr: "Enregistrer les modifications", it: "Salva modifiche", "pt-BR": "Salvar alterações" },
  "Actualizar": { en: "Refresh", fr: "Actualiser", it: "Aggiorna", "pt-BR": "Atualizar" }, "Reintentar": { en: "Retry", fr: "Réessayer", it: "Riprova", "pt-BR": "Tentar novamente" },
  "Solicitudes de contacto": { en: "Contact requests", fr: "Demandes de contact", it: "Richieste di contatto", "pt-BR": "Solicitações de contato" }, "Correos transaccionales": { en: "Transactional emails", fr: "E-mails transactionnels", it: "Email transazionali", "pt-BR": "E-mails transacionais" },
  "Panel de Administración": { en: "Administration panel", fr: "Panneau d'administration", it: "Pannello di amministrazione", "pt-BR": "Painel de administração" },
  "Perfil de empresa": { en: "Company profile", fr: "Profil de l'entreprise", it: "Profilo aziendale", "pt-BR": "Perfil da empresa" }, "Publicar nueva vacante": { en: "Post a new job", fr: "Publier une offre", it: "Pubblica una posizione", "pt-BR": "Publicar nova vaga" },
  "Enviar vacante": { en: "Submit job", fr: "Envoyer l'offre", it: "Invia posizione", "pt-BR": "Enviar vaga" }, "No hay vacantes en este estado.": { en: "There are no jobs in this status.", fr: "Il n'y a aucune offre avec ce statut.", it: "Non ci sono posizioni in questo stato.", "pt-BR": "Não há vagas neste status." },
};

function translate(locale: SupportedLocale, source: string) {
  return locale === "es" ? source : messages[source]?.[locale] ?? source;
}

interface LanguageContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (source: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => readLocale());
  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);
  const setLocale = useCallback((value: SupportedLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
    setLocaleState(value);
  }, []);
  const value = useMemo(() => ({ locale, setLocale, t: (source: string) => translate(locale, source) }), [locale, setLocale]);
  return <LanguageContext.Provider value={value}>{children}<StaticInterfaceTranslator locale={locale} /></LanguageContext.Provider>;
}

function StaticInterfaceTranslator({ locale }: { locale: SupportedLocale }) {
  const originals = useRef(new WeakMap<Text, string>());
  useEffect(() => {
    const translateTree = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (node) => {
        const parent = node.parentElement;
        return parent && !["SCRIPT", "STYLE", "OPTION"].includes(parent.tagName) && node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      } });
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      nodes.forEach((node) => {
        const source = originals.current.get(node) ?? node.nodeValue ?? "";
        originals.current.set(node, source);
        const trimmed = source.trim();
        const localized = translate(locale, trimmed);
        if (localized !== trimmed) node.nodeValue = source.replace(trimmed, localized);
      });
    };
    translateTree(document.body);
    const observer = new MutationObserver((changes) => changes.forEach((change) => change.addedNodes.forEach((node) => translateTree(node))));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);
  return null;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
