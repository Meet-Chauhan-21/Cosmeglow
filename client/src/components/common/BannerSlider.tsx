import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BannerSlide {
  key: string;
  content: React.ReactNode;
}

interface BannerSliderProps {
  slides: BannerSlide[];
  /** Height classes for the viewport, e.g. "h-[180px] sm:h-[340px]" */
  heightClassName: string;
  autoplayMs?: number;
  pauseOnHover?: boolean;
  showArrows?: boolean;
  ariaLabel?: string;
}

const TRANSITION_MS = 550;

/**
 * Smooth, swipeable, infinitely-looping banner slider.
 * - Slides follow the finger on touch devices (and mouse drag on desktop).
 * - `touch-action: pan-y` lets the page still scroll vertically while
 *   horizontal swipes are handled by the slider.
 * - All slides are mounted once and never re-created, so images load a
 *   single time and stay in memory (no re-loading on every slide change).
 */
export const BannerSlider: React.FC<BannerSliderProps> = ({
  slides,
  heightClassName,
  autoplayMs = 5000,
  pauseOnHover = true,
  showArrows = true,
  ariaLabel = 'Banner carousel'
}) => {
  const count = slides.length;
  const loop = count > 1;

  // `pos` indexes the rendered track: [lastClone, ...slides, firstClone]
  const [pos, setPos] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; dx: number; axis: 'x' | 'y' | null } | null>(null);
  const suppressClickRef = useRef(false);

  // Reset when the number of slides changes (e.g. admin banners arrive).
  // Done during render (React's recommended pattern) instead of in an effect.
  const [prevCount, setPrevCount] = useState(count);
  if (prevCount !== count) {
    setPrevCount(count);
    setAnimate(false);
    setPos(count > 1 ? 1 : 0);
  }

  // Re-enable the transition on the frame after an instant jump
  useEffect(() => {
    if (animate) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [animate]);

  // After sliding onto a clone, silently jump to the real slide
  useEffect(() => {
    if (!loop || (pos !== 0 && pos !== count + 1)) return;
    const t = setTimeout(() => {
      setAnimate(false);
      setPos(pos === 0 ? count : 1);
    }, TRANSITION_MS);
    return () => clearTimeout(t);
  }, [pos, loop, count]);

  const goNext = () => setPos((p) => (p >= count + 1 ? p : p + 1));
  const goPrev = () => setPos((p) => (p <= 0 ? p : p - 1));
  const goTo = (i: number) => setPos(loop ? i + 1 : i);

  // Autoplay (restarts after every manual move)
  useEffect(() => {
    if (!loop || isDragging || (pauseOnHover && isHovered)) return;
    const t = setTimeout(goNext, autoplayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, loop, isDragging, isHovered, pauseOnHover, autoplayMs]);

  // ---- Drag / swipe handling (pointer events cover touch + mouse) ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (!loop) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, axis: null };
    suppressClickRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.axis === 'x') {
        setIsDragging(true);
        try {
          viewportRef.current?.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    }
    if (d.axis === 'x') {
      d.dx = dx;
      suppressClickRef.current = true;
      setDragPx(dx);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (d.axis === 'x') {
      const width = viewportRef.current?.offsetWidth || 1;
      const threshold = Math.min(80, width * 0.15);
      if (d.dx < -threshold) goNext();
      else if (d.dx > threshold) goPrev();
    }
    setDragPx(0);
    setIsDragging(false);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  if (count === 0) return null;

  const track: BannerSlide[] = loop
    ? [
        { key: `__clone-last-${slides[count - 1].key}`, content: slides[count - 1].content },
        ...slides,
        { key: `__clone-first-${slides[0].key}`, content: slides[0].content }
      ]
    : slides;

  const total = track.length;
  const activeIndex = loop ? (pos - 1 + count) % count : 0;

  return (
    <section
      className="relative w-full bg-slate-100 overflow-hidden select-none group/banner"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div
        ref={viewportRef}
        className={`relative w-full overflow-hidden ${heightClassName} ${loop ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="flex h-full will-change-transform"
          style={{
            width: `${total * 100}%`,
            transform: `translate3d(calc(${(-pos * 100) / total}% + ${dragPx}px), 0, 0)`,
            transition: animate && !isDragging ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)` : 'none'
          }}
        >
          {track.map((slide, idx) => {
            const isClone = loop && (idx === 0 || idx === total - 1);
            return (
              <div
                key={slide.key}
                className="relative h-full shrink-0"
                style={{ width: `${100 / total}%` }}
                aria-hidden={isClone || idx !== pos ? true : undefined}
              >
                {slide.content}
              </div>
            );
          })}
        </div>
      </div>

      {showArrows && loop && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-dark shadow-xl items-center justify-center transition-all duration-300 opacity-0 group-hover/banner:opacity-100 cursor-pointer border border-border-gray/30 focus:outline-none focus-visible:opacity-100"
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-dark shadow-xl items-center justify-center transition-all duration-300 opacity-0 group-hover/banner:opacity-100 cursor-pointer border border-border-gray/30 focus:outline-none focus-visible:opacity-100"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>
        </>
      )}

      {loop && (
        <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1.5 rounded-full">
          {slides.map((slide, idx) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer h-1.5 sm:h-2 ${
                activeIndex === idx ? 'w-5 sm:w-6 bg-white' : 'w-1.5 sm:w-2 bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default BannerSlider;
