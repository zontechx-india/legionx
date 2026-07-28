# Layout Reference

> Auto-extracted from live DOM. Use this to understand how the site is structured spatially.

## Spacing System

**Base grid:** 4px

**Scale:** `4, 8, 10, 12, 16, 20, 30, 32, 128, 140` px

| Spacing | Semantic Use |
|---------|-------------|
| 4px | Tight — within a component |
| 8px | Medium — between sibling items |
| 16px | Wide — between sections |
| 32px | Vast — major section breaks |

## Flex Layouts

| Element | Direction | Justify | Align | Gap | Children |
|---------|-----------|---------|-------|-----|----------|
| `div.cky-prefrence-btn-wrapper` | row | center | center | 8px | 3 |
| `nav.navbar.navbar-expand-lg` | row | start | center | — | 3 |
| `div.row.slider-wrapper` | row | — | — | — | 2 |
| `div.row` | row | — | — | — | 1 |
| `div.row.text-left` | row | — | — | — | 2 |
| `div.row` | row | — | — | — | 3 |
| `div.row` | row | — | — | — | 2 |

## Structural Containers

### `<header>` 

```
display:          block
children:         7
```

### `<footer>` 

```
display:          block
children:         3
```

### `<nav>` (`nav.navbar.navbar-expand-lg`)

```
display:          flex
flex-direction:   row
justify-content:  start
align-items:      center
padding:          0px 0px 16px
children:         3
```

## Layout Rules

- **Container max-width:** `1400px` — always center with `margin: auto`
- Primary layout system: **Flexbox**
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

