# Animation Reference

> Cinematic motion design extracted from live DOM. Follow these specs exactly to recreate the experience.

## Motion Technology Stack

| Library | Type | Notes |
|---------|------|-------|
| **Web Animations API (6 active)** | animation |  |

## Scroll Journey

The page is **6,635px** tall. Each frame below shows what the user sees at that scroll depth.

> **Use these screenshots to understand WHAT animates, WHEN it animates, and HOW it moves.**

### 0% — Top / Hero
Scroll position: 0px

![Scroll 0%](../screens/scroll/scroll-000.png)

### 17% — Opening Section
Scroll position: 975px

![Scroll 17%](../screens/scroll/scroll-017.png)

### 33% — First Feature Section
Scroll position: 1,893px

![Scroll 33%](../screens/scroll/scroll-033.png)

### 50% — Mid-Page
Scroll position: 2,868px

![Scroll 50%](../screens/scroll/scroll-050.png)

### 67% — Lower Content
Scroll position: 3,842px

![Scroll 67%](../screens/scroll/scroll-067.png)

### 83% — Near Footer
Scroll position: 4,760px

![Scroll 83%](../screens/scroll/scroll-083.png)

### 100% — Bottom / Footer
Scroll position: 5,735px

![Scroll 100%](../screens/scroll/scroll-100.png)

## CSS Keyframes (14 extracted)

### `@keyframes minus`

Duration: `0.5s` · Easing: `ease` · Delay: `0s` · Iteration: `1` · Fill: `none`

Used by: `.card-accordion .card .card-header .accordion-icon, .card-accordion-dark .card .`, `.card-accordion .card .card-header .accordion-icon-center, .card-accordion-dark `

```css
@keyframes minus {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

> Transform/motion animation

### `@keyframes rotate`

Duration: `4s` · Easing: `linear` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `.border-solid-gradient-5px-animated`

```css
@keyframes rotate {
  100% {
    --angle: 360deg;
  }
}
```

### `@keyframes bs-notify-fadeOut`

Duration: `300ms` · Easing: `linear` · Delay: `750ms` · Iteration: `1` · Fill: `forwards`

Used by: `.bootstrap-select .dropdown-menu .notify.fadeOut`

```css
@keyframes bs-notify-fadeOut {
  0% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
  }
}
```

> Opacity fade

### `@keyframes slidenavAnimation`

Duration: `0.3s` · Easing: `ease` · Iteration: `1` · Fill: `forwards`

Used by: `.any-transition-fade-secondary, .navbar .navbar-collapse, .show > .dropdown-menu`

```css
@keyframes slidenavAnimation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

> Opacity fade

### `@keyframes slidenavAnimation`

Duration: `0.3s` · Easing: `ease` · Iteration: `1` · Fill: `forwards`

Used by: `.any-transition-fade-secondary, .navbar .navbar-collapse, .show > .dropdown-menu`

```css
@keyframes slidenavAnimation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

> Opacity fade

### `@keyframes glow-red`

Duration: `4s` · Easing: `ease` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `.any-glow-red`

```css
@keyframes glow-red {
  0% {
    box-shadow: rgba(239, 68, 59, 0.5) 0px 0px 60px 60px;
  }
  100% {
  }
}
```

> Shadow pulse/glow effect

### `@keyframes any-pulseeffect`

Duration: `3s` · Iteration: `infinite`

Used by: `.any-pulseeffect`

```css
@keyframes any-pulseeffect {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}
```

> Transform/motion animation

### `@keyframes spin`

Duration: `3s` · Easing: `linear` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `.any-module-contentBox-gradientBorder`

```css
@keyframes spin {
  100% {
    --angle: 1turn;
  }
}
```

### `@keyframes vjs-spinner-show`

Duration: `0s` · Easing: `linear` · Delay: `0.3s` · Iteration: `1` · Fill: `forwards`

Used by: `.vjs-seeking .vjs-loading-spinner, .vjs-waiting .vjs-loading-spinner`

```css
@keyframes vjs-spinner-show {
  100% {
    visibility: visible;
  }
}
```

### `@keyframes vjs-spinner-show`

Duration: `0s` · Easing: `linear` · Delay: `0.3s` · Iteration: `1` · Fill: `forwards`

Used by: `.vjs-seeking .vjs-loading-spinner, .vjs-waiting .vjs-loading-spinner`

```css
@keyframes vjs-spinner-show {
  100% {
    visibility: visible;
  }
}
```

### `@keyframes vjs-spinner-spin`

Duration: `1.1s, 1.1s` · Easing: `cubic-bezier(0.6, 0.2, 0, 0.8), linear` · Delay: `0s, 0s` · Iteration: `infinite, infinite` · Fill: `none, none`

Used by: `.vjs-seeking .vjs-loading-spinner::after, .vjs-seeking .vjs-loading-spinner::bef`

```css
@keyframes vjs-spinner-spin {
  100% {
    transform: rotate(360deg);
  }
}
```

> Transform/motion animation

### `@keyframes vjs-spinner-spin`

Duration: `1.1s, 1.1s` · Easing: `cubic-bezier(0.6, 0.2, 0, 0.8), linear` · Delay: `0s, 0s` · Iteration: `infinite, infinite` · Fill: `none, none`

Used by: `.vjs-seeking .vjs-loading-spinner::after, .vjs-seeking .vjs-loading-spinner::bef`

```css
@keyframes vjs-spinner-spin {
  100% {
    transform: rotate(360deg);
  }
}
```

> Transform/motion animation

### `@keyframes vjs-spinner-fade`

Duration: `1.1s, 1.1s` · Easing: `cubic-bezier(0.6, 0.2, 0, 0.8), linear` · Delay: `0s, 0s` · Iteration: `infinite, infinite` · Fill: `none, none`

Used by: `.vjs-seeking .vjs-loading-spinner::after, .vjs-seeking .vjs-loading-spinner::bef`

```css
@keyframes vjs-spinner-fade {
  0% {
    border-top-color: rgb(115, 133, 159);
  }
  20% {
    border-top-color: rgb(115, 133, 159);
  }
  35% {
    border-top-color: rgb(255, 255, 255);
  }
  60% {
    border-top-color: rgb(115, 133, 159);
  }
  100% {
    border-top-color: rgb(115, 133, 159);
  }
}
```

> Border animation · Text color shift

### `@keyframes vjs-spinner-fade`

Duration: `1.1s, 1.1s` · Easing: `cubic-bezier(0.6, 0.2, 0, 0.8), linear` · Delay: `0s, 0s` · Iteration: `infinite, infinite` · Fill: `none, none`

Used by: `.vjs-seeking .vjs-loading-spinner::after, .vjs-seeking .vjs-loading-spinner::bef`

```css
@keyframes vjs-spinner-fade {
  0% {
    border-top-color: rgb(115, 133, 159);
  }
  20% {
    border-top-color: rgb(115, 133, 159);
  }
  35% {
    border-top-color: rgb(255, 255, 255);
  }
  60% {
    border-top-color: rgb(115, 133, 159);
  }
  100% {
    border-top-color: rgb(115, 133, 159);
  }
}
```

> Border animation · Text color shift

## Motion Tokens (CSS Variables)

### Delay Tokens

```css
--animate-delay: 0.5s;
```

## Global Transition Declarations

These `transition` values were extracted from CSS rules across the site:

```css
transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
transition: opacity 0.15s linear;
transition: height 0.35s;
transition: transform 0.3s ease-out;
transition: all;
transition: 0.5s;
transition: width 0.2s, height 0.2s;
transition: 0.4s ease-in-out;
transition: transform 0.3s;
transition: 0.3s;
transition: opacity 0.4s;
```

## How to Recreate This Motion Design

### Step 1 — Install Dependencies

```bash
```

### Step 2 — Scroll-Reveal Pattern

Elements that animate into view follow this pattern:

```css
/* Initial hidden state */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Step 3 — Key Motion Principles

- **Duration scale:** `0.15s` — use these values, never invent new durations
- **Always add** `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

### Step 4 — Scroll Journey Reference

Match what happens at each scroll position:

- **0%** (`0px`) → `screens/scroll/scroll-000.png`
- **17%** (`975px`) → `screens/scroll/scroll-017.png`
- **33%** (`1893px`) → `screens/scroll/scroll-033.png`
- **50%** (`2868px`) → `screens/scroll/scroll-050.png`
- **67%** (`3842px`) → `screens/scroll/scroll-067.png`
- **83%** (`4760px`) → `screens/scroll/scroll-083.png`
- **100%** (`5735px`) → `screens/scroll/scroll-100.png`

