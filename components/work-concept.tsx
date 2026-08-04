import type { WorkConceptVariant } from "@/lib/work-concepts";

export function WorkConcept({ variant, label, compact = false }: { variant: WorkConceptVariant; label: string; compact?: boolean }) {
  return (
    <div className={`work-concept concept-${variant}${compact ? " compact" : ""}`} aria-label={`${label} 概念构图`} role="img">
      <span className="concept-grid" aria-hidden="true" />
      <span className="concept-box concept-box-a" aria-hidden="true" />
      <span className="concept-box concept-box-b" aria-hidden="true" />
      <span className="concept-box concept-box-c" aria-hidden="true" />
      <span className="concept-circle concept-circle-a" aria-hidden="true" />
      <span className="concept-circle concept-circle-b" aria-hidden="true" />
      <span className="concept-path" aria-hidden="true" />
      <span className="concept-node concept-node-a" aria-hidden="true" />
      <span className="concept-node concept-node-b" aria-hidden="true" />
      <span className="concept-caption" aria-hidden="true">LINEFOLD / {label.toUpperCase()}</span>
    </div>
  );
}
