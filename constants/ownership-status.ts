export const LICENSE_TYPES = [
  "exclusive",
  "non-exclusive",
  "basic",
] as const;

export type LicenseType = typeof LICENSE_TYPES[number];
