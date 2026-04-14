---
title: "Security-first blogging on the modern web"
date: "2026-04-10"
excerpt: "Why static Markdown, strict headers, and human review beat flashy CMS defaults."
tags: ["Security", "Web", "Architecture"]
---

## The threat model of a personal site

A personal blog is a small target, but it is still a production surface. Crawlers, scanners, and opportunistic abuse still happen. The goal is not paranoia; the goal is **boring reliability**: predictable rendering, minimal attack surface, and clear separation between **content** and **automation**.

## Static content as the default

Serving pre-rendered HTML from Markdown gives you:

- **No database** in the hot read path for public pages.
- **Simple reviews**: every change is a diff in git.
- **Cache-friendly** responses at the edge.

Dynamic features can be added later, but the public blog should stay easy to reason about.

## Headers are part of the UX

`Content-Security-Policy`, `X-Frame-Options`, and `Referrer-Policy` are not cosmetic. They reduce the blast radius of any future XSS mistake and make life harder for clickjacking and leaky referrers.

Tune CSP carefully: frameworks may need adjustments in development versus production.

## Automation without trust

If you use an LLM to draft posts, treat the model as an **untrusted author**:

- Never publish without a human pass.
- Keep generation behind **shared secrets** and short-lived sessions.
- Prefer server-side calls so keys never ship to browsers.

## Conclusion

The most modern blog is often the simplest one: fast pages, strict defaults, and automation that knows its place.
