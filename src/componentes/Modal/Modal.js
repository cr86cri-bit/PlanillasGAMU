import { crearElemento } from "../../utilidades/dom.js";
import { Boton } from "../Boton/Boton.js";

export function Modal({ titulo, cuerpo, pie, alCerrar } = {}) {
  const cerrar = () => {
    capa.remove();
    alCerrar?.();
  };

  const capa = crearElemento(
    "div",
    {
      clases: "modal-capa",
      atributos: { role: "presentation" },
      eventos: {
        click: (evento) => {
          if (evento.target === capa) {
            cerrar();
          }
        },
      },
    },
    [
      crearElemento(
        "section",
        {
          clases: "modal",
          atributos: { role: "dialog", "aria-modal": "true", "aria-label": titulo },
        },
        [
          crearElemento("header", { clases: "modal__cabecera" }, [
            crearElemento("h3", { clases: "modal__titulo", texto: titulo }),
            Boton({ icono: "cerrar", titulo: "Cerrar", variante: "fantasma", alClick: cerrar }),
          ]),
          crearElemento(
            "div",
            { clases: "modal__cuerpo" },
            Array.isArray(cuerpo) ? cuerpo : [cuerpo],
          ),
          pie
            ? crearElemento("footer", { clases: "modal__pie" }, Array.isArray(pie) ? pie : [pie])
            : null,
        ],
      ),
    ],
  );

  document.body.append(capa);
  capa.querySelector("button")?.focus();
  return capa;
}
