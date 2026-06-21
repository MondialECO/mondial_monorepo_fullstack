# Creator Messenger Audit

## Repository fit

- Route: `src/app/dashboard/creator/messenger/page.tsx`
- Shell: existing dashboard layout and creator sidebar already expose `/dashboard/creator/messenger`.
- Stack: Next.js App Router, React, TypeScript, Tailwind theme tokens, shadcn-style primitives.
- Font: existing `font-sans` maps to Geist through `src/app/globals.css` and `src/styles/fonts.css`.
- Components reused: `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Avatar`, `Progress`.
- Icons: `lucide-react` only.
- Styling rule: component uses theme tokens and Tailwind token utilities only; no component hex colors.

## Stitch pass

- Stitch project: `projects/14970897485447021770`
- Generated screen: `projects/14970897485447021770/screens/71c4f1fa960d4fb7ab0ade1abd20cf2b`
- Design decisions carried into code: compact three-column workspace, dense conversation rail, active thread with NDA and offer cards, provider workroom state, right-side project context, token-based white-card/slate dashboard density.
- Follow-up action-screen Stitch request on role-aware sheets timed out after 120s, so the repo implementation uses the established generated Messenger design DNA and existing shadcn primitives.

## Product decisions

- Messenger is a communication and action workspace, not a generic chat.
- Active thread is tied to a creator project and shows participant role, project status, NDA state, files, offer and next action.
- MVP deal options are Full Buyout Offer and Co-founder / Equity Offer.
- License Offer and Royalty Offer are visible only as disabled future options.
- Sensitive forecast and IP files stay locked until NDA review completes.

## Integration notes

- Current implementation uses local sample data in the page module to keep API replacement straightforward.
- Backend chat contracts already exist in `src/lib/api-chat.ts`, `src/hooks/queries/chat.ts` and `src/types/chat.ts`.
- Next integration step is to extract sample data behind a messenger adapter and connect live conversations without changing the visual shell.
