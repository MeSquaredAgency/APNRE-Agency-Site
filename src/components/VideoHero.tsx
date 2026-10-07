import { useEffect, useRef, useState, type FormEvent } from 'react';
import Icon from './Icon';
import AddressInput from './AddressInput';
import { HERO_VIDEO } from '../data/media';
import { saveAppraisalAddress } from '../lib/appraisal-handoff';

type Mode = 'sell' | 'lease' | 'agent';

const MODES: { id: Mode; label: string; placeholder: string; submit: string }[] = [
  { id: 'sell', label: 'Sell', placeholder: 'Your property’s address', submit: 'Get an Appraisal' },
  { id: 'lease', label: 'Lease', placeholder: 'Your property’s address', submit: 'Get a Rental Appraisal' },
  { id: 'agent', label: 'Find an agent', placeholder: 'Agent name, role or office', submit: 'Search' },
];

/** Whether the browser has asked sites to use less data (Chrome's
 *  "Lite mode", some Android data savers). Not in TS's DOM types yet. */
function saveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/** Full-bleed looping video with the headline and search over it.
 *
 *  The pre-rendered HTML carries only the poster image, so it shows
 *  straight away. The video file is chosen after the page loads (720p on
 *  narrow screens, 1080p otherwise) and skipped entirely for anyone who
 *  prefers reduced motion or has asked to save data, who keep the
 *  poster. The video is muted and has a pause button, since it runs
 *  longer than 5 seconds. */
export default function VideoHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>('sell');
  const [value, setValue] = useState('');
  const current = MODES.find((m) => m.id === mode)!;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!reduce.matches && !saveData()) {
      setSrc(window.matchMedia('(max-width: 900px)').matches ? HERO_VIDEO.srcSmall : HERO_VIDEO.src);
    }
    // Turning reduced motion on mid-visit pauses it.
    const onChange = () => {
      if (reduce.matches) video.current?.pause();
    };
    reduce.addEventListener('change', onChange);
    return () => reduce.removeEventListener('change', onChange);
  }, []);

  // Pause while the hero is scrolled out of view, to save battery and
  // decoding, and pick up again when it's back, unless reduced motion was
  // turned on in the meantime.
  useEffect(() => {
    const v = video.current;
    if (!src || !v || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) v.pause();
      else if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) void v.play().catch(() => undefined);
    });
    observer.observe(v);
    return () => observer.disconnect();
  }, [src]);

  // The button's state follows the video's own play/pause events (see
  // onPlay/onPause below), so it stays right when the browser blocks
  // autoplay or pauses the video itself, e.g. in low-power mode.
  function togglePlay() {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }

  function choose(next: Mode) {
    setMode(next);
    setValue('');
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (mode === 'agent') {
      window.location.href = `/our-people/${text ? `?q=${encodeURIComponent(text)}` : ''}`;
      return;
    }
    // The address travels in session storage, never the URL.
    if (text) saveAppraisalAddress(text);
    window.location.href = mode === 'lease' ? '/appraisal/rental/' : '/appraisal/sales/';
  }

  return (
    <section className="video-hero">
      {/* The poster is a real image under the video rather than the
          video's poster attribute, so phones get a smaller copy. It's the
          page's largest image, preloaded in scripts/build-pages.mjs. */}
      <picture className="video-hero__poster">
        <source type="image/webp" srcSet={HERO_VIDEO.posterSrcSet} sizes="100vw" />
        <img
          src={HERO_VIDEO.poster}
          alt=""
          width={1600}
          height={900}
          decoding="async"
          {...{ fetchpriority: 'high' }}
        />
      </picture>
      <video
        ref={video}
        className="video-hero__video"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="video-hero__scrim" />

      <div className="wrap video-hero__content">
        {/* The two towns are named here, for local search. Phones get
            "SA" so the label stays on one line. */}
        <p className="eyebrow video-hero__eyebrow">
          {/* One span, so the eyebrow's flex gap doesn't split the words. */}
          <span>
            Adelaide · Mount Gambier · <span className="video-hero__long">South Australia</span>
            <span className="video-hero__short">SA</span>
          </span>
        </p>
        <h1 className="h-display">
          {/* The space matters: phones hide the <br> (index.css), and
              without it the words would run together. */}
          South Australian real estate,{' '}
          <br />
          done properly.
        </h1>
        <p className="video-hero__sub">Sales, leasing and property management from a local team.</p>

        <div className="hero-search">
          {/* ARIA tabs: only the selected tab is in the Tab order, and
              Left/Right/Home/End move between them. */}
          <div
            className="hero-search__modes"
            role="tablist"
            aria-label="What would you like to do?"
            onKeyDown={(e) => {
              const i = MODES.findIndex((m) => m.id === mode);
              const next =
                e.key === 'ArrowRight' ? (i + 1) % MODES.length
                : e.key === 'ArrowLeft' ? (i - 1 + MODES.length) % MODES.length
                : e.key === 'Home' ? 0
                : e.key === 'End' ? MODES.length - 1
                : -1;
              if (next < 0) return;
              e.preventDefault();
              choose(MODES[next].id);
              document.getElementById(`hero-tab-${MODES[next].id}`)?.focus();
            }}
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`hero-tab-${m.id}`}
                aria-selected={mode === m.id}
                aria-controls="hero-search-panel"
                tabIndex={mode === m.id ? 0 : -1}
                onClick={() => choose(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <form
            id="hero-search-panel"
            role="tabpanel"
            aria-labelledby={`hero-tab-${mode}`}
            className="hero-search__bar"
            onSubmit={submit}
          >
            <Icon name="search" />
            <label htmlFor="hero-search-input" className="visually-hidden">
              {current.placeholder}
            </label>
            {mode === 'agent' ? (
              <input
                id="hero-search-input"
                type="search"
                autoComplete="off"
                placeholder={current.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              // Google address suggestions when a Maps key is set. Keyed
              // by tab so switching between Sell and Lease starts empty.
              <AddressInput
                key={mode}
                id="hero-search-input"
                autoComplete="street-address"
                placeholder={current.placeholder}
                onChange={setValue}
                tone="dark"
              />
            )}
            <button type="submit" className="btn btn-light">
              {current.submit}
            </button>
          </form>
        </div>

        <div className="video-hero__links">
          <a href="/buy/">
            Properties for sale <Icon name="arrow" size={16} />
          </a>
          <a href="/rent/">
            Properties for rent <Icon name="arrow" size={16} />
          </a>
        </div>
      </div>

      {/* Only once a video is loaded: with just the poster there's
          nothing to pause. */}
      {src && (
        <button
          type="button"
          className="video-hero__toggle"
          onClick={togglePlay}
          aria-label={playing ? 'Pause background video' : 'Play background video'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={16} />
        </button>
      )}
    </section>
  );
}
