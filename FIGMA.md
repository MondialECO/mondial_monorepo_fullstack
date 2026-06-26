# FIGMA.md — Mondial.Client × Figma MCP Bridge

Read this file whenever a Figma URL, frame, or `mcp__*figma*` tool is in play.
It tells Claude how to translate Figma → code that obeys the rules in `CLAUDE.md`.

> Hard rule: this file extends `CLAUDE.md`. If anything here conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

---

## Workflow when given a Figma URL

1. Extract `fileKey` and `nodeId` from the URL (`figma.com/design/:fileKey/...?node-id=1-2` → `nodeId="1:2"`).
2. Call `get_code_connect_map` first — if the node is already mapped, just import that component. Don't regenerate JSX.
3. If unmapped, call `get_design_context` (or `use_figma`) for layout + tokens.
4. Call `get_variable_defs` to resolve any non-token values to our theme vars (don't paste raw hex).
5. Generate code following the rules below, then save Code Connect mapping back via `add_code_connect_map` if it's a reusable component.

---

## Theme tokens (source: `src/app/globals.css`)

Map Figma variables → these CSS vars. **Never** emit raw hex in components.

| Figma role | CSS var | Tailwind class |
|---|---|---|
| Page background | `--background` | `bg-background` |
| Body text | `--foreground` | `text-foreground` |
| Surface / card | `--card` | `bg-card` `text-card-foreground` |
| Popover / menu | `--popover` | `bg-popover` `text-popover-foreground` |
| Brand / primary | `--primary` (`#3C50E0` light, `#818CF8` dark) | `bg-primary` `text-primary-foreground` |
| Secondary | `--secondary` | `bg-secondary` `text-secondary-foreground` |
| Muted surface / placeholder | `--muted` / `--muted-foreground` | `bg-muted` `text-muted-foreground` |
| Accent (hover surface) | `--accent` | `bg-accent` `text-accent-foreground` |
| Destructive / error | `--destructive` | `bg-destructive` `text-white` |
| Border | `--border` | `border-border` |
| Input border | `--input` | `border-input` |
| Focus ring | `--ring` | `ring-ring` `focus-visible:ring-ring/50` |
| Sidebar surface | `--sidebar` | `bg-sidebar` `text-sidebar-foreground` |
| Sidebar active item | `--sidebar-primary` | `bg-sidebar-primary text-sidebar-primary-foreground` |
| Sidebar hover | `--sidebar-accent` | `bg-sidebar-accent` |
| Charts (5 slots) | `--chart-1` … `--chart-5` | `text-chart-1`, etc. |

If a Figma color doesn't fit any of the above, ADD a token to BOTH `:root` and `.dark` blocks in `globals.css`. Never inline.

### Radius scale
`--radius: 0.75rem` → use `rounded-md` (sm-2px), `rounded-lg` (base), `rounded-xl` (+4), `rounded-2xl` (+8), `rounded-3xl` (+12), `rounded-4xl` (+16). No arbitrary `rounded-[Npx]`.

### Typography
`font-sans` → Geist Sans (`--font-geist-sans`). `font-mono` → Geist Mono. Don't import other fonts; don't use Google `<link>`.

---

## Component inventory (`src/components/ui/`)

Reuse these before generating raw JSX. All use `data-slot` + `cn()` and respect tokens above.

| shadcn primitive | Path | Notes for Figma matching |
|---|---|---|
| `Alert`, `AlertTitle`, `AlertDescription` | `@/components/ui/alert` | Variants: `default`, `destructive` |
| `Avatar`, `AvatarImage`, `AvatarFallback` | `@/components/ui/avatar` | Use for any circular user image in Figma |
| `Badge` | `@/components/ui/badge` | Use for chips, status pills, tags |
| `Button` | `@/components/ui/button` | Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg` |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` | `@/components/ui/card` | Use for any boxed surface with header/body |
| `Input` | `@/components/ui/input` | Wrap with `<Label htmlFor>` for form fields |
| `Label` | `@/components/ui/label` | |
| `Progress` | `@/components/ui/progress` | |
| `ScrollArea`, `ScrollBar` | `@/components/ui/scroll-area` | Use instead of `overflow-auto` for custom scrollbars |
| `Separator` | `@/components/ui/separator` | Replace any 1px divider line in Figma |
| `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose` | `@/components/ui/sheet` | Side panels / drawers |
| `Sidebar`, `SidebarProvider`, `SidebarTrigger`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarRail`, `SidebarInset`, `SidebarSeparator` | `@/components/ui/sidebar` | Use for any nav rail in Figma |
| `Skeleton` | `@/components/ui/skeleton` | Loading states |
| `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | `@/components/ui/tooltip` | |

If Figma uses a primitive NOT in this list (e.g. `Dialog`, `Tabs`, `Select`, `Dropdown`, `Form`, `Switch`, `Checkbox`, `RadioGroup`, `Accordion`, `Popover`, `Command`, `Toast`):
> Run `npx shadcn@latest add <name>` — DO NOT hand-roll.

---

## Code-gen rules for Figma frames

1. **Server Component by default.** Add `"use client"` only on the leaf node that needs state/handlers (push the boundary as deep as possible — see `CLAUDE.md` perf rules).
2. **Icons → `lucide-react` only.** Map Figma icon names to closest `lucide-react` export (`<Search className="size-4" />`). Never inline SVG with hex fills.
3. **Images → `next/image`.** Use the `ImageWithFallback` wrapper from `@/components/shared/ImageWithFallback` when fallback is needed. Pass real `width`/`height`.
4. **Links → `next/link`** (`<Link href="...">`). Never raw `<a>` for in-app navigation.
5. **Spacing.** Round Figma px to Tailwind scale: 4=`1`, 8=`2`, 12=`3`, 16=`4`, 20=`5`, 24=`6`, 32=`8`, 40=`10`, 48=`12`, 64=`16`. Don't use `[Npx]` arbitrary values unless the design genuinely requires it.
6. **Shadows.** Use Tailwind defaults (`shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`). No custom box-shadow strings.
7. **Forms.** shadcn `Form` + `react-hook-form` + `zod`. Don't reinvent.
8. **Animations.** `framer-motion` (already installed). Reuse the `requestAnimationFrame + useTransition` pattern from `components/homepage/HeroSection.tsx` for scroll/resize/mousemove handlers.
9. **Dark mode.** Every generated component must visually pass in `.dark` — sanity-check by mentally swapping the tokens. No fixed `gray-*` colors.
10. **`useMemo` / `useCallback`.** Don't add defensively. React Compiler is on.

---

## Code Connect setup (when user provides a Figma file)

The components in the inventory above are the targets for Code Connect mappings. When the user shares a file/frame:

1. `get_code_connect_suggestions` on the Figma node ID.
2. Review suggestions against the inventory table.
3. `send_code_connect_mappings` in bulk with `label: "React"` and `source: "@/components/ui/<name>"`.

This makes future generations return `<Button variant="outline">…</Button>` directly instead of regenerating JSX.

---

## Known constraints (from `CLAUDE.md`)

- Don't run `npm install`, `npm run build`, or `next dev` without being asked.
- Don't add `useMemo` / `useCallback` defensively (React Compiler is on).
- Don't import `react-icons` (being removed). lucide-react only.
- Don't use raw `<img>`, `<button>`, `<a>` inside pages.
- Don't write hex literals in components.
