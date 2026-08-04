"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicWorkListItem } from "@/lib/works";
import { selectWorkConcept } from "@/lib/work-concepts";
import { WorkConcept } from "./work-concept";

export function WorksBrowser({ works, footer }: { works: PublicWorkListItem[]; footer: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeWork = works[activeIndex];

  return (
    <section className="works-shell">
      <div className="works-copy-column">
        <header className="works-intro">
          <p className="eyebrow">WORKS / SELECTED OUTPUT</p>
          <h1>做过的项目，<br />以及留下的判断。</h1>
          <p>这里收集已经形成完整作品的实践。选择一项，在右侧查看它的 LINEFOLD 概念构图。</p>
          <span>{String(works.length).padStart(2, "0")} SELECTED WORKS</span>
        </header>
        {works.length ? (
          <div className="work-list" role="list" aria-label="作品列表">
            {works.map((work, index) => (
              <Link
                className={index === activeIndex ? "work-item active" : "work-item"}
                href={`/works/${work.slug}`}
                key={work.id}
                role="listitem"
                onPointerEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              >
                <span className="work-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="work-copy"><strong>{work.title}</strong><span>{work.summary}</span></span>
                <span className="work-tags">{work.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</span>
              </Link>
            ))}
          </div>
        ) : <p className="works-empty">第一件作品正在整理中。</p>}
      </div>
      <aside className="work-preview" aria-live="polite">
        {activeWork ? (
          <>
            <div className="work-preview-meta"><span>CONCEPT / {String(activeIndex + 1).padStart(2, "0")}</span><span>{new Date(activeWork.publishedAt).getFullYear()}</span></div>
            <WorkConcept variant={selectWorkConcept(activeWork.slug)} label={activeWork.title} />
            <div className="work-preview-action"><strong>{activeWork.title}</strong><Link href={`/works/${activeWork.slug}`}>VIEW CASE ↗</Link></div>
            {footer}
          </>
        ) : <>
          <div className="work-preview-meta"><span>CONCEPT / 00</span><span>WIP</span></div>
          <WorkConcept variant="fold" label="WORK IN PROGRESS" />
          <div className="work-preview-action"><strong>WORK IN PROGRESS</strong></div>
          {footer}
        </>}
      </aside>
    </section>
  );
}
