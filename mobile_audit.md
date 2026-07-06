# Mobile-First Audit — Rick & Morty Cluedo

## Verdict: ⚠️ Not truly mobile-first, but responsive

The CSS is written **desktop-first** with mobile adaptations via `max-width` breakpoints. It works on mobile, but it's not optimized for a mobile-primary experience.

---

## Key Findings

### 1. Desktop-First Media Queries

The project uses `@media (max-width: 1100px)` to collapse grids — this is a desktop-first pattern. A mobile-first approach would use `min-width` breakpoints instead.

```css
/* Current (desktop-first): */
.game-grid {
  grid-template-columns: 240px 1fr 320px;  /* ← 3-column desktop layout */
}
@media (max-width: 1100px) {
  .game-grid { grid-template-columns: 1fr; }  /* ← collapses on small screens */
}
```

```css
/* Mobile-first approach would be: */
.game-grid {
  grid-template-columns: 1fr;  /* ← start single-column */
}
@media (min-width: 1100px) {
  .game-grid { grid-template-columns: 240px 1fr 320px; }  /* ← expand on desktop */
}
```

> [!WARNING]
> Both `.game-grid` and `.waiting-grid` use the same desktop-first pattern with a single `1100px` breakpoint. There are no intermediate breakpoints (tablet, small desktop).

### 2. Fixed Card Sizes Don't Scale

Card widths are hardcoded:
- `size-sm`: 96px
- `size-md`: 140px  
- `size-lg`: 200px

On a 320px-wide phone, a `size-md` card picker grid can only fit **2 cards per row** (140px × 2 + 8px gap = 288px). This may not be enough for quick scanning during time-sensitive suggestion/accusation modals.

### 3. No `<meta viewport>` Confirmed

The app is Next.js 14 (App Router), which auto-includes the viewport meta tag via `next/head`. This is fine — no action needed.

### 4. Touch Target Sizes

Buttons use `padding: 10px 18px` which produces roughly 40px tall targets. Apple's HIG recommends **44px minimum**. This is borderline.

### 5. Sticky Sidebars Don't Apply on Mobile

`.col-players` and `.col-log` have `position: sticky` which becomes irrelevant when the grid collapses to single-column. But they don't have `sticky` disabled on mobile, which could cause subtle scroll issues.

### 6. No Safe-Area Handling

No `env(safe-area-inset-*)` usage for devices with notches or gesture bars (modern iPhones, Android gesture nav).

---

## Recommended Fixes (future)

| # | Issue | Impact | Fix |
|---|---|---|---|
| 1 | Desktop-first breakpoints | Medium | Flip to `min-width` media queries |
| 2 | Missing intermediate breakpoints | Low | Add `480px`, `768px` breakpoints for tablet |
| 3 | Small touch targets | Medium | Increase button padding to `12px 20px` minimum |
| 4 | No safe-area insets | Low | Add `padding-bottom: env(safe-area-inset-bottom)` to bottom-fixed elements |
| 5 | Card sizes don't adapt | Low | Consider relative sizing or a `size-xs` for very small screens |
| 6 | Sticky sidebar on mobile | Low | Disable `sticky` under 1100px |

> [!NOTE]
> The game is playable on mobile as-is. These are optimization recommendations, not blockers. The CSS collapses to single-column correctly, modals are properly padded (`16px`), and cards render fine at small sizes.
