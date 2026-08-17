export function crearElemento(etiqueta, opciones = {}, hijos = []) {
  const elemento = document.createElement(etiqueta);
  const { clases, atributos, texto, html, eventos } = opciones;

  if (clases) {
    const listaClases = Array.isArray(clases) ? clases : String(clases).split(" ");
    elemento.classList.add(...listaClases.filter(Boolean));
  }

  if (atributos) {
    Object.entries(atributos).forEach(([nombre, valor]) => {
      if (valor === false || valor === null || valor === undefined) {
        return;
      }

      if (valor === true) {
        elemento.setAttribute(nombre, "");
        return;
      }

      elemento.setAttribute(nombre, String(valor));
    });
  }

  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  if (html !== undefined) {
    elemento.innerHTML = html;
  }

  if (eventos) {
    Object.entries(eventos).forEach(([nombre, manejador]) => {
      elemento.addEventListener(nombre, manejador);
    });
  }

  hijos.filter(Boolean).forEach((hijo) => {
    elemento.append(hijo);
  });

  return elemento;
}

export function limpiarNodo(nodo) {
  const foco = capturarFoco(nodo);

  while (nodo.firstChild) {
    nodo.firstChild.remove();
  }

  if (foco) {
    const restaurar = () => restaurarFoco(nodo, foco);
    if (typeof globalThis.queueMicrotask === "function") {
      globalThis.queueMicrotask(restaurar);
    } else {
      Promise.resolve().then(restaurar);
    }
  }
}

export function crearFragmento(hijos = []) {
  const fragmento = document.createDocumentFragment();
  hijos.filter(Boolean).forEach((hijo) => fragmento.append(hijo));
  return fragmento;
}

export function textoSeguro(valor, reemplazo = "Sin dato") {
  if (valor === null || valor === undefined || valor === "") {
    return reemplazo;
  }

  return String(valor);
}

export function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaObjeto = typeof fecha === "string" ? new Date(`${fecha}T00:00:00`) : fecha;

  return new Intl.DateTimeFormat("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fechaObjeto);
}

export function formatearMinutos(minutos) {
  const valor = Number(minutos || 0);
  const horas = Math.floor(valor / 60);
  const restante = valor % 60;

  if (horas === 0) {
    return `${restante} min`;
  }

  return `${horas} h ${restante} min`;
}

function esCampoEditable(elemento) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(elemento?.tagName);
}

function capturarFoco(nodo) {
  if (typeof document === "undefined" || !nodo?.contains(document.activeElement)) {
    return null;
  }

  const elemento = document.activeElement;
  if (!esCampoEditable(elemento)) {
    return null;
  }

  const foco = {
    id: elemento.id,
    nombre: elemento.getAttribute("name"),
    inicio: null,
    fin: null,
    direccion: null,
  };

  try {
    if (typeof elemento.selectionStart === "number") {
      foco.inicio = elemento.selectionStart;
      foco.fin = elemento.selectionEnd;
      foco.direccion = elemento.selectionDirection;
    }
  } catch {
    return foco;
  }

  return foco;
}

function buscarCampoRestaurable(nodo, foco) {
  if (foco.id) {
    const porId = document.getElementById(foco.id);
    if (porId && nodo.contains(porId) && esCampoEditable(porId)) {
      return porId;
    }
  }

  if (foco.nombre) {
    return [...nodo.querySelectorAll("input, textarea, select")].find(
      (elemento) => elemento.getAttribute("name") === foco.nombre,
    );
  }

  return null;
}

function restaurarFoco(nodo, foco) {
  const elemento = buscarCampoRestaurable(nodo, foco);

  if (!elemento || elemento.disabled) {
    return;
  }

  elemento.focus({ preventScroll: true });

  if (foco.inicio === null || typeof elemento.setSelectionRange !== "function") {
    return;
  }

  try {
    const longitud = String(elemento.value ?? "").length;
    const inicio = Math.min(foco.inicio, longitud);
    const fin = Math.min(foco.fin ?? foco.inicio, longitud);
    elemento.setSelectionRange(inicio, fin, foco.direccion ?? "none");
  } catch {
    // Algunos tipos de input no permiten seleccion; mantener el foco es suficiente.
  }
}
