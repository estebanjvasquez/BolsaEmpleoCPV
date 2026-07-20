import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AREAS: Record<string, string[]> = {
  "Exploración y Producción": [
    "Geología y Geofísica",
    "Ingeniería de Yacimientos",
    "Producción de Petróleo y Gas",
    "Facilidades de Superficie",
  ],
  "Perforación y Terminación de Pozos": [
    "Ingeniería de Perforación",
    "Fluidos de Perforación",
    "Well Control",
    "Completación de Pozos",
  ],
  "Refinación y Petroquímica": ["Procesos de Refinación", "Petroquímica", "Control de Calidad"],
  "Ingeniería y Mantenimiento": [
    "Ingeniería Mecánica",
    "Ingeniería Eléctrica",
    "Ingeniería de Instrumentación y Control",
    "Mantenimiento Predictivo",
    "Ingeniería Civil e Infraestructura",
  ],
  "HSE (Seguridad, Salud y Ambiente)": [
    "Seguridad Industrial",
    "Salud Ocupacional",
    "Gestión Ambiental",
    "Respuesta a Emergencias",
  ],
  "Logística y Cadena de Suministro": [
    "Procura y Compras",
    "Gestión de Almacenes",
    "Transporte y Distribución",
    "Logística Marítima",
  ],
  "Comercialización y Mercadeo": [
    "Trading de Crudo y Derivados",
    "Mercadeo y Ventas",
    "Relaciones Comerciales",
  ],
  "Administración y Finanzas": [
    "Contabilidad",
    "Finanzas Corporativas",
    "Auditoría",
    "Presupuesto y Costos",
  ],
  "Tecnología de la Información": [
    "Desarrollo de Software",
    "Infraestructura y Redes",
    "Ciberseguridad",
    "Automatización Industrial (SCADA/DCS)",
  ],
  "Recursos Humanos": [
    "Reclutamiento y Selección",
    "Compensación y Beneficios",
    "Desarrollo Organizacional",
    "Relaciones Laborales",
  ],
};

const SECTORS = ["Público (Estatal)", "Privado", "Mixto", "Servicios Petroleros", "Consultoría"];

const CERTIFICATIONS = [
  "Well Control IFC",
  "Well Control IADC",
  "API 510 (Pressure Vessel Inspection)",
  "API 570 (Piping Inspection)",
  "API 653 (Tank Inspection)",
  "NEBOSH IGC",
  "OSHA 10",
  "OSHA 30",
  "H2S Alive",
  "Primeros Auxilios y RCP",
  "PMP (Project Management Professional)",
  "Six Sigma Green Belt",
  "Six Sigma Black Belt",
  "ISO 9001 Lead Auditor",
  "ISO 14001 Lead Auditor",
  "Rigger/Signalman",
  "Confined Space Entry",
];

async function main() {
  for (const [areaName, subareaNames] of Object.entries(AREAS)) {
    const area = await prisma.area.upsert({
      where: { name: areaName },
      create: { name: areaName },
      update: {},
    });

    for (const subareaName of subareaNames) {
      await prisma.subarea.upsert({
        where: { uq_subarea_per_area: { areaId: area.id, name: subareaName } },
        create: { areaId: area.id, name: subareaName },
        update: {},
      });
    }
  }

  for (const name of SECTORS) {
    await prisma.sector.upsert({ where: { name }, create: { name }, update: {} });
  }

  for (const name of CERTIFICATIONS) {
    await prisma.certification.upsert({ where: { name }, create: { name }, update: {} });
  }

  const [areaCount, subareaCount, sectorCount, certificationCount] = await Promise.all([
    prisma.area.count(),
    prisma.subarea.count(),
    prisma.sector.count(),
    prisma.certification.count(),
  ]);

  console.log(
    `Seeded: ${areaCount} areas, ${subareaCount} subareas, ${sectorCount} sectors, ${certificationCount} certifications.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
