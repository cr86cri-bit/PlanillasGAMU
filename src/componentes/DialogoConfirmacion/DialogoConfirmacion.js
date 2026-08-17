import { crearElemento } from "../../utilidades/dom.js";
import { Boton } from "../Boton/Boton.js";
import { Modal } from "../Modal/Modal.js";

export function confirmarAccion({
  titulo = "Confirmar acción",
  mensaje = "¿Deseas continuar?",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variante = "peligro",
} = {}) {
  return new Promise((resolver) => {
    let modal;
    const cerrar = (resultado) => {
      modal.remove();
      resolver(resultado);
    };

    modal = Modal({
      titulo,
      cuerpo: [crearElemento("p", { texto: mensaje })],
      pie: [
        Boton({ texto: textoCancelar, variante: "secundario", alClick: () => cerrar(false) }),
        Boton({ texto: textoConfirmar, variante, alClick: () => cerrar(true) }),
      ],
      alCerrar: () => resolver(false),
    });
  });
}
