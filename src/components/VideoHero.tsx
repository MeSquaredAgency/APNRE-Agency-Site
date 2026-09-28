import { useEffect, useRef, useState, type FormEvent } from 'react';
import Icon from './Icon';
import { HERO_VIDEO } from '../data/media';
import { saveAppraisalAddress } from '../lib/appraisal-handoff';

type Mode = 'sell' | 'lease' | 'agent';

const MODES: { id: Mode; label: string; placeholder: string; submit: string }[] = [
  { id: 'sell', label: 'Sell', placeholder: 'Enter your property address', submit: 'Get an appraisal' },
  { id: 'lease', label: 'Lease', placeholder: 'Enter your property address', submit: 'Get a rental appraisal' },
  { id: 'agent', label: 'Find an agent', placeholder: 'Search by agent name or role', submit: 'Search' },
];

/** Full-bleed looping video with the headline and search over it. The
 *  video is muted, has a pause button (it runs longer than 5 seconds),
 *  and stays on the poster image for anyone who prefers reduced motion. */
export default function VideoHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>('sell');
  const [value, setValue] = useState('');
  const current = MODES.find((m) => m.id === mode)!;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (reduce.matches) video.current?.pause();
    };
    apply();
    reduce.addEventListener('change', apply);
    return () => reduce.removeEventListener('change', apply);
  }, []);

  // The button's state follows the video's own play/pause events (see
  // onPlay/onPause below), so it stays right when the browser blocks
  // autoplay or pauses the video itself, e.g. in low-power mode.
  function togglePlay() {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
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
    window.location.href = `/appraisal/?type=${mode === 'lease' ? 'rental' : 'sales'}`;
  }

  return (
    <section className="video-hero">
      <video
        ref={video}
        className="video-hero__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={HERO_VIDEO.poster}
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={HERO_VIDEO.srcSmall} type="video/mp4" media="(max-width: 900px)" />
        <source src={HERO_VIDEO.src} type="video/mp4" />
      </video>
      <div className="video-hero__scrim" />

      <div className="wrap video-hero__content">
        <h1 className="h-display">
          Adelaide &amp; Mount Gambier
          <br />
          real estate, done properly.
        </h1>
        <p className="video-hero__sub">Sales, leasing and property management from a local team.</p>

        <div className="hero-search">
          <div className="hero-search__modes" role="tablist" aria-label="What would you like to do?">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`hero-tab-${m.id}`}
                aria-selected={mode === m.id}
                aria-controls="hero-search-panel"
                onClick={() => {
                  setMode(m.id);
                  setValue('');
                }}
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
            <input
              id="hero-search-input"
              type={mode === 'agent' ? 'search' : 'text'}
              autoComplete={mode === 'agent' ? 'off' : 'street-address'}
              placeholder={current.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
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

      <button
        type="button"
        className="video-hero__toggle"
        onClick={togglePlay}
        aria-label={playing ? 'Pause background video' : 'Play background video'}
      >
        <Icon name={playing ? 'pause' : 'play'} size={16} />
      </button>
    </section>
  );
}
