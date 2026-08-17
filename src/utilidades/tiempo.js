export const ZONA_HORARIA = "America/La_Paz";

export function obtenerFechaIsoLocal(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const mapa = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}

export function obtenerAnioMesActual() {
  const fecha = new Date();
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(fecha);
  const mapa = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));

  return {
    anio: Number(mapa.year),
    mes: Number(mapa.month),
  };
}

export function convertirHoraAMinutos(hora) {
  if (!hora) {
    return 0;
  }

  const [horas, minutos] = String(hora).split(":").map(Number);
  return horas * 60 + minutos;
}

export function convertirMinutosAHora(minutos) {
  const normalizado = ((Number(minutos) % 1440) + 1440) % 1440;
  const horas = Math.floor(normalizado / 60);
  const resto = normalizado % 60;

  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

export function parsearFechaHoraLocal(valor) {
  if (valor instanceof Date) {
    return valor;
  }

  const texto = String(valor ?? "").trim();
  const coincidencia = texto.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!coincidencia) {
    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  const [, dia, mes, anio, hora, minuto, segundo = "0"] = coincidencia;
  const anioCompleto = anio.length === 2 ? `20${anio}` : anio;

  return new Date(
    Number(anioCompleto),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo),
  );
}

export function obtenerFechaIso(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    return null;
  }

  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

export function obtenerHoraTexto(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    return null;
  }

  return [
    String(fecha.getHours()).padStart(2, "0"),
    String(fecha.getMinutes()).padStart(2, "0"),
    String(fecha.getSeconds()).padStart(2, "0"),
  ].join(":");
}

export function sumarDias(fechaIso, dias) {
  const fecha = new Date(`${fechaIso}T00:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return obtenerFechaIso(fecha);
}

export function obtenerDiaSemanaIso(fechaIso) {
  const fecha = new Date(`${fechaIso}T00:00:00`);
  const dia = fecha.getDay();
  return dia === 0 ? 7 : dia;
}
