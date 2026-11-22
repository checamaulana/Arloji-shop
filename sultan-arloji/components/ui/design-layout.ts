"use client";

import { useEffect, type RefObject } from "react";

export function useChromeSize(ref: RefObject<HTMLElement | null>, edge: "top" | "bottom", offset = 0) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const property = edge === "top" ? "--sticky-top" : "--fixed-bottom";
    const root = document.documentElement;

    function measure() {
      if (!element) return;
      const height = element.offsetHeight;
      if (!height) return;
      const compact = edge === "top" && height > window.innerHeight / 3;
      element.toggleAttribute("data-compact", compact);
      root.style.setProperty(property, `${compact ? 0 : height + offset}px`);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      root.style.removeProperty(property);
    };
  }, [edge, offset, ref]);
}

export function useSheetViewport(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const root = document.documentElement;

    function measure() {
      const visibleViewport = viewport?.scale === 1 ? viewport : null;
      const height = visibleViewport?.height ?? window.innerHeight;
      const bottom = visibleViewport ? Math.max(0, window.innerHeight - visibleViewport.height - visibleViewport.offsetTop) : 0;
      root.style.setProperty("--sheet-height", `${height}px`);
      root.style.setProperty("--sheet-offset", `${bottom}px`);
      root.toggleAttribute("data-short-sheet", height < 34 * parseFloat(getComputedStyle(root).fontSize));
    }

    viewport?.addEventListener("resize", measure);
    viewport?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      viewport?.removeEventListener("resize", measure);
      viewport?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      root.style.removeProperty("--sheet-height");
      root.style.removeProperty("--sheet-offset");
      root.removeAttribute("data-short-sheet");
    };
  }, [open]);
}
