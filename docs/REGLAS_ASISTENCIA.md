# Reglas de asistencia

## Prioridad de horario

1. Excepcion temporal.
2. Horario individual.
3. Horario de unidad.
4. Horario general.

## Calculo diario

Para cada funcionario y dia:

1. Determinar si el dia es laboral.
2. Revisar feriados aplicables.
3. Revisar excepciones justificadas.
4. Obtener horario vigente.
5. Leer marcaciones originales.
6. Clasificar marcas contra slots esperados.
7. Conservar marcas adicionales.
8. Calcular atrasos y omisiones.
9. Aplicar tolerancia normal.
10. Aplicar tolerancia por horas extra si corresponde.
11. Registrar explicacion auditable.

## Faltas y omisiones

- Cero marcaciones en dia laboral esperado: `FALTA`.
- Una falta no suma omisiones adicionales.
- Si existen marcaciones pero faltan slots obligatorios: `OMISION`.
- La cantidad de omisiones equivale a slots obligatorios sin marca.

## Horas extra

Una hora extra aprobada otorga 30 minutos de tolerancia solo al siguiente dia laboral aplicable. Si el dia siguiente es feriado o no laboral, la regla predeterminada traslada el beneficio al siguiente dia laboral.

## Importacion Excel

No se confia en la columna `Estado` para clasificar entrada o salida. La clasificacion usa funcionario, fecha, hora, horario vigente y ventanas de cada slot.

Las fechas sin zona horaria se interpretan como hora local `America/La_Paz`.
