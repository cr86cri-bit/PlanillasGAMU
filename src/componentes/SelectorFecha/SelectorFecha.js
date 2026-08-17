import { CampoTexto } from "../CampoTexto/CampoTexto.js";
import { Selector } from "../Selector/Selector.js";

export function SelectorFecha(opciones = {}) {
  return CampoTexto({ ...opciones, tipo: "date" });
}

export function SelectorPeriodo({ anio, mes, alCambiarAnio, alCambiarMes } = {}) {
  const opcionesMes = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ].map((nombre, indice) => ({ valor: indice + 1, etiqueta: nombre }));

  const anioActual = new Date().getFullYear();
  const opcionesAnio = Array.from({ length: 8 }, (_, indice) => anioActual - 4 + indice).map(
    (valor) => ({ valor, etiqueta: String(valor) }),
  );

  return [
    Selector({ etiqueta: "Año", valor: anio, opciones: opcionesAnio, alCambiar: alCambiarAnio }),
    Selector({
      etiqueta: "Mes",
      valor: mes,
      opciones: opcionesMes,
      alCambiar: alCambiarMes,
    }),
  ];
}
