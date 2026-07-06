# Image Generation Guide — Rick & Morty Cluedo Cards

> **Audience**: This document is written for an AI with image-generation capabilities. It contains all the context, specifications, and prompts needed to produce a unified set of playing-card assets for a web-based Cluedo game themed around Rick & Morty.

---

## 1. Project Context

This is a mobile-first web game (Next.js + Socket.io) where 3–8 friends play a deduction card game. Players see cards in their hand, pick cards during suggestions/accusations, and inspect a detective notepad — all on their phone screens. Every card must be **instantly readable at small sizes** (as narrow as 96 px on screen) while still looking stunning when expanded.

### How Cards Are Used in the UI

| Context | Card Size (CSS) | Approx Width | Notes |
|---|---|---|---|
| Player hand | `size-sm` | 96 px | Always visible at bottom of screen |
| Suggestion/Accusation picker | `size-md` | 140 px | Modal overlay grid |
| Winner envelope reveal | `size-lg` | 200 px | Celebration screen |
| Card back (other players) | `size-sm` | 96 px | Face-down mystery cards |

The **Card component** renders images via `<img>` with `object-fit: cover`. The image fills the top portion of the card; a small metadata bar beneath shows the type label (WHO / WHERE / HOW / WHY / WHEN) and the card name. A thin colored accent bar sits at the very top edge.

**Important**: The card frame, border, label, and accent bar are rendered by CSS — they are **not** baked into the image file. You generate only the **inner art** that fills the image region. However, because the art will be displayed inside a card frame with rounded corners and a dark border, design the art to work well within that context (avoid critical details at the extreme edges).

---

## 2. Universal Style Guide

### 2.1 Art Style

- **Rick & Morty cartoon style**: clean ink outlines, flat cel-shading with bold colors, slightly exaggerated proportions.
- Consistent with the show's aesthetic: chunky line-art, visible brush strokes on outlines, slightly off-model charm.
- **No photorealism**. Everything should look like a high-quality frame from the show or official promo art.
- Characters should be recognizable and in-character (expressions, poses, iconic wardrobe).

### 2.2 Image Dimensions & Aspect Ratio

| Property | Value |
|---|---|
| **Aspect ratio** | **3:4 portrait** |
| **Recommended resolution** | **768 × 1024 px** |
| **Minimum acceptable** | 600 × 800 px |
| **Format** | PNG (transparent backgrounds are NOT needed — fill the entire canvas) |

> 3:4 portrait is essential because the CSS card component crops the image with `object-fit: cover` into a region taller than wide. Square images lose too much content on the sides; landscape images get heavily cropped.

### 2.3 Composition Rules

1. **Center the subject** in the middle 70% of the canvas. The CSS `object-fit: cover` will crop edges.
2. **Leave safe margins**: no critical detail within 10% of any edge.
3. **Background fills the entire canvas** — scenic, atmospheric, on-theme. No transparent or blank areas.
4. **High contrast between subject and background** so the card is readable at 96 px width.
5. Characters should be rendered from roughly the **waist up** (portrait crop), filling at least 60% of the frame height.
6. Objects / weapons / items should be centered and fill at least 50% of the frame.

### 2.4 Color Palette Reference

The game UI uses a dark theme. Cards sit on dark backgrounds (`#1f2742` card bg, `#0a0e1a` deep bg). Art should have **rich, saturated colors** that pop against dark surroundings.

| Color Role | Hex | Usage |
|---|---|---|
| Portal Green | `#97ce4c` | Primary brand color, portal effects |
| Rick Cyan | `#00b9c4` | Rick-associated glow, Location cards accent |
| Morty Yellow | `#f0e442` | Morty-associated items |
| Person Accent | `#ff6b9d` | Pink — Person card type bar |
| Location Accent | `#00b9c4` | Cyan — Location card type bar |
| Weapon Accent | `#ff4d6d` | Red — Weapon card type bar |
| Motive Accent | `#b388ff` | Purple — Motive card type bar |
| Time Accent | `#ffb74d` | Orange/Amber — Time card type bar |

For each card category, try to let the category's accent color subtly influence the art palette (e.g., motive cards can have purple-tinted lighting, weapon cards can have red-tinted energy effects).

### 2.5 What NOT to Include in the Art

- **No text, labels, card names, or titles** baked into the image. The UI renders all text.
- **No card borders, frames, or rounded corners** — the CSS component handles this.
- **No card numbering** (e.g., "Card No. 5").
- **No watermarks or signatures**.

---

## 3. Card-Back Design

The card back is shown whenever a card is face-down (other players' hands, unrevealed cards). It must be **instantly recognizable** as "the back of a card" and look great tiled in a row of 5-8 small cards.

### Current Card Back

A card-back image already exists at `public/placeholders/ui/card-back.png`. It shows a green portal vortex with question marks and the text "INTERDIMENSIONAL MYSTERY" and "RICK AND MORTY BOARD GAME / CARD NO. [??]". **This needs to be regenerated** because:

1. It has baked-in text (violates the "no text in art" rule — the CSS renders a `?` rune over it).
2. It is 1:1 square instead of 3:4 portrait.
3. It is too busy/detailed for the small sizes it will be rendered at (96 px).

### Card-Back Regeneration Prompt

> **Prompt**: A swirling Rick and Morty green portal vortex viewed head-on, centered on the canvas. The portal is a bright spiral of electric green (#97ce4c) energy with darker green outer rings fading to deep space black at the edges. Small interdimensional debris, tiny floating rocks, and faint star-field particles swirl around the vortex. The center glows with intense white-green light. Art style: Rick and Morty cartoon, clean bold outlines, vibrant cel-shading. No text, no characters, no labels. Portrait orientation 3:4 aspect ratio, 768x1024px.

- **Save to**: `public/placeholders/ui/card-back.png` (overwrite existing)
- **Key requirements**: Symmetrical, works at 96 px wide, no text whatsoever, green portal is the dominant visual.

---

## 4. UI Assets

### 4.1 Logo (`public/placeholders/ui/logo.png`)

**Status**: ✅ Exists — review for consistency but likely fine to keep.

If regenerating:
> A stylized "Rick & Morty Cluedo" logo. Bold, chunky font in Rick's cyan (#00b9c4) and Morty's yellow (#f0e442). Interdimensional portal-green swirl accent. Dark space background. No subtitle, no tagline. Clean and scalable. 768x1024 portrait.

### 4.2 Envelope (`public/placeholders/ui/envelope.png`)

**Status**: ✅ Exists — review for consistency.

If regenerating:
> A mysterious sealed envelope floating in a dark interdimensional void. The envelope is worn parchment-colored with a glowing green (#97ce4c) wax seal shaped like a portal. Faint green energy wisps leak from the seal. Rick and Morty cartoon art style. Dark cosmic background. No text. 768x1024 portrait.

### 4.3 Portal Background (`public/placeholders/ui/portal-green.png`)

**Status**: ✅ Exists — used as a decorative background element.

If regenerating:
> A full-bleed Rick and Morty portal viewed at a dramatic angle. Swirling bright green (#97ce4c) energy vortex with electric arcs and particle effects. Deep space visible through the portal. Bold cartoon art style. No text, no characters. 768x1024 portrait.

---

## 5. Card Art — Generation Prompts by Category

### Output Convention

- **File format**: PNG
- **Dimensions**: 768 × 1024 px (3:4 portrait)
- **Art style**: Every prompt implicitly includes: *"Rick and Morty cartoon art style, bold clean outlines, vibrant cel-shading, no text, no labels, no borders, no card frame."*
- **Save location**: Each file path is listed in the table. All paths are relative to the project root.

### Common Prompt Suffix

Append this to every card art prompt:

> Rick and Morty animated series cartoon art style. Bold clean ink outlines, flat vibrant cel-shading. Rich saturated colors against a dark atmospheric background. No text, no labels, no borders, no card frame, no watermark. Portrait composition (3:4 aspect ratio), 768×1024 px PNG.

---

### 5.1 Person Cards — `public/placeholders/persons/`

**Accent**: `#ff6b9d` (pink)
**Composition**: Character portrait from waist up, expressive pose, iconic outfit. Background should reflect the character's personality or frequent setting.

| # | File | Card Name | Status | Prompt (subject only — append common suffix) |
|---|---|---|---|---|
| 1 | `rick-sanchez.png` | Rick Sanchez | ⚠️ REGEN (1:1) | Rick Sanchez, wild blue-gray spiky hair, unibrow, lab coat over light blue shirt, holding his portal gun with green glow, confident smirk, Smith family garage lab background with gadgets and green portal swirl behind him |
| 2 | `morty-smith.png` | Morty Smith | ⚠️ REGEN (1:1) | Morty Smith, nervous anxious expression, brown spiky hair, yellow t-shirt, blue jeans, hands up in worry, alien planet landscape background with purple sky and floating rocks |
| 3 | `summer-smith.png` | Summer Smith | ⚠️ REGEN (1:1) | Summer Smith, confident defiant pose, long auburn ponytail, pink tank top, arms crossed, high school hallway fading into interdimensional portal background |
| 4 | `beth-smith.png` | Beth Smith | ⚠️ REGEN (1:1) | Beth Smith, determined expression, blonde hair with hairband, red top, holding a horse surgeon's scalpel, suburban kitchen blending into alien landscape background |
| 5 | `jerry-smith.png` | Jerry Smith | ⚠️ REGEN (1:1) | Jerry Smith, confused dopey expression, brown hair, green polo shirt, holding a "World's Best Dad" mug, living room couch with TV showing interdimensional cable static |
| 6 | `mr-poopybutthole.png` | Mr. Poopybutthole | ⚠️ REGEN (1:1) | Mr. Poopybutthole, top hat, bright yellow skin, wide cheerful smile, waving enthusiastically, saying "ooh-wee" expression, warm cozy living room with family photos background |
| 7 | `birdperson.png` | Birdperson | ⚠️ REGEN (1:1) | Birdperson, stoic warrior expression, feathered head, bare muscular chest with tribal markings, arms folded, Bird World floating islands and skies background |
| 8 | `squanchy.png` | Squanchy | ⚠️ REGEN (1:1) | Squanchy, cat-like face with wild orange fur, mischievous party grin, holding a drink, messy party scene background with confetti and disco lights |
| 9 | `evil-morty.png` | Evil Morty | ⚠️ REGEN (1:1) | Evil Morty, cold calculating expression, eye patch with exposed wires, yellow shirt, hands clasped behind back, Citadel of Ricks throne room with golden chair and screens behind him, ominous dramatic lighting |
| 10 | `mr-meeseeks.png` | Mr. Meeseeks | ⚠️ REGEN (1:1) | Mr. Meeseeks, bright blue humanoid, wide desperate grin, simple body shape, arms outstretched, multiple fading Meeseeks copies in the background, chaotic suburban golf course setting |

---

### 5.2 Location Cards — `public/placeholders/locations/`

**Accent**: `#00b9c4` (cyan)
**Composition**: Wide establishing view of the location, dramatic perspective, atmospheric lighting. No characters in the foreground.

| # | File | Card Name | Status | Prompt (subject only) |
|---|---|---|---|---|
| 1 | `smith-garage.png` | Smith Garage | ⚠️ REGEN (1:1) | Interior of the Smith family garage laboratory, cluttered workbench with bubbling beakers and gadgets, open portal gun on the table, green portal shimmering in the corner, fluorescent overhead light, messy chaotic genius workspace |
| 2 | `citadel-of-ricks.png` | Citadel of Ricks | ⚠️ REGEN (1:1) | Exterior view of the Citadel of Ricks, massive space station shaped like Rick's head, floating in space, hundreds of tiny ships flying around it, glowing windows, green portal energy connecting different sections, deep starfield background |
| 3 | `blips-and-chitz.png` | Blips and Chitz | ⚠️ REGEN (1:1) | Interior of Blips and Chitz arcade, neon-lit alien arcade with dozens of strange holographic game machines, "Roy: A Life Well Lived" machine prominent, colorful flashing lights, alien patrons in silhouette |
| 4 | `cromulon-planet.png` | Cromulon Planet | ⚠️ REGEN (1:1) | Alien planet surface with massive Cromulon heads floating in the sky, giant stone faces with stern expressions, "SHOW ME WHAT YOU GOT" atmosphere, barren rocky landscape with stage lights beaming up, dramatic cosmic sky |
| 5 | `bird-world.png` | Bird World | ⚠️ REGEN (1:1) | Bird World floating sky-islands with massive nests and perches, buildings shaped like birdhouses, clouds at mid-level, bird-people silhouettes flying between islands, warm sunset orange-cyan sky |
| 6 | `froopyland.png` | Froopyland | ⚠️ REGEN (1:1) | Froopyland candy-colored fantasy landscape, rivers of candy, gumdrop hills, cotton candy clouds, rainbow bridges, sugary bright pastel colors, eerily perfect whimsical atmosphere, oversaturated dreamlike quality |
| 7 | `interdimensional-cable.png` | Interdimensional Cable | ⚠️ REGEN (1:1) | A living room TV showing chaotic interdimensional cable static, multiple channel images overlapping and bleeding through, alien TV shows flickering, the cable box has tentacles and wires going to other dimensions, cozy couch in foreground |
| 8 | `gazorpazorp.png` | Gazorpazorp | ⚠️ REGEN (1:1) | Gazorpazorp alien planet, tribal warrior architecture with brutal spiky buildings, orange-red dusty atmosphere, primitive alien weapons mounted on walls, aggressive militant environment, dual suns in the sky |

---

### 5.3 Weapon Cards — `public/placeholders/weapons/`

**Accent**: `#ff4d6d` (red)
**Composition**: The weapon/item centered and prominent, shown in use or glowing with energy. Dynamic background suggesting action.

| # | File | Card Name | Status | Prompt (subject only) |
|---|---|---|---|---|
| 1 | `portal-gun.png` | Portal Gun | ⚠️ REGEN (1:1) | Rick's portal gun close-up, metallic silver body with green glowing energy capsule, firing a green portal beam, sparks and particles around it, dark garage lab background with dim lighting and science equipment |
| 2 | `plumbus.png` | Plumbus | ⚠️ REGEN (1:1) | A plumbus, the weird pink fleshy household device with its dangling shleem and bulbous body, floating on a retail shelf with other alien products, clean commercial alien store lighting |
| 3 | `meeseeks-box.png` | Meeseeks Box | ⚠️ REGEN (1:1) | Mr. Meeseeks Box, blue glowing cube with a single button on top, energy wisps escaping from the button, placed on a table in the Smith family living room, dramatic spotlight on the box, blue ambient glow |
| 4 | `dark-matter-gun.png` | Dark Matter Gun | ⚠️ REGEN (1:1) | A futuristic dark matter energy weapon, sleek black metallic design with pulsing purple-red energy core, dark matter particles swirling around the barrel, being fired with a beam of concentrated dark energy, space-station corridor background |
| 5 | `snake-laser.png` | Snake Laser | ❌ MISSING | A snake-shaped laser weapon from Snake Planet, serpentine metallic body wrapped around a laser emitter, glowing red laser tip, snake scales as surface texture, being wielded by a snake-person silhouette, Snake Planet lab background |
| 6 | `neutrino-bomb.png` | Neutrino Bomb | ❌ MISSING | A neutrino bomb, compact spherical device with pulsing orange warning lights and countdown timer display, concentric energy rings emanating from it, placed in a spaceship cargo bay, dramatic red emergency lighting |
| 7 | `c-137-knife.png` | C-137 Knife | ❌ MISSING | A combat knife engraved with "C-137" on the blade, worn leather-wrapped handle, the blade reflects green portal light, placed on Rick's workbench among screwdrivers and alien tech parts, dramatic close-up, dark moody lighting |

---

### 5.4 Motive Cards — `public/placeholders/motives/`

**Accent**: `#b388ff` (purple)
**Composition**: Abstract/symbolic representation of the motive concept. More atmospheric and emotional than literal. Think "movie poster mood" — evocative, dramatic, symbolic.

| # | File | Card Name | Status | Prompt (subject only) |
|---|---|---|---|---|
| 1 | `revenge.png` | Revenge | ❌ MISSING | Abstract representation of revenge: a shadowy silhouette standing before a wall of connected photos and red string (conspiracy board), clenched fist, dramatic red-purple backlighting, shattered glass on the floor, dark noir atmosphere |
| 2 | `pure-science.png` | Pure Science | ❌ MISSING | Abstract representation of pure science: bubbling beakers and Tesla coils in Rick's garage, equations floating in the air as green holographic projections, a brain in a jar glowing with knowledge, electric arcs between machines, cold blue-green lab lighting |
| 3 | `saving-family.png` | Saving Family | ❌ MISSING | Abstract representation of saving family: the Smith family home seen from outside at night, warm golden light spilling from windows, silhouettes of family members inside, a protective green portal-energy dome surrounding the house, gentle warm atmosphere |
| 4 | `galactic-federation-order.png` | Galactic Federation Order | ❌ MISSING | Abstract representation of authoritarian galactic order: a Galactic Federation badge/emblem glowing ominously, rows of identical alien soldiers in formation below, surveillance drones in the sky, oppressive blue-white institutional lighting, fascist propaganda poster atmosphere |
| 5 | `drunk-power.png` | Drunk Power | ❌ MISSING | Abstract representation of drunk power: Rick's flask floating in center with chaotic green energy exploding from it, empty bottles and portal fragments swirling around, unhinged scientific formulas dissolving in alcohol, neon-green and amber color palette, wild unfocused energy |
| 6 | `existential-dread.png` | Existential Dread | ❌ MISSING | Abstract representation of existential dread: an infinite recursive view of Rick's silhouettes standing in portals within portals, each one smaller, stretching into void, the Curse Purge Plus galaxy visible, dark vast empty cosmic void, lonely isolated feeling, deep blue-purple-black palette |

---

### 5.5 Time Cards — `public/placeholders/times/`

**Accent**: `#ffb74d` (amber/orange)
**Composition**: A landscape/sky scene showing a specific time of day or temporal concept. Atmospheric, moody, cinematic. Think "vista shot" from the show.

| # | File | Card Name | Status | Prompt (subject only) |
|---|---|---|---|---|
| 1 | `portal-dawn.png` | Portal Dawn | ❌ MISSING | A sunrise scene on an alien planet, the sun is actually a massive green portal opening in the sky, golden dawn light mixing with green portal glow, silhouetted alien terrain in foreground, dramatic long shadows, warm amber and green color palette, tranquil yet eerie |
| 2 | `cromulon-night.png` | Cromulon Night | ❌ MISSING | A nighttime scene on the Cromulon planet, massive stone Cromulon heads silhouetted against a star-filled alien sky with nebulae, bioluminescent plants glowing on the ground, moonlight casting blue shadows, mysterious and foreboding atmosphere |
| 3 | `schroedingers-hour.png` | Schroedinger's Hour | ❌ MISSING | An abstract temporal paradox scene: a clock face melting Dali-style, its numbers rearranging, existing simultaneously as day and night (split composition), a cat silhouette that is both there and not there (ghost overlay), quantum probability clouds, surreal purple-orange lighting |
| 4 | `squanch-oclock.png` | Squanch O'Clock | ❌ MISSING | A chaotic party clock scene: a wall clock showing a wild impossible time, the clock face is shaped like Squanchy's face, party confetti and streamers everywhere, disco ball reflections, drinks and party cups floating in zero-gravity, wild neon party lighting, orange-pink-amber palette |
| 5 | `interdimensional-midnight.png` | Interdimensional Midnight | ❌ MISSING | A hauntingly beautiful midnight scene at the threshold between dimensions: a portal half-open in a dark alley, green glow spilling into darkness, the sky shows two different dimensions overlapping (one with stars, one with alien constellations), a clock tower striking midnight in silhouette, deep dark blue-black-green palette |

---

## 6. Generation Checklist & Priority

### Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Exists and correct format — no action needed |
| ⚠️ REGEN | Exists but wrong aspect ratio (1:1) — regenerate at 3:4 portrait |
| ❌ MISSING | Does not exist — generate from scratch |

### Summary Table

| Category | Total | ✅ OK | ⚠️ Regen | ❌ Missing |
|---|---|---|---|---|
| UI Assets | 4 | 3 (logo, envelope, portal) | 1 (card-back) | 0 |
| Person | 10 | 0 | 10 | 0 |
| Location | 8 | 0 | 8 | 0 |
| Weapon | 7 | 0 | 4 | 3 |
| Motive | 6 | 0 | 0 | 6 |
| Time | 5 | 0 | 0 | 5 |
| **Total** | **40** | **3** | **23** | **14** |

### Recommended Generation Order

1. **Card Back** (most visible, every game, every player sees it)
2. **Person cards** (10) — most recognizable, core identity of the game
3. **Location cards** (8) — establish the game's world
4. **Weapon cards** (3 missing + 4 regen) — complete the minimum deck
5. **Motive cards** (6 missing) — all new, extend the game
6. **Time cards** (5 missing) — all new, extend the game

---

## 7. File Naming Convention

```
Slug rule: lowercase the card name, drop apostrophes and curly quotes,
replace non-alphanumeric characters with hyphens, strip leading/trailing hyphens.

Examples:
  "Rick Sanchez"              → rick-sanchez.png
  "Mr. Poopybutthole"         → mr-poopybutthole.png
  "Schroedinger's Hour"       → schroedingers-hour.png
  "Squanch O'Clock"           → squanch-oclock.png
  "C-137 Knife"               → c-137-knife.png
  "Galactic Federation Order" → galactic-federation-order.png
```

---

## 8. Quality Checklist (per image)

Before finalizing each generated image, verify:

- [ ] **Aspect ratio**: 3:4 portrait (768×1024 or proportional)
- [ ] **No text** baked into the image (no labels, names, titles, numbers)
- [ ] **No card frame or border** in the image
- [ ] **Subject centered** in the middle 70% of canvas
- [ ] **Safe margins**: no critical detail within 10% of edges
- [ ] **High contrast**: subject clearly distinguishable from background
- [ ] **Rick & Morty art style**: cartoon, bold outlines, cel-shading
- [ ] **Readable at 96px wide**: main subject still recognizable when thumbnail-sized
- [ ] **Correct file path**: matches the slug rule and category folder
- [ ] **PNG format**: no JPEG artifacts, no transparency needed
- [ ] **Color palette harmony**: category accent color subtly present in the art

---

## 9. Mobile-First Considerations for Art

Since this game is **played primarily on phones**, card art must work at very small sizes:

- **96px card width** means the image area is roughly **96 × 96px** (the CSS crops to a square-ish region within the 3:4 image). At this size, only bold shapes and high-contrast silhouettes read clearly.
- **Avoid fine details** that disappear at small sizes (thin lines, small objects, subtle gradients).
- **Use strong silhouettes**: if you squint at the image, the subject should still be recognizable.
- **Bold color blocking**: large areas of distinct color help identification.
- **No small text** (already covered, but doubly important at mobile sizes).

> **Test technique**: Scale your generated image down to 96×128 pixels. If you can still tell what the card is, it passes.

---

## 10. Batch Generation Template

For batch processing, here's a copy-paste template. Replace `{SUBJECT_PROMPT}` with the subject-specific text from the tables above:

```
{SUBJECT_PROMPT}. Rick and Morty animated series cartoon art style. Bold clean ink outlines, flat vibrant cel-shading. Rich saturated colors against a dark atmospheric background. No text, no labels, no borders, no card frame, no watermark. Portrait composition (3:4 aspect ratio), 768×1024 px PNG.
```

---

## Appendix: Card Component CSS Reference

For reference, here's how the CSS card component structures the rendered card (do NOT replicate this in the image — it's handled by code):

```
┌─────────────────────────┐
│ ████ accent bar (4px) ██│  ← colored by card type
├─────────────────────────┤
│                         │
│    [YOUR IMAGE HERE]    │  ← object-fit: cover
│    (96–200px tall)      │
│                         │
├─────────────────────────┤
│ TYPE LABEL (tiny caps)  │  ← e.g. "WHO", "WHERE"
│ Card Name (bold)        │  ← e.g. "Rick Sanchez"
└─────────────────────────┘
   Border: 1px solid rgba(255,255,255,0.16)
   Border-radius: 10px
   Background: #1f2742
```
