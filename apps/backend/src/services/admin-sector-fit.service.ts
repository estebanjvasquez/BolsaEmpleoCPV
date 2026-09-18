type FitInput = {
  sector?: string | null; area?: string | null; subarea?: string | null; lastPosition?: string | null; bioSummary?: string | null;
  certifications?: string[]; experienceYears?: number | null; businessAreas?: string[]; energyServices?: string[]; businessDescription?: string | null; website?: string | null;
};
export type SectorFit = { score: number; band: "Alta" | "Media" | "Inicial"; signals: string[]; considerations: string[] };
const energyTerms = ["oil", "gas", "energ", "petrol", "hidrocarb", "refin", "perfor", "drilling", "geolog", "offshore", "pipeline", "ducto", "power", "eléctr", "electr", "solar", "eólic", "eolic", "renov", "scada", "instrument", "proces", "producción", "produccion", "seguridad industrial", "hse"];
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const matchesEnergy = (value: string | null | undefined) => value !== undefined && value !== null && energyTerms.some((term) => normalized(value).includes(normalized(term)));

/** Explainable decision support only: it never approves or rejects a profile. */
export function calculateSectorFit(input: FitInput): SectorFit {
  let score = 0; const signals: string[] = []; const considerations: string[] = [];
  const professional = input.experienceYears !== undefined;
  if (matchesEnergy(input.sector)) { score += 35; signals.push("Sector declarado relacionado con Oil & Gas o energía"); }
  if (matchesEnergy([input.area, input.subarea].filter(Boolean).join(" "))) { score += 20; signals.push("Área o subárea relacionada con la industria objetivo"); }
  if (matchesEnergy([input.lastPosition, input.bioSummary, ...(input.certifications ?? [])].filter(Boolean).join(" "))) { score += 25; signals.push(professional ? "Experiencia, resumen o certificaciones con referencias sectoriales" : "Descripción o servicios con referencias sectoriales"); }
  if (!professional && (input.businessAreas ?? []).some(matchesEnergy)) { score += 25; signals.push("Líneas de negocio declaradas para el sector energético"); }
  if (!professional && (input.energyServices?.length ?? 0) > 0) { score += 10; signals.push("Servicios técnicos declarados"); }
  if (professional && (input.experienceYears ?? 0) > 0) { score += Math.min(15, Math.max(5, Math.round((input.experienceYears ?? 0) * 2))); signals.push(`${input.experienceYears} año(s) de experiencia declarada`); }
  if (!professional && input.website) { score += 5; signals.push("Sitio web corporativo informado"); }
  if (signals.length === 0) considerations.push("No se detectaron referencias sectoriales; revise el detalle antes de decidir.");
  if (professional && !input.bioSummary) considerations.push("No hay resumen profesional para contextualizar la experiencia.");
  if (!professional && !input.businessDescription) considerations.push("La empresa no ha descrito sus actividades o capacidades.");
  const finalScore = Math.min(100, score);
  return { score: finalScore, band: finalScore >= 70 ? "Alta" : finalScore >= 40 ? "Media" : "Inicial", signals, considerations };
}
