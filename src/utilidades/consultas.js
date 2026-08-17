export function crearControlCancelacion() {
  const controlador = new AbortController();

  return {
    senal: controlador.signal,
    cancelar: () => controlador.abort(),
  };
}

export function crearAntirebote(funcion, espera = 350) {
  let temporizador = null;

  return (...argumentos) => {
    window.clearTimeout(temporizador);
    temporizador = window.setTimeout(() => funcion(...argumentos), espera);
  };
}
