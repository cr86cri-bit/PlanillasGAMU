export function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function crearIdentificadorTecnico(valor) {
  return normalizarTexto(valor)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function unirNombreFuncionario(funcionario) {
  return [funcionario?.nombres, funcionario?.apellido_paterno, funcionario?.apellido_materno]
    .filter(Boolean)
    .join(" ");
}
