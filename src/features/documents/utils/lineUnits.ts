import type { DocumentLine } from '@/features/documents/types/documents';

export function lineUnitOptions(line: DocumentLine) {
  return [line.mainUnit, line.secondaryUnit].filter(
    (unit): unit is NonNullable<typeof unit> => unit != null,
  );
}

export function lineUnitFactor(line: DocumentLine, unitId: number | null | undefined) {
  if (unitId == null || unitId === line.unitId) {
    return line.conversionFactorSnapshot ?? 1;
  }
  if (unitId === line.mainUnit?.id) {
    return line.secondaryUnitsPerMainUnit ?? 1;
  }
  return 1;
}

export function convertLineQuantity(
  quantity: number,
  line: DocumentLine,
  fromUnitId: number | null | undefined,
  toUnitId: number | null | undefined,
) {
  const fromFactor = lineUnitFactor(line, fromUnitId);
  const toFactor = lineUnitFactor(line, toUnitId);
  return (quantity * fromFactor) / toFactor;
}

export function lineUnitName(line: DocumentLine, unitId: number | null | undefined) {
  return (
    lineUnitOptions(line).find((unit) => unit.id === unitId)?.symbol ??
    line.unitName
  );
}
