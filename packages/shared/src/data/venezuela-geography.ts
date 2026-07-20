export interface VenezuelaState {
  name: string;
  cities: string[];
}

// Venezuela's 23 states + Distrito Capital, each with its major cities.
// Served via GET /api/v1/catalogs (implementation_plan.md §6) to back the
// registration wizard's state/city selects — not a DB table, since
// Professional.city/state are free-text columns validated against this list.
export const VENEZUELA_STATES: VenezuelaState[] = [
  { name: "Amazonas", cities: ["Puerto Ayacucho"] },
  { name: "Anzoátegui", cities: ["Barcelona", "Puerto La Cruz", "El Tigre", "Lechería"] },
  { name: "Apure", cities: ["San Fernando de Apure", "Guasdualito"] },
  { name: "Aragua", cities: ["Maracay", "La Victoria", "Turmero", "Cagua"] },
  { name: "Barinas", cities: ["Barinas", "Barinitas"] },
  { name: "Bolívar", cities: ["Ciudad Bolívar", "Ciudad Guayana", "Puerto Ordaz", "Upata"] },
  { name: "Carabobo", cities: ["Valencia", "Puerto Cabello", "Guacara", "Naguanagua"] },
  { name: "Cojedes", cities: ["San Carlos", "Tinaquillo"] },
  { name: "Delta Amacuro", cities: ["Tucupita"] },
  { name: "Distrito Capital", cities: ["Caracas"] },
  { name: "Falcón", cities: ["Coro", "Punto Fijo", "Santa Ana de Coro"] },
  { name: "Guárico", cities: ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"] },
  { name: "La Guaira", cities: ["La Guaira", "Catia La Mar", "Maiquetía"] },
  { name: "Lara", cities: ["Barquisimeto", "Carora", "Cabudare"] },
  { name: "Mérida", cities: ["Mérida", "El Vigía", "Ejido"] },
  { name: "Miranda", cities: ["Los Teques", "Guarenas", "Guatire", "Petare"] },
  { name: "Monagas", cities: ["Maturín", "Punta de Mata"] },
  { name: "Nueva Esparta", cities: ["Porlamar", "La Asunción", "Pampatar"] },
  { name: "Portuguesa", cities: ["Guanare", "Acarigua", "Araure"] },
  { name: "Sucre", cities: ["Cumaná", "Carúpano", "Güiria"] },
  { name: "Táchira", cities: ["San Cristóbal", "Táriba", "Rubio"] },
  { name: "Trujillo", cities: ["Trujillo", "Valera", "Boconó"] },
  { name: "Yaracuy", cities: ["San Felipe", "Yaritagua"] },
  { name: "Zulia", cities: ["Maracaibo", "Cabimas", "Ciudad Ojeda", "Santa Bárbara del Zulia"] },
];
