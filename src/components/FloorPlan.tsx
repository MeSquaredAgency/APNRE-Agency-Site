// The Level 1 floor plan on /office-space/, drawn from the room data in
// src/data/office-space.ts so it always matches what's bookable. Available
// offices and the podcast room are buttons: choosing one selects it in
// the booking form below.
//
// Drawn twice from the same data: on its side across the page on wide
// screens, and upright (as the original drawing is) on phones, where a
// sideways plan would be too small to tap. CSS shows one at a time.

import type { KeyboardEvent } from 'react';
import { PLAN_ENTRY, PLAN_OUTLINE, PLAN_SIZE, PLAN_STREETS, ROOMS, type Room } from '../data/office-space';
import { formatDate } from '../lib/bookings';

type Orientation = 'landscape' | 'portrait';
type Point = [number, number];

/** Plan units to this orientation's units. Landscape turns the drawing
 *  a quarter turn anticlockwise. */
function place([x, y]: Point, o: Orientation): Point {
  return o === 'portrait' ? [x, y] : [y, PLAN_SIZE.width - x];
}

function corners(room: Room): Point[] {
  if ('poly' in room.plan) return room.plan.poly;
  const [x1, y1, x2, y2] = room.plan.rect;
  return [
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ];
}

const points = (pts: Point[], o: Orientation) => pts.map((p) => place(p, o).join(',')).join(' ');

/** Where a room's label goes, and how wide it can be. A rectangle is
 *  labelled in the middle, across its full width. An L-shaped room
 *  (`labelAt`) isn't that wide everywhere, so its label is kept to half
 *  the overall width, which fits the narrower arm. */
function labelBox(room: Room, o: Orientation): { width: number; at: Point } {
  const pts = corners(room).map((p) => place(p, o));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const width = Math.max(...xs) - Math.min(...xs);
  if (room.labelAt) return { width: width / 2, at: place(room.labelAt, o) };
  return { width, at: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] };
}

type Kind = 'available' | 'occupied' | 'podcast' | 'shared' | 'service';

function kindOf(room: Room): Kind {
  if (room.use === 'podcast') return 'podcast';
  if (room.use === 'shared' || room.use === 'service') return room.use;
  return room.status === 'available' ? 'available' : 'occupied';
}

function subLabel(room: Room): string {
  switch (kindOf(room)) {
    case 'available':
      return room.size ? `${room.size[0]} × ${room.size[1]}` : 'Available';
    case 'occupied':
      return 'Occupied';
    case 'podcast':
      return 'Daily hire';
    default:
      return '';
  }
}

/** What a screen reader hears for a room button. */
function spoken(room: Room): string {
  if (room.use === 'podcast') return `${room.name}, hired for 2 hours, a half day or a full day`;
  const size = room.size ? `, ${room.size[0]} by ${room.size[1]} metres` : '';
  const when = room.availableFrom ? `available from ${formatDate(room.availableFrom, { day: 'numeric', month: 'long' })}` : 'available';
  return `${room.name}${size}, ${when}`;
}

interface FloorPlanProps {
  /** The selected room's id. */
  selected: string;
  onSelect: (room: Room) => void;
}

function PlanDrawing({ selected, onSelect, o }: FloorPlanProps & { o: Orientation }) {
  // Text sizes in plan units, so each orientation reads at about 12px
  // at the size it's shown.
  const fs = o === 'landscape' ? 20 : 26;
  const charWidth = 0.58;
  const fits = (text: string, size: number, width: number) => text.length * size * charWidth <= width - 12;

  const { width, height } = PLAN_SIZE;
  const viewBox = o === 'landscape' ? `-16 -64 ${height + 80} ${width + 80}` : `-16 -16 ${width + 112} ${height + 80}`;
  const hatch = `plan-hatch-${o}`;
  const [ex, ey] = place([PLAN_ENTRY.x, PLAN_ENTRY.y], o);

  return (
    <svg
      className={`plan__svg plan__svg--${o}`}
      viewBox={viewBox}
      role="group"
      aria-label="Floor plan of Level 1, 420B Main North Road, Blair Athol"
    >
      <defs>
        <pattern id={hatch} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" className="plan__hatch-bg" />
          <line x1="0" y1="0" x2="0" y2="14" className="plan__hatch-line" />
        </pattern>
      </defs>

      <polygon points={points(PLAN_OUTLINE, o)} className="plan__outline" />

      {ROOMS.map((room) => {
        const kind = kindOf(room);
        const interactive = kind === 'available' || kind === 'podcast';
        const isSelected = room.id === selected;
        const { width: w, at } = labelBox(room, o);
        const name = fits(room.name, fs, w) ? room.name : room.short;
        const sub = subLabel(room);
        const showSub = sub && fits(sub, fs * 0.78, w);
        const select = () => onSelect(room);
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            select();
          }
        };
        return (
          <g
            key={room.id}
            className={`plan__room plan__room--${kind}${isSelected ? ' is-selected' : ''}`}
            {...(interactive
              ? { role: 'button', tabIndex: 0, 'aria-pressed': isSelected, 'aria-label': spoken(room), onClick: select, onKeyDown }
              : {})}
          >
            <polygon
              points={points(corners(room), o)}
              className="plan__shape"
              style={kind === 'podcast' && !isSelected ? { fill: `url(#${hatch})` } : undefined}
            />
            <text x={at[0]} y={at[1]} className="plan__label" fontSize={fs} aria-hidden={interactive || undefined}>
              <tspan x={at[0]} dy={showSub ? -fs * 0.15 : fs * 0.35}>
                {name}
              </tspan>
              {showSub && (
                <tspan x={at[0]} dy={fs * 1.05} className="plan__label-sub" fontSize={fs * 0.78}>
                  {sub}
                </tspan>
              )}
            </text>
          </g>
        );
      })}

      {/* The streets outside: along the bottom and the right of the
          upright drawing, the right and the top of the sideways one. */}
      <g className="plan__street" aria-hidden="true" fontSize={fs * 0.72}>
        {o === 'portrait' ? (
          <>
            <text x={(340 + width) / 2} y={height + 48}>
              {PLAN_STREETS.south}
            </text>
            <text x={width + 64} y={800} transform={`rotate(90 ${width + 64} 800)`}>
              {PLAN_STREETS.east}
            </text>
          </>
        ) : (
          <>
            <text x={height + 48} y={(width - 340) / 2} transform={`rotate(90 ${height + 48} ${(width - 340) / 2})`}>
              {PLAN_STREETS.south}
            </text>
            <text x={800} y={-32}>
              {PLAN_STREETS.east}
            </text>
          </>
        )}
      </g>

      {/* The front door, with an arrow pointing in. */}
      <g className="plan__entry" aria-hidden="true">
        {o === 'portrait' ? (
          <>
            <path d={`M${ex + 70} ${ey} H${ex + 8} M${ex + 24} ${ey - 14} L${ex + 8} ${ey} L${ex + 24} ${ey + 14}`} />
            <text x={ex + 40} y={ey - 24} fontSize={fs * 0.8} textAnchor="middle">
              Entry
            </text>
          </>
        ) : (
          <>
            <path d={`M${ex} ${ey - 52} V${ey - 8} M${ex - 14} ${ey - 24} L${ex} ${ey - 8} L${ex + 14} ${ey - 24}`} />
            <text x={ex + 22} y={ey - 30} fontSize={fs * 0.8} textAnchor="start">
              Entry
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

export default function FloorPlan(props: FloorPlanProps) {
  return (
    <div className="plan">
      <PlanDrawing {...props} o="landscape" />
      <PlanDrawing {...props} o="portrait" />
      <ul className="plan__legend" aria-label="Key">
        <li>
          <span className="plan__swatch plan__swatch--available" /> Available office
        </li>
        <li>
          <span className="plan__swatch plan__swatch--podcast" /> Podcast room
        </li>
        <li>
          <span className="plan__swatch plan__swatch--shared" /> Shared space
        </li>
        <li>
          <span className="plan__swatch plan__swatch--occupied" /> Occupied
        </li>
      </ul>
    </div>
  );
}
