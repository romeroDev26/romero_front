/**
 * Fallbacks when the seat-map API fails or returns ambiguous results.
 * Used by useSaleForm (seat-map query) to infer layout from vessel name / known lists.
 */

export function detectVesselTypeFromName(vesselName: string): boolean {
  if (!vesselName) return false;

  const lowerName = vesselName.toLowerCase();

  const keywordsWithoutSeats = [
    "colectivo",
    "combi",
    "bus",
    "ómnibus",
    "lancha colectiva",
    "barco colectivo",
    "embarcación colectiva",
    "transporte colectivo",
    "pasajeros",
    "sin asientos",
    "elección libre",
    "libre",
    "común",
    "compartido",
    "compartida",
    "compartido",
    "turismo",
    "excursión",
    "excursion",
    "viaje grupal",
    "grupo",
    "masivo",
    "masiva",
    "público",
    "pública",
  ];

  const keywordsWithSeats = [
    "asientos",
    "numerados",
    "numerado",
    "asiento",
    "butaca",
    "silla",
    "vip",
    "premium",
    "ejecutivo",
    "primera clase",
    "business",
    "turista plus",
    "económico plus",
  ];

  const hasSeatsKeywords = keywordsWithSeats.some((keyword) =>
    lowerName.includes(keyword)
  );
  if (hasSeatsKeywords) {
    return false;
  }

  const hasNoSeatsKeywords = keywordsWithoutSeats.some((keyword) =>
    lowerName.includes(keyword)
  );
  if (hasNoSeatsKeywords) {
    return true;
  }

  return false;
}

export function detectKnownVesselWithoutSeats(
  vesselId: number,
  vesselName: string
): boolean | null {
  const knownWithoutSeats: Array<{ id: number; name: string }> = [
    { id: 10, name: "embarcacion sin asientos" },
  ];

  const knownWithSeats: Array<{ id: number; name: string }> = [];

  const withoutSeatsMatch = knownWithoutSeats.find(
    (v) =>
      v.id === vesselId || v.name.toLowerCase() === vesselName.toLowerCase()
  );
  if (withoutSeatsMatch) {
    return true;
  }

  const withSeatsMatch = knownWithSeats.find(
    (v) =>
      v.id === vesselId || v.name.toLowerCase() === vesselName.toLowerCase()
  );
  if (withSeatsMatch) {
    return false;
  }

  return null;
}
