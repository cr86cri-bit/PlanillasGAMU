import { crearElemento } from "../../utilidades/dom.js";
import { Icono } from "../Icono/Icono.js";

export function Boton({
  texto = "",
  titulo = texto,
  variante = "primario",
  tipo = "button",
  icono = "",
  deshabilitado = false,
  clase = "",
  alClick,
} = {}) {
  const clases = ["boton", `boton--${variante}`, clase];

  if (!texto && icono) {
    clases.push("boton--icono");
  }

  return crearElemento(
    "button",
    {
      clases,
      atributos: {
        type: tipo,
        title: titulo,
        "aria-label": titulo,
        disabled: deshabilitado,
      },
      eventos: alClick ? { click: alClick } : {},
    },
    [
      icono ? Icono({ nombre: icono, titulo: "" }) : null,
      texto ? crearElemento("span", { texto }) : null,
    ],
  );
}
