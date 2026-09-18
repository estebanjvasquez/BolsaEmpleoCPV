import { describe, expect, it } from "vitest";
import { calculateSectorFit } from "./admin-sector-fit.service";
describe("calculateSectorFit", () => {
  it("assigns a high, explained score to an Oil & Gas professional", () => {
    const result = calculateSectorFit({ sector: "Petróleo y Gas", area: "Ingeniería", lastPosition: "Ingeniero de perforación offshore", bioSummary: "Experiencia en producción de hidrocarburos", certifications: ["HSE Oil & Gas"], experienceYears: 8 });
    expect(result.score).toBeGreaterThanOrEqual(70); expect(result.signals.length).toBeGreaterThan(1);
  });
  it("does not infer sector affinity without supporting information", () => {
    const result = calculateSectorFit({ businessAreas: [], energyServices: [], businessDescription: null, website: null });
    expect(result.score).toBe(0); expect(result.considerations[0]).toContain("No se detectaron");
  });
});
