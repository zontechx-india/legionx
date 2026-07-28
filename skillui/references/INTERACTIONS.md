# Interaction Reference

> Micro-interactions extracted from live DOM. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Button | 3 | default, hover, focus |
| Role Button | 1 | default, hover, focus |
| Link | 3 | default, hover, focus |
| Input | 3 | default, focus |

## Transition System

These transition declarations were extracted from interactive elements:

```css
transition: all;
transition: 0.3s;
```

Apply these to all interactive elements. Never invent new durations or easings.

## Button Interactions

### Button 1 — `Close`

**States:**

- Default: `../screens/states/button-1-default.png`
- Hover: `../screens/states/button-1-hover.png`
- Focus: `../screens/states/button-1-focus.png`

**On hover:**

```css
/* background-color: rgba(255, 255, 255, 0) → */ background-color: rgba(0, 0, 0, 0);
```

**On focus:**

```css
/* outline: rgb(0, 0, 0) none 3px → */ outline: rgb(24, 99, 220) solid 2px;
/* outline-color: rgb(0, 0, 0) → */ outline-color: rgb(24, 99, 220);
```

**Transition:** `all`

### Button 2 — `Customize`

**States:**

- Default: `../screens/states/button-2-default.png`
- Hover: `../screens/states/button-2-hover.png`
- Focus: `../screens/states/button-2-focus.png`

**On hover:**

```css
/* opacity: 1 → */ opacity: 0.8;
```

**On focus:**

```css
/* outline: rgb(239, 68, 59) none 3px → */ outline: rgb(24, 99, 220) solid 2px;
/* outline-color: rgb(239, 68, 59) → */ outline-color: rgb(24, 99, 220);
```

**Transition:** `all`

### Button 3 — `Reject All`

**States:**

- Default: `../screens/states/button-3-default.png`
- Hover: `../screens/states/button-3-hover.png`
- Focus: `../screens/states/button-3-focus.png`

**On hover:**

```css
/* opacity: 1 → */ opacity: 0.8;
```

**On focus:**

```css
/* outline: rgb(255, 255, 255) none 3px → */ outline: rgb(24, 99, 220) solid 2px;
/* outline-color: rgb(255, 255, 255) → */ outline-color: rgb(24, 99, 220);
```

**Transition:** `all`

## Role Button Interactions

### Role Button 1 — `Hello, have a question? Let’s chat.`

**States:**

- Default: `../screens/states/role-button-1-default.png`
- Hover: `../screens/states/role-button-1-hover.png`
- Focus: `../screens/states/role-button-1-focus.png`

**On focus:**

```css
/* outline: rgb(0, 0, 0) none 0px → */ outline: rgb(46, 46, 46) solid 2px;
/* outline-color: rgb(0, 0, 0) → */ outline-color: rgb(46, 46, 46);
```

**Transition:** `all`

## Link Interactions

### Link 1 — `Further information can be found in our `

**States:**

- Default: `../screens/states/link-1-default.png`
- Hover: `../screens/states/link-1-hover.png`
- Focus: `../screens/states/link-1-focus.png`

**On focus:**

```css
/* outline: rgb(24, 99, 220) none 3px → */ outline: rgb(24, 99, 220) solid 2px;
```

**Transition:** `0.3s`

### Link 2 — `Call Sales: +91 93619 26329`

**States:**

- Default: `../screens/states/link-2-default.png`
- Hover: `../screens/states/link-2-hover.png`
- Focus: `../screens/states/link-2-focus.png`

**On hover:**

```css
/* color: rgb(239, 68, 59) → */ color: rgb(205, 26, 17);
/* border-color: rgb(239, 68, 59) → */ border-color: rgb(205, 26, 17);
/* outline: rgb(239, 68, 59) none 3px → */ outline: rgb(205, 26, 17) none 3px;
/* outline-color: rgb(239, 68, 59) → */ outline-color: rgb(205, 26, 17);
```

**On focus:**

```css
/* outline: rgb(239, 68, 59) none 3px → */ outline: rgb(16, 16, 16) auto 1px;
/* outline-color: rgb(239, 68, 59) → */ outline-color: rgb(16, 16, 16);
```

**Transition:** `0.3s`

### Link 3 — `+91 93619 26329`

**States:**

- Default: `../screens/states/link-3-default.png`
- Hover: `../screens/states/link-3-hover.png`
- Focus: `../screens/states/link-3-focus.png`

**On hover:**

```css
/* color: rgb(239, 68, 59) → */ color: rgb(205, 26, 17);
/* border-color: rgb(239, 68, 59) → */ border-color: rgb(205, 26, 17);
/* outline: rgb(239, 68, 59) none 3px → */ outline: rgb(205, 26, 17) none 3px;
/* outline-color: rgb(239, 68, 59) → */ outline-color: rgb(205, 26, 17);
```

**On focus:**

```css
/* outline: rgb(239, 68, 59) none 3px → */ outline: rgb(16, 16, 16) auto 1px;
/* outline-color: rgb(239, 68, 59) → */ outline-color: rgb(16, 16, 16);
```

**Transition:** `0.3s`

## Input Interactions

### Input 1 — `Enable Functional`

**States:**

- Default: `../screens/states/input-1-default.png`
- Focus: `../screens/states/input-1-focus.png`

**Transition:** `all`

_No visible style changes detected for this element._

### Input 2 — `Enable Analytics`

**States:**

- Default: `../screens/states/input-2-default.png`
- Focus: `../screens/states/input-2-focus.png`

**Transition:** `all`

_No visible style changes detected for this element._

### Input 3 — `Enable Advertisement`

**States:**

- Default: `../screens/states/input-3-default.png`
- Focus: `../screens/states/input-3-focus.png`

**Transition:** `all`

_No visible style changes detected for this element._

## Interaction Rules

- Accent color `#1863dc` is used for focus rings, active states, and hover highlights
- Hover effects use **opacity** changes, not color shifts
- Hover effects include **color transitions** — use the extracted values, not approximations
- Focus states use **outline** (not box-shadow) — always match the extracted focus ring
- Transition durations in use: `0.3s`
- Always respect `prefers-reduced-motion` — set all transitions to `0s` when enabled

