import { crearElemento } from "../../utilidades/dom.js";

const trazos = {
  inicio: ["M3 10.5 12 3l9 7.5", "M5 10v9h14v-9", "M9 19v-5h6v5"],
  buscar: ["M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z", "M16 16l5 5"],
  importar: ["M12 3v12", "M8 11l4 4 4-4", "M4 19h16"],
  reporte: ["M6 3h9l3 3v15H6z", "M14 3v4h4", "M9 12h6", "M9 16h6"],
  funcionario: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
  usuarios: [
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M2 21a7 7 0 0 1 14 0",
    "M17 8a3 3 0 1 0 0-6",
    "M19 21a5 5 0 0 0-4-5",
  ],
  catalogo: ["M4 5h16", "M4 12h16", "M4 19h16", "M7 5v14"],
  unidad: ["M4 21V7l8-4 8 4v14", "M9 21v-6h6v6", "M8 9h.01", "M12 9h.01", "M16 9h.01"],
  reloj: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 6v6l4 2"],
  excepcion: ["M12 3l9 18H3z", "M12 9v5", "M12 17h.01"],
  calendario: ["M7 3v4", "M17 3v4", "M4 9h16", "M5 5h14v16H5z"],
  extra: ["M12 5v14", "M5 12h14"],
  asistencia: ["M9 12l2 2 4-5", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
  roles: ["M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z", "M9.5 12l1.7 1.7 3.8-4"],
  configurar: [
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    "M4 12h2",
    "M18 12h2",
    "M12 4v2",
    "M12 18v2",
    "M6.3 6.3l1.4 1.4",
    "M16.3 16.3l1.4 1.4",
    "M17.7 6.3l-1.4 1.4",
    "M7.7 16.3l-1.4 1.4",
  ],
  salir: ["M10 17l5-5-5-5", "M15 12H3", "M21 3v18h-8"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  descargar: ["M12 3v12", "M8 11l4 4 4-4", "M5 21h14"],
  guardar: ["M5 3h12l2 2v16H5z", "M8 3v6h8", "M8 17h8"],
  editar: ["M4 20h4l10-10-4-4L4 16z", "M13 7l4 4"],
  estado: ["M20 6L9 17l-5-5"],
  cerrar: ["M6 6l12 12", "M18 6L6 18"],
  limpiar: ["M4 7h16", "M10 11v6", "M14 11v6", "M6 7l1 14h10l1-14", "M9 7V4h6v3"],
};

const aliasIcono = {
  I: "inicio",
  F: "funcionario",
  C: "catalogo",
  U: "unidad",
  H: "reloj",
  E: "excepcion",
  D: "calendario",
  X: "importar",
  A: "asistencia",
  P: "reporte",
  S: "salir",
  R: "roles",
  G: "configurar",
  M: "menu",
  "+": "extra",
  L: "limpiar",
};

export function Icono({ nombre = "estado", titulo = "" } = {}) {
  const clave = aliasIcono[nombre] ?? nombre;
  const rutas = trazos[clave];

  if (!rutas) {
    return crearElemento("span", { clases: "icono-lineal", texto: String(nombre).slice(0, 2) });
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icono-lineal");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", titulo ? "false" : "true");
  svg.setAttribute("role", "img");

  if (titulo) {
    const tituloSvg = document.createElementNS("http://www.w3.org/2000/svg", "title");
    tituloSvg.textContent = titulo;
    svg.append(tituloSvg);
  }

  rutas.forEach((trazo) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", trazo);
    svg.append(path);
  });

  return svg;
}
