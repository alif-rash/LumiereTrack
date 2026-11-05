# LumiereTrack design system: "Registrar's Ledger"

The concept: an academic record you can stand behind. It uses paper and ink, ruled lines instead of floating cards, a serif for headings and a monospace for every date, mark and code. Colour carries meaning; it is not decoration.

## Palette (HSL tokens in `src/index.css`)
| Token | Value | Use |
|---|---|---|
| `--background` paper | 42 30% 95% | App canvas |
| `--card` sheet | 42 38% 98% | Raised sheets, rows on hover |
| `--foreground` ink | 160 14% 12% | Text, structural rules, masthead underline |
| `--primary` conservatory green | 166 52% 22% | Primary actions, active nav, Approved/open |
| `--ochre` | 38 78% 42% | Review pending, Medium priority, closing soon, instructor marker |
| `--cinnabar` / `--destructive` | 8 66% 44–46% | Overdue, High priority, Changes Requested, destructive |
| `--plum` | 262 22% 40% | Submitted |
| `--border` rule | 40 14% 82% | Hairlines between rows |

`--navy` and `--soft` are legacy aliases that now point to ink and tint.

## Type
- Display: **Fraunces** (opsz) for page titles at 30–46px, section serif headings and quoted feedback in italic.
- Body: **IBM Plex Sans**, 13–15px.
- Data: **IBM Plex Mono** for dates, codes, versions, marks and `.eyebrow` labels (10.5px uppercase, tracking .14em).
- Section headings (`Panel`): 13px sans, uppercase, tracking .08em, with a hairline under them.

## Structure
- `PageHeader` / dashboard `Masthead`: mono eyebrow, serif title, 1px ink rule underneath.
- `Panel` is a ruled section, not a card. Lists are rows divided by hairlines, and tables are preferred for queues and dockets.
- `Stat` is a ledger figure: a 2px ink top rule, a mono numeral and a caption. It has no box.
- Radius: 4px or less everywhere (`--radius: .25rem`). There are no shadows except on overlays (popover and assistant).
- Navigation: a paper sidebar grouped into Work, Academic and You. The active item has a 3px green bar. Count badges are ink, or cinnabar when urgent.

## Status marks (`.pill[data-s]`)
A square key and a mono label, tinted from one `--c` hue. The same vocabulary is used for To Do, In Progress, Submitted, Under Review, Changes Requested, Approved, Low/Medium/High, open, closed, Closing soon, Full and Leader. "To Do" and "closed" use a hollow key.

## Controls
- Buttons come from shadcn, with green primary, ink outline and ghost variants.
- Tabs are underline tabs (`components/ui/tabs.tsx`).
- Inputs use the paper background with an ink focus ring.

## Motion
There is a single `.rise` entrance at 0.4s with a short stagger. Hover changes colour or border only. `prefers-reduced-motion` turns off all animation.

## Icons
Use lucide at a 1.75 stroke, sized 14–16px, in muted ink. Icon-only buttons must have `aria-label`.

## Rules
No emojis. No invented logo: a dashed reserved square marks where the mark will go. No fabricated people, marks or stats in marketing. The landing preview is an explicitly labelled schematic.
