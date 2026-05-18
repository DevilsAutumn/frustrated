# Design

## Theme

Scene: a developer is in an evening build session with a browser and terminal side by side, checking whether web, CLI, and MCP actions all produce public feedback. The interface is dark-only, quiet, and ledger-like so posts can be scanned without feeling like a neon incident dashboard.

## Color

Use Tailwind utilities with a restrained dark product palette: zinc neutrals, one emerald/pine action accent, and a small amber/ember accent for frustration intensity.

- Background: zinc 950, dark-only.
- Surface: zinc 950/900 panels with zinc 800 borders.
- Text: zinc 100 primary, zinc 400/500 secondary.
- Accent: emerald for primary actions, selection, and focus.
- Heat: amber for intensity and destructive-adjacent emphasis.
- Signal: muted lime for tags and small metadata highlights.

## Typography

Use one system sans stack. Keep product type fixed, compact, and readable. Headings should feel like section labels in a tool, not marketing hero text.

## Layout

Use a two-column workbench on desktop: setup and publishing controls on the left, public ledger on the right. Collapse into a single column on mobile. Prefer bands, rails, and repeated feed entries over decorative card grids.

## Components

Buttons, inputs, range controls, token boxes, command snippets, metric cells, feed entries, reactions, and empty states share the same 8px radius vocabulary. Focus states use the emerald accent. Styling lives in Tailwind utility classes and local React UI primitives, not hand-written CSS selectors.

## Motion

Keep transitions under 180ms, easing out. Use motion only for hover, focus, and small state feedback.
