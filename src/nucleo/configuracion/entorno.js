export const configuracionEntorno = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  zonaHoraria: "America/La_Paz",
  nombreInstitucional: "Gobierno Autónomo Municipal de Uyuni",
};

export function obtenerConfiguracionFaltante() {
  return Object.entries({})
    .filter(([, valor]) => !valor)
    .map(([nombre]) => nombre);
}
