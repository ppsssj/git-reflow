# git-reflow Web Frontend

This folder now contains the React + TypeScript frontend for the web product.

## Structure

- `Design/`
  Static HTML draft source material. Keep this as reference-only input during migration.
- `src/app/`
  Router and top-level app wiring.
- `src/components/`
  Shared UI and shell components.
- `src/features/auth/`
  Login flow and sign-in presentation.
- `src/features/intro/`
  Landing page for the product story.
- `src/features/templates/`
  Template dashboard, cards, and list-level interactions.
- `src/features/editor/`
  Template editor workspace built around a GitHub preset layout.
- `src/mocks/`
  Temporary data until the backend contract is connected.
- `src/types/`
  Shared frontend domain types.

## Route map

- `/` Intro page
- `/login` Login page
- `/templates` Template dashboard
- `/templates/:templateId` Template editor

## Migration direction

The current editor is intentionally not a blank canvas. It is a structured workspace with:

- left structure panel
- center GitHub preset preview
- right inspector panel

That keeps the UI aligned with the product goal of customizing GitHub layouts rather than designing arbitrary screens.

