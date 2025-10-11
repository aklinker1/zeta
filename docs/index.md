---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Zeta
  text: Aaron's Personal Backend Framework
  tagline: Composable, testable, OpenAPI-first backend framework with validation built-in
  image: ./assets/logo.svg
  actions:
    - theme: brand
      text: Get Started
      link: /get-started

features:
  - icon: ✅
    title: Validation Built-in
    details: Bring your own validation library, as long as it implements the Standard Schema (Zod, Arktypes, etc).
  - icon: 📄
    title: Documentation First
    details: Automatically generate OpenAPI docs using your validation library's schemas.
  - icon: 🧪
    title: Easy to Test
    details: Fast and easy unit, integration, or E2E tests without spinning up the server.
  - icon: 🧩
    title: Composable Design
    details: Zeta apps are built in small, composable, easy-to-test parts.
  - icon: 🤖
    title: Type Safe
    details: Client, server, and tests are all type-safe with no additional boilerplate.
  - icon: ❄️
    title: WinterCG Compatible
    details: Built around a simple server-side fetch function, integrate any compatible frameworks or libraries.
---
