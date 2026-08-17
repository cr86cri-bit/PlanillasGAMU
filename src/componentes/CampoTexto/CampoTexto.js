import { crearElemento } from "../../utilidades/dom.js";

export function CampoTexto({
  id,
  etiqueta,
  tipo = "text",
  valor = "",
  marcador = "",
  ayuda = "",
  error = "",
  requerido = false,
  deshabilitado = false,
  alCambiar,
  nombre,
  autocompletar,
} = {}) {
  const idCampo = id ?? `campo-${crypto.randomUUID()}`;
  const entrada = crearElemento("input", {
    atributos: {
      id: idCampo,
      name: nombre ?? idCampo,
      type: tipo,
      value: valor,
      placeholder: marcador,
      required: requerido,
      disabled: deshabilitado,
      autocomplete: autocompletar,
      "aria-invalid": Boolean(error),
      "aria-describedby": ayuda || error ? `${idCampo}-ayuda` : null,
    },
    eventos: alCambiar ? { input: (evento) => alCambiar(evento.target.value, evento) } : {},
  });

  return crearElemento("div", { clases: "campo" }, [
    etiqueta ? crearElemento("label", { atributos: { for: idCampo }, texto: etiqueta }) : null,
    entrada,
    ayuda && !error
      ? crearElemento("span", {
          clases: "campo__ayuda",
          atributos: { id: `${idCampo}-ayuda` },
          texto: ayuda,
        })
      : null,
    error
      ? crearElemento("span", {
          clases: "campo__error",
          atributos: { id: `${idCampo}-ayuda` },
          texto: error,
        })
      : null,
  ]);
}
