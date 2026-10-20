import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

const EDGE_TOLERANCE = 8;
const DRAG_THRESHOLD = 6;

export interface ScrollEdges {
  start: boolean;
  end: boolean;
}

export function useHorizontalScroll<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [edges, setEdges] = useState<ScrollEdges>({ start: true, end: true });
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });

  const updateEdges = useCallback(() => {
    const el = element;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < EDGE_TOLERANCE,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE_TOLERANCE,
    });
  }, [element]);

  useEffect(() => {
    const el = element;
    if (!el) return;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const canScroll = event.deltaY > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth : el.scrollLeft > 0;
      if (!canScroll) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [element, updateEdges]);

  const scrollBy = useCallback(
    (direction: 1 | -1) => element?.scrollBy({ left: direction * element.clientWidth * 0.66, behavior: "smooth" }),
    [element],
  );

  const onPointerDown = (event: PointerEvent<T>) => {
    const el = element;
    if (!el || event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = { active: true, moved: false, startX: event.clientX, startScroll: el.scrollLeft };
  };

  const onPointerMove = (event: PointerEvent<T>) => {
    const el = element;
    const state = drag.current;
    if (!el || !state.active) return;
    const delta = event.clientX - state.startX;
    if (!state.moved && Math.abs(delta) < DRAG_THRESHOLD) return;
    if (!state.moved) {
      state.moved = true;
      el.setPointerCapture(event.pointerId);
      el.style.scrollSnapType = "none";
    }
    el.scrollLeft = state.startScroll - delta;
  };

  const endDrag = (event: PointerEvent<T>) => {
    const el = element;
    if (!el || !drag.current.active) return;
    drag.current.active = false;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    el.style.scrollSnapType = "";
  };

  /** Клик в конце перетаскивания не должен выбирать элемент. */
  const onClickCapture = (event: MouseEvent<T>) => {
    if (!drag.current.moved) return;
    drag.current.moved = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    ref: setElement,
    edges,
    scrollBy,
    handlers: {
      onScroll: updateEdges,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  };
}

/** Маска, растворяющая край ленты под стрелкой (стрелки видны с 640px). */
export function edgeFade({ start, end }: ScrollEdges): string | undefined {
  if (typeof window !== "undefined" && window.innerWidth < 640) return undefined;
  if (start && end) return undefined;
  const left = start ? "black 0" : "transparent 0, transparent 40px, black 110px";
  const right = end ? "black 100%" : "black calc(100% - 130px), transparent calc(100% - 52px)";
  return `linear-gradient(to right, ${left}, ${right})`;
}
