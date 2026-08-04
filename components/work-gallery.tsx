"use client";
/* eslint-disable @next/next/no-img-element -- External object-storage images have unknown dimensions and are intentionally not proxied. */

import { useEffect, useRef, useState } from "react";
import type { WorkImage } from "@/lib/works";
import { selectWorkConcept, type WorkConceptVariant } from "@/lib/work-concepts";
import { WorkConcept } from "./work-concept";

type GalleryItem = { id: string; caption: string; url?: string; variant?: WorkConceptVariant };

export function WorkGallery({ title, slug, images }: { title: string; slug: string; images: WorkImage[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const usingDefaults = images.length === 0;
  const items: GalleryItem[] = usingDefaults
    ? [
        { id: "concept-structure", caption: "CONCEPT PREVIEW / 结构示意", variant: selectWorkConcept(slug) },
        { id: "concept-interface", caption: "CONCEPT PREVIEW / 界面示意", variant: selectWorkConcept(slug, 2) },
      ]
    : images.map((image) => ({ id: image.id, caption: image.caption || title, url: image.url }));

  function open(index: number) {
    setActiveIndex(index);
    dialogRef.current?.showModal();
  }

  function move(step: number) {
    setActiveIndex((current) => (current + step + items.length) % items.length);
  }

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (!dialogRef.current?.open) return;
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current - 1 + items.length) % items.length);
      if (event.key === "ArrowRight") setActiveIndex((current) => (current + 1) % items.length);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [items.length]);

  const activeItem = items[activeIndex];
  return (
    <section className="case-gallery" aria-label="作品图片">
      <header className="case-gallery-head"><p>{usingDefaults ? "CONCEPT PREVIEW / 内置示意图" : "IMAGES / 图片组"}</p><span>{String(items.length).padStart(2, "0")} {usingDefaults ? "DEFAULT" : "IMAGES"}</span></header>
      <div className="case-gallery-grid">
        {items.map((item, index) => (
          <button type="button" className="gallery-item" key={item.id} onClick={() => open(index)} aria-label={`查看大图：${item.caption}`}>
            <span className="gallery-frame">{item.url ? <img src={item.url} alt={item.caption} loading="lazy" referrerPolicy="no-referrer" /> : <WorkConcept compact variant={item.variant!} label={title} />}<span className="gallery-hover">VIEW ↗</span></span>
            <span className="gallery-caption"><span>{item.caption}</span><span>{String(index + 1).padStart(2, "0")}</span></span>
          </button>
        ))}
      </div>

      <dialog className="lightbox-dialog" ref={dialogRef} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
        <div className="lightbox-shell">
          <header className="lightbox-head"><p>IMAGE PREVIEW</p><span>{String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span><button type="button" aria-label="关闭大图" onClick={() => dialogRef.current?.close()}>×</button></header>
          <div className="lightbox-stage">{activeItem.url ? <img src={activeItem.url} alt={activeItem.caption} referrerPolicy="no-referrer" /> : <WorkConcept variant={activeItem.variant!} label={title} />}</div>
          <footer className="lightbox-foot"><p>{activeItem.caption}</p><div><button type="button" onClick={() => move(-1)}>← PREV</button><button type="button" onClick={() => move(1)}>NEXT →</button></div></footer>
        </div>
      </dialog>
    </section>
  );
}
