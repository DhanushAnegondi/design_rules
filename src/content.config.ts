import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The `concepts` collection loads every concept .md file from the library.
 * Pattern `*\/*.md` matches files exactly one level deep inside domain folders,
 * which excludes the root INDEX.md/README.md/_*.md/_TEMPLATE.md etc.
 * Negation patterns further exclude review files and underscore-prefixed files.
 *
 * The library content is vendored into `./library` so this repo is fully
 * self-contained and builds/deploys anywhere without external paths.
 *
 * The resulting entry `id` is like "01-visual-styles/glassmorphism".
 * Frontmatter is empty on all library files — metadata lives in the body as
 * `**Key:** value` lines, parsed by parse-library.ts.
 */
const concepts = defineCollection({
  loader: glob({
    pattern: ["*/*.md", "!**/*.review.md", "!**/_*.md"],
    base: "./library",
  }),
});

export const collections = { concepts };
