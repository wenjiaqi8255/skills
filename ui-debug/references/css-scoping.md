# CSS Scoping Guide

## The Problem

When using `dangerouslySetInnerHTML` or loading external HTML templates, CSS in that content can pollute the global scope:

- `:root { --var }` overrides your CSS variables
- `* { margin: 0 }` resets all margins
- `body { ... }` overrides your body styles

## Solution: Scoping

### 1. Prefix All CSS Variables

```typescript
// Instead of: --text-primary: #171717;
// Use: --card-text-primary: #171717;

const scopeCss = (css: string) => {
  return css
    .replace(/--([a-z-]+):/g, '--card-$1:');
};
```

### 2. Scope Universal Selector

```css
/* Before: * { margin: 0; } */

/* After: */
.scoped-container * { margin: 0; }
```

### 3. Scope Root Variables

```css
/* Before: :root { --color: red; } */

/* After: */
.scoped-container { --card-color: red; }
```

## Implementation Example

### Template HTML

```html
<div class="card-root card-container">
  <style>
    .card-root * { margin: 0; padding: 0; }
    .card-root { --card-primary: #ff0000; }
  </style>
  <!-- content -->
</div>
```

### JavaScript Scoping Function

```typescript
const scopeCss = (css: string) => {
  return css
    .replace(/:root\s*\{/g, '.card-root {')
    .replace(/--([a-z-]+):/g, '--card-$1:')
    .replace(/^body\s*\{/gm, '.card-body {')
    .replace(/^\*\s*\{/gm, '.card-root * {');
};
```

## Quick Checklist

- [ ] CSS variables prefixed?
- [ ] Universal selector scoped?
- [ ] Root selectors scoped?
- [ ] Container element has scope class?
