// src/components/icons.jsx
import { h } from "preact";

/** Base icon (outline homogéneo) */
const Icon = ({ size = 24, color = "currentColor", stroke = 1.8, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

/** Calendario (card raíz) */
export const Calendar = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M7 2.5v4M17 2.5v4M3 9h18" />
    <path d="M7.5 12h3M13.5 12h3M7.5 16h3M13.5 16h3" />
  </Icon>
);

/** Trofeo (card raíz) */
export const Trophy = (p) => (
  <Icon {...p}>
    <path d="M8 4h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V4z" />
    <path d="M16 7h3a3 3 0 0 1-3 3M8 7H5a3 3 0 0 0 3 3" />
    <path d="M12 11v4M9 20h6M10 18h4" />
  </Icon>
);

/** Xogador rematando (card raíz Xogar) */
export const PlayerShot = (p) => (
  <Icon {...p}>
    {/* cabeza */}
    <circle cx="9.2" cy="5.1" r="2.1" />
    {/* torso */}
    <path d="M9.2 7.4L12.6 10.8" />
    {/* brazos */}
    <path d="M11.2 9.2l3.2-1.4" />
    <path d="M9.6 9.4L7.2 8.6" />
    {/* perna apoio */}
    <path d="M12.6 10.8L10.8 16.6" />
    {/* perna remate */}
    <path d="M12.6 10.8L16.2 12.4" />
    <path d="M16.2 12.4L18.0 13.6" />
    {/* balón afastado */}
    <circle cx="20.1" cy="13.2" r="2.0" />
  </Icon>
);

/** Subcards Calendario */
export const CalendarClock = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="12" height="10" rx="2" />
    <path d="M6 2.5v3M12 2.5v3M3 8.5h12" />
    <circle cx="18.5" cy="14.5" r="4" />
    <path d="M18.5 12.5v2l1.4 1" />
  </Icon>
);
export const CalendarChevrons = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="12" height="10" rx="2" />
    <path d="M6 2.5v3M12 2.5v3M3 8.5h12" />
    <path d="M18 8l3 3-3 3M15 8l3 3-3 3" />
  </Icon>
);
export const CalendarCheck = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="12" height="10" rx="2" />
    <path d="M6 2.5v3M12 2.5v3M3 8.5h12" />
    <path d="M16 14l2 2 3-3" />
  </Icon>
);

/** Subcards Xogar */
export const Clipboard = (p) => (
  <Icon {...p}>
    <rect x="6.5" y="5.5" width="11" height="14" rx="2" />
    <path d="M9 5.5h6" />
    <path d="M9 9.5h6M9 12.5h6M9 15.5h6" />
  </Icon>
);
export const Pitch = (p) => (
  <Icon {...p}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M12 5v14" />
    <circle cx="12" cy="12" r="2" />
  </Icon>
);
export const Shirt = (p) => (
  <Icon {...p}>
    <path d="M7 5l2-2h6l2 2 2 2v12H5V7z" />
    <path d="M10 7v4M14 7v4" />
  </Icon>
);
export const Book = (p) => (
  <Icon {...p}>
    <path d="M4.5 5.5h10a2.5 2.5 0 012.5 2.5v10h-10A2.5 2.5 0 014.5 15V5.5z" />
    <path d="M7.5 8.5h7M7.5 11.5h7" />
  </Icon>
);

/** Subcards Clasificacións */
export const Target = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="6" />
    <path d="M12 12l3-3" />
    <path d="M15 9l2 2" />
  </Icon>
);
export const Bars = (p) => (
  <Icon {...p}>
    <path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" />
  </Icon>
);

/** NavBar / actions */
export const ArrowLeft = (p) => (
  <Icon {...p}>
    <path d="M4 12h16" />
    <path d="M10 6l-6 6 6 6" />
  </Icon>
);
export const Bell = (p) => (
  <Icon {...p}>
    <path d="M12 3a5 5 0 00-5 5v2.5c0 .7-.27 1.37-.75 1.87L5 14h14l-1.25-1.63A2.5 2.5 0 0117 10.5V8a5 5 0 00-5-5z" />
    <path d="M9.5 18a2.5 2.5 0 005 0" />
  </Icon>
);
export const UserCircle = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M4.5 19.5a7.5 7.5 0 0115 0" />
  </Icon>
);
export const CloseX = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
