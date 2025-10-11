import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Zeta",
  description:
    "Composable, testable, OpenAPI-first backend framework with validation built-in",
  themeConfig: {
    siteTitle: "&ensp;Zeta",
    logo: "../assets/favicon.svg",

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Docs", link: "/get-started" },
      { text: "API Reference", link: "https://jsr.io/@aklinker1/zeta/doc" },
    ],

    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Get Started", link: "/get-started" },
          { text: "Adding Routes", link: "/adding-routes" },
          { text: "Validation", link: "/validation" },
          { text: "OpenAPI", link: "/openapi" },
          { text: "Request Life Cycle", link: "/request-life-cycle" },
          { text: "Composing Apps", link: "/composing-apps" },
          { text: "Client Side", link: "/client-side" },
          { text: "Best Practices", link: "/best-practices" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
