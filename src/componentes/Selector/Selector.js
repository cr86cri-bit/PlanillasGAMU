import { crearElemento } from "../../utilidades/dom.js";

export function Selector({
  id,
  etiqueta,
  valor = "",
  opciones = [],
  requerido = false,
  deshabilitado = false,
  alCambiar,
} = {}) {
  const idCampo = id ?? `selector-${crypto.randomUUID()}`;
  const selector = crearElemento(
    "select",
    {
      atributos: {
        id: idCampo,
        required: requerido,
        disabled: deshabilitado,
      },
      eventos: alCambiar ? { change: (evento) => alCambiar(evento.target.value, evento) } : {},
    },
    opciones.map((opcion) =>
      crearElemento("option", {
        texto: opcion.etiqueta,
        atributos: {
          value: opcion.valor,
          selected: String(opcion.valor) === String(valor),
        },
      }),
    ),
  );

  return crearElemento("div", { clases: "campo" }, [
    etiqueta ? crearElemento("label", { atributos: { for: idCampo }, texto: etiqueta }) : null,
    selector,
  ]);
}
