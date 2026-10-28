export const RADR_SPORTS = [
  "AFL",
  "Athletics",
  "Badminton",
  "Baseball",
  "Basketball",
  "Boxing",
  "Cricket",
  "Cross Country",
  "Cycling / BMX",
  "Dance",
  "Football/Soccer",
  "Golf",
  "Gymnastics",
  "Hockey",
  "Martial Arts",
  "Netball",
  "Nippers / Surf Life Saving",
  "Oztag",
  "Rowing",
  "Rugby League",
  "Rugby Union",
  "Sailing",
  "Softball",
  "Swimming",
  "Tennis",
  "Touch Football",
  "Triathlon",
  "Volleyball",
  "Water Polo",
] as const;

export const OTHER_SPORT_VALUE = "__other__";

export type RadrSport = (typeof RADR_SPORTS)[number];

export function isCanonicalSport(
  value: string | null | undefined
): value is RadrSport {
  if (!value) return false;

  return RADR_SPORTS.includes(value as RadrSport);
}

export function normaliseSport(
  value: string | null | undefined
): string {
  return (value || "").trim();
}

export function getAthleteSports(
  primarySport: string | null | undefined,
  otherSports: string[] | null | undefined
): string[] {
  const sports = [
    normaliseSport(primarySport),
    ...(otherSports || []).map(normaliseSport),
  ].filter(Boolean);

  return Array.from(new Set(sports));
}

export function getOtherSports(
  primarySport: string | null | undefined,
  sports: string[] | null | undefined
): string[] {
  const primary = normaliseSport(primarySport);

  return Array.from(
    new Set(
      (sports || [])
        .map(normaliseSport)
        .filter(
          (sport) =>
            Boolean(sport) &&
            sport.toLowerCase() !== primary.toLowerCase()
        )
    )
  );
}