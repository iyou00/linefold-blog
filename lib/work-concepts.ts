export const workConceptVariants = ["orbit", "stacks", "timeline", "fold", "signal"] as const;
export type WorkConceptVariant = (typeof workConceptVariants)[number];

export function selectWorkConcept(seed: string, offset = 0): WorkConceptVariant {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return workConceptVariants[(hash + offset) % workConceptVariants.length];
}
