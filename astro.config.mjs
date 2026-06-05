// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import pagefind from "astro-pagefind";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// Static-first reference site. React is used only for interactive islands
// (live preview, code copy, theme toggle, search). Everything else is static HTML.
export default defineConfig({
  site: "http://localhost:4321",
  integrations: [react(), pagefind()],
  markdown: {
    // Shiki ships with Astro for build-time syntax highlighting.
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: false,
    },
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: { className: ["heading-anchor"] },
        },
      ],
    ],
  },
});
