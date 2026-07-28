# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Divider** | unknown | 13× | `.divider` |
| **Container** | unknown | 8× | `.container` |
| **D Inline Block** | unknown | 7× | `.d-inline-block`, `.mb-0` |
| **Cky Accordion** | unknown | 6× | `.cky-accordion` |
| **Cky Accordion Item** | card | 6× | `.cky-accordion-item` |
| **Cky Accordion Header Wrapper** | unknown | 6× | `.cky-accordion-header-wrapper` |
| **Cky Accordion Btn** | button | 6× | `.cky-accordion-btn` |
| **Cky Accordion Header Des** | unknown | 6× | `.cky-accordion-header-des` |
| **Bold** | unknown | 6× | `.bold` |
| **Nav Item** | card | 5× | `.nav-item` |
| **Dropdown** | card | 4× | `.dropdown`, `.nav-item` |
| **Dropdown Toggle** | unknown | 4× | `.dropdown-toggle`, `.nav-link` |
| **Bold** | unknown | 4× | `.bold`, `.h3-4` |
| **Opacity 6** | unknown | 4× | `.opacity-6` |
| **Row** | unknown | 4× | `.row` |
| **Cky Accordion Header** | unknown | 3× | `.cky-accordion-header` |
| **Cky Switch** | unknown | 3× | `.cky-switch` |
| **Row** | unknown | 3× | `.row` |
| **D Inline Block** | unknown | 3× | `.d-inline-block`, `.pb-1`, `.pl-1` |
| **Container** | unknown | 3× | `.container` |

## Cards

### Cky Accordion Item

**Instances found:** 6

**CSS classes:** `.cky-accordion-item`

**HTML structure:**

```html
<div class="cky-accordion-item"><div class="cky-accordion-chevron"><i class="cky-chevron-right"></i></div><div class="cky-accordion-header-wrapper"><div class="cky-accordion-header"><button class="cky-accordion-btn" aria-expanded="false" aria-controls="ckyDetailCategorynecessaryBody" aria-label="Necessary" data-cky-tag="detail-category-title" style="color: #212121;">Necessary</button><span class="cky-always-active" data-cky-tag="always-active" style="color: #008000;">Always Active</span></div><div class="cky-accordion-header-des" data-cky-tag="detail-category-description" style="color: #212121
```

**Base styles (from design tokens):**

```css
.cky-accordion-item {
  background: #2e2e2e;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  padding: 8px;
}```

### Nav Item

**Instances found:** 5

**CSS classes:** `.nav-item`

**HTML structure:**

```html
<li class="nav-item "> <a class="nav-link nav-link-arrow-right cta-pricing-header" href="/en/pricing">Buy Now</a> </li>
```

**Base styles (from design tokens):**

```css
.nav-item {
  background: #2e2e2e;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  padding: 8px;
}```

### Dropdown

**Instances found:** 4

**CSS classes:** `.dropdown` `.nav-item`

**HTML structure:**

```html
<li data-testid="nav-why-dropdown" class="nav-item dropdown"> <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown"> Why AnyDesk<img src="/_static/icons/white/bold/arrow-down-1-ec7f5c.svg" class="menu-icon-arrow-down-white d-none" width="12" alt="" data-category="C0001"> <img src="/_static/icons/black/medium/arrow-down-1-38c71c.svg" class="menu-icon-arrow-down-black" width="12" alt="" data-category="C0001"> </a> <div class="dropdown-menu dropdown-menu-navbar1"> <div class="d-lg-flex justify-content-center"> <div class="float-md-left mb-3 mb-md-3 mr-4"> <p class="dropdown-category
```

**Base styles (from design tokens):**

```css
.dropdown {
  background: #2e2e2e;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  padding: 8px;
}```

## Buttons

### Cky Accordion Btn

**Instances found:** 6

**CSS classes:** `.cky-accordion-btn`

**HTML structure:**

```html
<button class="cky-accordion-btn" aria-expanded="false" aria-controls="ckyDetailCategorynecessaryBody" aria-label="Necessary" data-cky-tag="detail-category-title" style="color: #212121;">Necessary</button>
```

**Base styles (from design tokens):**

```css
.cky-accordion-btn {
  background: #1863dc;
  color: #ffffff;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Divider

**Instances found:** 13

**CSS classes:** `.divider`

**HTML structure:**

```html
<div class="divider"></div>
```

**Base styles (from design tokens):**

```css
.divider {
  background: #2e2e2e;
  padding: 4px;
}```

### Container

**Instances found:** 8

**CSS classes:** `.container`

**HTML structure:**

```html
<div class="container"> <div class="row text-left "> <div class="col-md-4 col-lg-5 col-xl-6"> <img src="/_static/img/devices/two-laptops-flying-dbf8bb.png" class="home-image-laptops" alt="" data-ot-ignore=""> <div class="any-glow-red"></div> </div> <div class="col-md-8 col-lg-7 col-xl-6 z-index-3"> <h1 class="d-none">Leverage the remote access software empo…</h1> <span class="h2 home-animation-text home-animation-text-left">Re-<span class="home-animation-text-right primary-orange-gradient" style="opacity: 1;">Design</span></span> <span class="h2 d-block">Remote Access</span> <h2 class="h5 bold
```

**Base styles (from design tokens):**

```css
.container {
  background: #2e2e2e;
  padding: 4px;
}```

### D Inline Block

**Instances found:** 7

**CSS classes:** `.d-inline-block` `.mb-0`

**HTML structure:**

```html
<p class="mb-0 d-inline-block">Contact Us</p>
```

**Base styles (from design tokens):**

```css
.d-inline-block {
  background: #2e2e2e;
  padding: 4px;
}```

### Cky Accordion

**Instances found:** 6

**CSS classes:** `.cky-accordion`

**HTML structure:**

```html
<div class="cky-accordion" id="ckyDetailCategorynecessary"><div class="cky-accordion-item"><div class="cky-accordion-chevron"><i class="cky-chevron-right"></i></div><div class="cky-accordion-header-wrapper"><div class="cky-accordion-header"><button class="cky-accordion-btn" aria-expanded="false" aria-controls="ckyDetailCategorynecessaryBody" aria-label="Necessary" data-cky-tag="detail-category-title" style="color: #212121;">Necessary</button><span class="cky-always-active" data-cky-tag="always-active" style="color: #008000;">Always Active</span></div><div class="cky-accordion-header-des" data-
```

**Base styles (from design tokens):**

```css
.cky-accordion {
  background: #2e2e2e;
  padding: 4px;
}```

### Cky Accordion Header Wrapper

**Instances found:** 6

**CSS classes:** `.cky-accordion-header-wrapper`

**HTML structure:**

```html
<div class="cky-accordion-header-wrapper"><div class="cky-accordion-header"><button class="cky-accordion-btn" aria-expanded="false" aria-controls="ckyDetailCategorynecessaryBody" aria-label="Necessary" data-cky-tag="detail-category-title" style="color: #212121;">Necessary</button><span class="cky-always-active" data-cky-tag="always-active" style="color: #008000;">Always Active</span></div><div class="cky-accordion-header-des" data-cky-tag="detail-category-description" style="color: #212121;"><p>Necessary cookies are required to enable…</p></div></div>
```

**Base styles (from design tokens):**

```css
.cky-accordion-header-wrapper {
  background: #2e2e2e;
  padding: 4px;
}```

### Cky Accordion Header Des

**Instances found:** 6

**CSS classes:** `.cky-accordion-header-des`

**HTML structure:**

```html
<div class="cky-accordion-header-des" data-cky-tag="detail-category-description" style="color: #212121;"><p>Necessary cookies are required to enable…</p></div>
```

**Base styles (from design tokens):**

```css
.cky-accordion-header-des {
  background: #2e2e2e;
  padding: 4px;
}```

### Bold

**Instances found:** 6

**CSS classes:** `.bold`

**HTML structure:**

```html
<span class="bold">AnyDesk</span>
```

**Base styles (from design tokens):**

```css
.bold {
  background: #2e2e2e;
  padding: 4px;
}```

### Dropdown Toggle

**Instances found:** 4

**CSS classes:** `.dropdown-toggle` `.nav-link`

**HTML structure:**

```html
<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown"> Why AnyDesk<img src="/_static/icons/white/bold/arrow-down-1-ec7f5c.svg" class="menu-icon-arrow-down-white d-none" width="12" alt="" data-category="C0001"> <img src="/_static/icons/black/medium/arrow-down-1-38c71c.svg" class="menu-icon-arrow-down-black" width="12" alt="" data-category="C0001"> </a>
```

**Base styles (from design tokens):**

```css
.dropdown-toggle {
  background: #2e2e2e;
  padding: 4px;
}```

### Bold

**Instances found:** 4

**CSS classes:** `.bold` `.h3-4`

**HTML structure:**

```html
<h3 class="h3-4 bold">Collaboration</h3>
```

**Base styles (from design tokens):**

```css
.bold {
  background: #2e2e2e;
  padding: 4px;
}```

### Opacity 6

**Instances found:** 4

**CSS classes:** `.opacity-6`

**HTML structure:**

```html
<p class="h5 opacity-6"> Bring teams into one shared view. Chat before and during sessions, highlight details on the screen, or record for later reference. Stay aligned and keep work moving in one place.</p>
```

**Base styles (from design tokens):**

```css
.opacity-6 {
  background: #2e2e2e;
  padding: 4px;
}```

### Row

**Instances found:** 4

**CSS classes:** `.row`

**HTML structure:**

```html
<div class="row"> <div class="col-md-6 col-lg-5 offset-lg-1 d-flex"> <div class="any-module-featureGridCard p-3 mb-3 mb-md-0"> <h3 class="h3-4 bold">Access</h3> <p class="h5 opacity-6"> Keep your workspace…</p> </div> </div> <div class="col-md-6 col-lg-5 d-flex"> <div class="any-module-featureGridCard p-3 mb-3 mb-md-0"> <h3 class="h3-4 bold">Security</h3> <p class="h5 opacity-6"> Encrypt connections…</p> </div> </div> </div>
```

**Base styles (from design tokens):**

```css
.row {
  background: #2e2e2e;
  padding: 4px;
}```

### Cky Accordion Header

**Instances found:** 3

**CSS classes:** `.cky-accordion-header`

**HTML structure:**

```html
<div class="cky-accordion-header"><button class="cky-accordion-btn" aria-expanded="false" aria-controls="ckyDetailCategoryfunctionalBody" aria-label="Functional" data-cky-tag="detail-category-title" style="color: #212121;">Functional</button><div class="cky-switch" data-cky-tag="detail-category-toggle"><input type="checkbox" id="ckySwitchfunctional" aria-label="Enable Functional" autocomplete="off" style="background-color: rgb(208, 213, 210);"></div></div>
```

**Base styles (from design tokens):**

```css
.cky-accordion-header {
  background: #2e2e2e;
  padding: 4px;
}```

### Cky Switch

**Instances found:** 3

**CSS classes:** `.cky-switch`

**HTML structure:**

```html
<div class="cky-switch" data-cky-tag="detail-category-toggle"><input type="checkbox" id="ckySwitchfunctional" aria-label="Enable Functional" autocomplete="off" style="background-color: rgb(208, 213, 210);"></div>
```

**Base styles (from design tokens):**

```css
.cky-switch {
  background: #2e2e2e;
  padding: 4px;
}```

### Row

**Instances found:** 3

**CSS classes:** `.row`

**HTML structure:**

```html
<div class="row"> <div class="col-md-12 text-center text-md-right"> <div class="any-checkbox-darkmode custom-control custom-checkbox float-left"> <input type="checkbox" value="true" class="change-theme pb-0 d-inline-block" id="change-theme-toggle"> <label for="change-theme-toggle" class="change-theme-text font-size-sm bold gray-medium"> Light Mode</label> <div class="moon"></div> </div> <div class="d-md-none float-right"><style> </style> <!-- We can't show ZH-TW on the Language selector for Political reasons. Instead we set China language for ZH_TW --> <div class="dropdown bootstrap-select lan
```

**Base styles (from design tokens):**

```css
.row {
  background: #2e2e2e;
  padding: 4px;
}```

### D Inline Block

**Instances found:** 3

**CSS classes:** `.d-inline-block` `.pb-1` `.pl-1` `.pl-md-0` `.pr-1` `.pt-1`

**HTML structure:**

```html
<div class="d-inline-block pt-1 pb-1 pr-1 pl-1 pl-md-0"> <a class="btn btn-sm btn-primary download-button" href="/en/downloads/thank-you?dv=win_exe"> <p class="mb-0 d-inline-block">Download Now</p> </a></div>
```

**Base styles (from design tokens):**

```css
.d-inline-block {
  background: #2e2e2e;
  padding: 4px;
}```

### Container

**Instances found:** 3

**CSS classes:** `.container`

**HTML structure:**

```html
<div class="container"> <div class="row"> <div class="col-lg-10 offset-lg-1 text-center"> <h3 class="bold mb-3">AnyDesk fits your <span class="milky-orange-gradient">needs</span></h3> </div> <div class="col-md-6 col-lg-5 offset-lg-1 d-flex"> <div class="any-module-featureGridCard p-3 mb-3"> <h3 class="h3-4 bold">Collaboration</h3> <p class="h5 opacity-6"> Bring teams into on…</p> </div> </div> <div class="col-md-6 col-lg-5 d-flex"> <div class="any-module-featureGridCard p-3 mb-3"> <h3 class="h3-4 bold">Assistance</h3> <p class="h5 opacity-6"> Resolve issues with…</p> </div> </div> </div> </div
```

**Base styles (from design tokens):**

```css
.container {
  background: #2e2e2e;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#1a1a1a` for all dividers within components
- Use `#1863dc` for all interactive/active states

