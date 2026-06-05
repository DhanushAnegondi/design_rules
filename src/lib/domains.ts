// Domain metadata. The `id` matches the library folder name with its numeric prefix stripped
// (e.g. "01-visual-styles" -> "visual-styles"). `order` drives display order.
//
// `accentHue` is an OKLCH hue used ONLY for a small per-domain accent dot/label — never as a full
// tile background. This keeps the site to one committed palette while still letting a learner tell
// the nine domains apart (see docs/GUIDELINES.md, color rules).

export interface Domain {
  id: string;
  folder: string;
  order: number;
  title: string;
  /** Plain-English, beginner-facing one-liner. */
  blurb: string;
  accentHue: number;
}

export const DOMAINS: Domain[] = [
  {
    id: "visual-styles",
    folder: "01-visual-styles",
    order: 1,
    title: "Visual styles",
    blurb: "The overall look and feel — glass, clay, brutalist, minimal, dark. The skin you put on a page.",
    accentHue: 28,
  },
  {
    id: "scroll-motion",
    folder: "02-scroll-motion",
    order: 2,
    title: "Scroll & motion",
    blurb: "How things move as you scroll or interact — parallax, reveals, sticky sections, smooth scrolling.",
    accentHue: 62,
  },
  {
    id: "layout-systems",
    folder: "03-layout-systems",
    order: 3,
    title: "Layout systems",
    blurb: "How content is arranged on the page — grids, bento, split screens, sidebars, single columns.",
    accentHue: 152,
  },
  {
    id: "component-patterns",
    folder: "04-component-patterns",
    order: 4,
    title: "Component patterns",
    blurb: "The reusable building blocks — navbars, heroes, cards, carousels, modals, footers, forms.",
    accentHue: 196,
  },
  {
    id: "typography-color",
    folder: "05-typography-color",
    order: 5,
    title: "Typography & color",
    blurb: "Choosing and pairing fonts, building type scales, and constructing accessible color systems.",
    accentHue: 256,
  },
  {
    id: "recipes",
    folder: "06-recipes",
    order: 6,
    title: "Recipes",
    blurb: "Complete builds that combine a style, a layout, and behaviors — landing pages, portfolios, dashboards.",
    accentHue: 312,
  },
  {
    id: "backgrounds-effects",
    folder: "07-backgrounds-effects",
    order: 7,
    title: "Backgrounds & effects",
    blurb: "Surface treatments behind your content — gradients, mesh, noise, blur, patterns, spotlight glow.",
    accentHue: 18,
  },
  {
    id: "ui-states-feedback",
    folder: "08-ui-states-feedback",
    order: 8,
    title: "UI states & feedback",
    blurb: "What the interface shows while things happen — loading, empty, error, toasts, steppers, tooltips.",
    accentHue: 96,
  },
  {
    id: "responsive-foundations",
    folder: "09-responsive-foundations",
    order: 9,
    title: "Responsive foundations",
    blurb: "Making it work on every screen — breakpoints, fluid sizing, container queries, touch targets.",
    accentHue: 224,
  },
];

const BY_ID = new Map(DOMAINS.map((d) => [d.id, d]));
const BY_FOLDER = new Map(DOMAINS.map((d) => [d.folder, d]));

export function domainById(id: string): Domain | undefined {
  return BY_ID.get(id);
}

export function domainByFolder(folder: string): Domain | undefined {
  return BY_FOLDER.get(folder);
}

/** "01-visual-styles" -> "visual-styles". Tolerates an already-stripped id. */
export function folderToId(folder: string): string {
  return folder.replace(/^\d+-/, "");
}
