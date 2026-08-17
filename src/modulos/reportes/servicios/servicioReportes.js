import { configuracionEntorno } from "../../../nucleo/configuracion/entorno.js";
import { seleccionarRegistros } from "../../../nucleo/datos/servicioDatos.js";
import { consultarAsistenciaIndividual } from "../../asistencia/servicios/servicioAsistencia.js";

export async function generarReportePdf({ carnetIdentidad, anio, mes }) {
  const [{ jsPDF }, resultado, configuracionReporte] = await Promise.all([
    import("jspdf"),
    consultarAsistenciaIndividual({ carnetIdentidad, anio, mes }),
    obtenerConfiguracionReporte(),
  ]);

  if (!resultado.funcionario) {
    throw new Error("No se puede generar PDF porque el funcionario no fue encontrado.");
  }

  const documento = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const margen = 46;
  let posicionY = 52;

  documento.setFont("helvetica", "bold");
  documento.setFontSize(13);
  documento.text("GOBIERNO AUTÓNOMO MUNICIPAL DE UYUNI", margen, posicionY);
  posicionY += 18;
  documento.text("REPORTE INDIVIDUAL DE ASISTENCIA", margen, posicionY);
  posicionY += 28;

  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);
  const funcionario = resultado.funcionario;
  const lineasCabecera = [
    `Nombre: ${funcionario.nombre_completo}`,
    `CI: ${funcionario.carnet_identidad}`,
    `Cargo: ${funcionario.cargos?.nombre ?? "Sin cargo"}`,
    `Unidad: ${funcionario.unidades?.nombre ?? "Sin unidad"}`,
    `Periodo: ${String(mes).padStart(2, "0")}/${anio}`,
  ];

  lineasCabecera.forEach((linea) => {
    documento.text(linea, margen, posicionY);
    posicionY += 14;
  });

  posicionY += 12;
  documento.setFont("helvetica", "bold");
  documento.text("Detalle diario", margen, posicionY);
  posicionY += 16;
  documento.setFont("helvetica", "normal");

  resultado.asistencias.forEach((asistencia) => {
    if (posicionY > 690) {
      documento.addPage();
      posicionY = 52;
    }

    documento.text(
      `${asistencia.fecha} | ${asistencia.estado} | atraso ${asistencia.minutos_atraso ?? 0} min | extra ${asistencia.minutos_hora_extra ?? 0} min | tolerancia ${asistencia.tolerancia_horas_extra ?? 0} min | omisiones ${asistencia.cantidad_omisiones ?? 0} | faltas ${asistencia.cantidad_faltas ?? 0}`,
      margen,
      posicionY,
    );
    posicionY += 13;
  });

  posicionY += 18;
  documento.setFont("helvetica", "bold");
  documento.text("Totales", margen, posicionY);
  posicionY += 14;
  documento.setFont("helvetica", "normal");
  documento.text(`Retrasos: ${resultado.totales.cantidad_atrasos}`, margen, posicionY);
  posicionY += 13;
  documento.text(
    `Tiempo total de atraso: ${resultado.totales.minutos_atraso} minutos`,
    margen,
    posicionY,
  );
  posicionY += 13;
  documento.text(`Omisiones: ${resultado.totales.cantidad_omisiones}`, margen, posicionY);
  posicionY += 13;
  documento.text(`Faltas: ${resultado.totales.cantidad_faltas}`, margen, posicionY);
  posicionY += 13;
  documento.text(
    `Horas extra calculadas: ${resultado.totales.minutos_hora_extra} minutos`,
    margen,
    posicionY,
  );
  posicionY += 13;
  documento.text(
    `Tolerancia aplicada por horas extra: ${resultado.totales.tolerancia_horas_extra} minutos`,
    margen,
    posicionY,
  );

  posicionY = Math.max(posicionY + 60, 690);
  documento.line(margen, posicionY, margen + 210, posicionY);
  posicionY += 14;
  documento.text(`Responsable: ${configuracionReporte.responsableNombre}`, margen, posicionY);
  posicionY += 13;
  documento.text(`Cargo: ${configuracionReporte.responsableCargo}`, margen, posicionY);
  documento.setProperties({
    title: `Reporte individual ${funcionario.carnet_identidad}`,
    subject: configuracionEntorno.nombreInstitucional,
  });

  documento.save(`reporte-asistencia-${funcionario.carnet_identidad}-${anio}-${mes}.pdf`);
  return resultado;
}

async function obtenerConfiguracionReporte() {
  const data = await seleccionarRegistros({
    tabla: "configuraciones_sistema",
    columnas: "clave,valor",
    filtrosIn: { clave: ["responsable_reporte_nombre", "responsable_reporte_cargo"] },
  });
  const mapa = new Map((data ?? []).map((fila) => [fila.clave, fila.valor]));

  return {
    responsableNombre: mapa.get("responsable_reporte_nombre") ?? "Pendiente de configurar",
    responsableCargo: mapa.get("responsable_reporte_cargo") ?? "Pendiente de configurar",
  };
}
