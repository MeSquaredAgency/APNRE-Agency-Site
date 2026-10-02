// The handful of line icons the site uses, drawn inline so there's no
// icon font to load. All inherit currentColor.

const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  external: 'M14 5h5v5M19 5l-8 8M18 14v5H5V6h5',
  phone:
    'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  pause: 'M9 5v14M15 5v14',
  play: 'M8 5l11 7-11 7z',
  chevron: 'M6 9l6 6 6-6',
  home: 'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  key: 'M14.5 9.5a4 4 0 1 1-1.2-2.9M13.3 6.6L20 13.3l-2 2-1.5-1.5-1.5 1.5-1.5-1.5M8 16a2 2 0 1 0 0-.01',
  wrench: 'M14.7 6.3a4 4 0 0 0 5 5L17 14l-7 7-3-3 7-7 2.7-2.7a4 4 0 0 1-2-2z',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M17 14.5a6 6 0 0 1 4 5.5',
  tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
  swap: 'M7 7h13l-3-3M17 17H4l3 3',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  bed: 'M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 16h18M6 10V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3',
  bath: 'M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2',
  car: 'M5 17v-5l2-5h10l2 5v5M3 17h18M5 12h14M7 17v2M17 17v2',
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
