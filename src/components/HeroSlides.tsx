// A slow crossfade between photos behind a PageHero (sections.tsx), e.g.
// on /office-space/. Built so it never gets in the way:
//
// - The first photo is the page's main image and loads straight away; the
//   others are only added after the page has loaded, so they don't slow
//   it down, and nothing differs between the pre-rendered page and the
//   browser's first render.
// - It moves on every few seconds only while the hero is on screen and
//   the tab is visible, and never for visitors who've asked for reduced
//   motion (they get the first photo and can step through by hand).
// - A pause button and a dot per photo, since anything that moves by
//   itself for more than five seconds needs a way to stop it.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Icon from './Icon';
import Picture from './Picture';
import type { Photo } from '../lib/photo';

export interface HeroSlide {
  photo: Photo;
  alt: string;
  /** CSS object-position for this photo's crop. */
  focalPoint?: string;
}

/** How long each photo stays up. */
const INTERVAL_MS = 6500;

export default function HeroSlides({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  // False on the pre-rendered page and the first render in the browser.
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const onScreen = useRef(true);

  useEffect(() => {
    setMounted(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPlaying(!reduce.matches);
    // Turning reduced motion on mid-visit stops it.
    const onChange = () => reduce.matches && setPlaying(false);
    reduce.addEventListener('change', onChange);

    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
    });
    if (root.current) observer.observe(root.current);
    return () => {
      reduce.removeEventListener('change', onChange);
      observer.disconnect();
    };
  }, []);

  // A fresh countdown after every change, including one by hand.
  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (onScreen.current && !document.hidden) setActive((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [playing, active, slides.length]);

  return (
    <>
      <div className="hero-slides" ref={root}>
        {slides.map((slide, i) =>
          i === 0 || mounted ? (
            <div
              key={slide.alt}
              className={`hero-slides__slide${i === active ? ' is-active' : ''}`}
              aria-hidden={i === active ? undefined : true}
            >
              <Picture
                photo={slide.photo}
                alt={slide.alt}
                className="page-hero__img"
                style={slide.focalPoint ? ({ objectPosition: slide.focalPoint } as CSSProperties) : undefined}
                priority={i === 0}
              />
            </div>
          ) : null,
        )}
      </div>
      {mounted && slides.length > 1 && (
        <div className="hero-slides__controls" role="group" aria-label="Background photos">
          {slides.map((slide, i) => (
            <button
              key={slide.alt}
              type="button"
              className="hero-slides__dot"
              aria-label={`Photo ${i + 1} of ${slides.length}`}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => setActive(i)}
            />
          ))}
          <button
            type="button"
            className="hero-slides__toggle"
            aria-label={playing ? 'Pause background photos' : 'Play background photos'}
            onClick={() => setPlaying(!playing)}
          >
            <Icon name={playing ? 'pause' : 'play'} size={16} />
          </button>
        </div>
      )}
    </>
  );
}
