# Design System — Sales-Wise

## Product Context
- **What this is:** Live AI co-pilot for B2B salespeople — whispers qualification questions during Google Meet calls in real time
- **Who it's for:** High-earning B2B reps (like "Akshay") doing 10-15 discovery calls/month on Google Meet
- **Space/industry:** Sales intelligence / conversation intelligence (peers: Gong, Chorus, Apollo, Salesloft, Claap)
- **Project type:** SaaS web app (dashboard + PreCall + PostCall) + Chrome extension sidebar

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian — mission control, not marketing. Function-first, data-dense when needed, clean when not.
- **Decoration level:** Minimal — typography and spacing do the work. No gradients, no glow effects, no "AI purple haze." The intelligence is in the content (the whispered question), not the chrome.
- **Mood:** Serious, trustworthy, fast. A tool that feels like it was built by someone who understands the pressure of a live sales call.
- **Reference sites:** Gong.io (corporate/purple), Apollo.io (warm/editorial), Salesloft.com (enterprise/teal), Claap.io (dark/modern), Oliv.ai (dark/AI-native). Sales-Wise borrows the dark-mode baseline from Claap/Oliv but strips the glow and theatrics.

## Typography
- **Display/Hero:** Satoshi (900, 700) — geometric with subtle character, reads as "designed" without being decorative. For product name, page titles, hero headings.
  - CDN: `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`
- **Body:** Plus Jakarta Sans (300-700) — geometric, friendly, excellent at small sizes. All body text, labels, descriptions.
  - CDN: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- **UI/Labels:** Same as body (Plus Jakarta Sans)
- **Data/Tables:** Geist Mono (400, 500) — tabular-nums built in. For transcripts, timestamps, call durations, metric values, MEDDIC scores.
  - CDN: `https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-mono/`
- **Code:** Geist Mono
- **Scale:**
  - Display: 48px / Satoshi 900 / -0.03em tracking
  - H1: 32px / Satoshi 700 / -0.02em
  - H2: 24px / Satoshi 700 / -0.01em
  - H3: 18px / Plus Jakarta Sans 600
  - Body: 16px / Plus Jakarta Sans 400
  - Body Small: 14px / Plus Jakarta Sans 400
  - Mono Data: 13px / Geist Mono 400 / tabular-nums
  - Overline: 12px / Plus Jakarta Sans 600 / uppercase / 0.05em tracking

## Color

### Approach: Restrained
One primary accent (indigo) + one signal color (orange for live states) + neutrals. Color is rare and meaningful.

### Primary
- **Indigo:** `#6366f1` — interactive elements, CTAs, links, selected states
- **Indigo Hover:** `#818cf8`
- **Indigo Dim:** `rgba(99,102,241,0.15)` — ghost buttons, subtle backgrounds
- **Indigo Glow:** `rgba(99,102,241,0.08)` — selection backgrounds

### Signal (Live/Urgent)
- **Orange:** `#f97316` — live call indicator, recording active, urgent suggestions. Distinguishes "happening now" from "interactive."
- **Orange Dim:** `rgba(249,115,22,0.15)` — live badges, subtle backgrounds

### Neutrals (cool grays, slight blue undertone)
- **Background:** `#0a0a0f`
- **Surface:** `#12121a`
- **Card:** `#1a1a25`
- **Field:** `#22222e`
- **Border:** `#2a2a3a`
- **Border Hover:** `#3a3a4a`
- **Muted:** `#6b6b80`
- **Label:** `#8b8ba0`
- **Text:** `#e8e8f0`
- **Text Bright:** `#f8f8ff`

### Semantic
- **Success:** `#22c55e` — completed calls, good MEDDIC scores, positive changes
- **Warning:** `#f59e0b` — needs review, high talk ratio, attention needed
- **Danger:** `#ef4444` — errors, connection lost, missed calls, end call
- **Info:** `#3b82f6` — informational badges, framework tags, tips

### Dark Mode Strategy
Dark mode is the default and primary mode. Light mode available via CSS custom properties on `html.light` class. Light mode: reduce saturation of dim/background colors, swap neutral ramp to warm-cool grays on white.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px

## Layout
- **Approach:** Hybrid — grid-disciplined for the app (Dashboard, PostCall data tables), breathing room for PreCall form and extension sidebar
- **Grid:** 12-column at desktop, 4-column at mobile
- **Max content width:** 1120px
- **Border radius:**
  - sm: 4px (inputs, small elements)
  - md: 8px (buttons, badges, cards)
  - lg: 12px (modal, large cards, sidebar)
  - full: 9999px (pills, badges, toggles)

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension. The sidebar overlay during a live call must feel instant. A rep glancing at a whispered question cannot wait for a fade-in.
- **Easing:** enter: ease-out, exit: ease-in, move: ease-in-out
- **Duration:**
  - micro: 50-100ms (button hover, focus ring)
  - short: 150-250ms (dropdown open, tooltip appear)
  - medium: 250-400ms (page transitions, card expand)
  - long: 400-700ms (reserved — almost never used in this product)

## Sidebar-Specific Rules (Chrome Extension)
- Newest whisper at top, full opacity. Older suggestions fade (0.6 opacity).
- Orange pulsing dot for live state. 2s animation cycle.
- MEDDIC/SPIN/BANT framework tags in indigo dim pill.
- No shadows, no blur effects. Clean borders only.
- Width: 320px fixed (Chrome side panel constraint).

## Anti-Patterns (never do these)
- Purple/violet gradients as default accent
- Glow effects, blur overlays, "AI theater"
- Animated entrances on the live sidebar (instant render only)
- Generic stock-photo hero sections
- Uniform bubbly border-radius on all elements
- Rainbow accent colors — stick to indigo + orange + semantic

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Initial design system created | Created by /design-consultation. Based on competitive research (Gong, Apollo, Salesloft, Claap, Oliv.ai) and product identity as live AI co-pilot. Industrial/utilitarian aesthetic chosen to differentiate from flashy AI-theater competitors. |
| 2026-03-20 | Orange as live signal color | No competitor uses orange. Creates instant visual hierarchy: indigo = interactive, orange = happening now. Critical for live call scanability. |
| 2026-03-20 | Satoshi for display type | Geometric character without being decorative. Brand recognition in screenshots and demos. Pairs well with Plus Jakarta Sans body. |
| 2026-03-20 | No glow/gradients policy | Deliberate departure from Claap/Oliv luminous effects. Signals seriousness and trust over flash. Faster perceived performance. |