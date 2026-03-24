---
name: ui-debug
description: "Systematically debug UI and CSS display issues in web applications. This skill should be used when encountering: CSS not applying, styles disappearing, layout overlap, wrong colors, margin/padding issues, or hydration mismatches. Triggers on tasks involving debugging CSS, fixing UI bugs, investigating injected HTML or CSS pollution, flex or grid layout problems, or browser extension interference."
---

# UI Debug Skill

## Overview

Systematically debug UI/CSS display issues using a hypothesis-driven approach with documented investigation.

## Quick Debug Workflow

When facing a UI bug:

### Step 1: Create Debugging Document

Create `DEBUGGING.md` in the project root:
```markdown
# [Page] CSS Debugging

**Last updated**: YYYY-MM-DD
**Status**: Investigating
**Problem**: [Description]

---

## Problem Description

[List observable symptoms]

---

## Hypothesis Log

### 假设 1: [Description]
**分析**: [Theory]
**尝试**: [Change made]
**结果**: ✅/❌
**原因**: [Why]
```
```

### Step 2: Hypothesis-Driven Investigation

For each hypothesis:
1. **State the hypothesis** - What do you think is wrong?
2. **Make one change** - Test one thing at a time
3. **Verify result** - Check if it fixed the issue
4. **Document** - Update DEBUGGING.md immediately

### Step 3: Common Root Causes (Check These First)

| Symptom | Common Causes |
|---------|---------------|
| Styles disappearing | `* { margin: 0 }` in injected CSS, CSS scoping issues |
| Wrong colors | CSS variable conflicts, specificity wars |
| Layout overlap | Fixed positioning, z-index issues, flex children |
| Margins collapsed | Parent `overflow: hidden`, flex container |
| Hydration mismatch | Browser extensions, dynamic content, timestamps |

### Step 4: Search for Pollution Sources

```bash
# Search for CSS variable conflicts
grep -r "#wrong-color" . --include="*.css"
grep -r ":root" . --include="*.css"

# Search for global resets
grep -r "margin: 0" . --include="*.css" --include="*.html"
grep -r "margin: 0;" . --include="*.css"
```

## Key Patterns

### CSS Scoping for Injected HTML

When using `dangerouslySetInnerHTML` or loading templates:

```typescript
const scopeCss = (css: string) => {
  return css
    .replace(/:root\s*\{/g, '.card-root {')
    .replace(/--([a-z-]+):/g, '--card-$1:')
    .replace(/^body\s*\{/gm, '.card-body {')
    .replace(/^\*\s*\{/gm, '.card-root * {');
};
```

### Flex Layout Fix

For header/content overlap:
```tsx
// ❌ WRONG - header outside flex
<body>
  <Header />
  <div>content</div>
</body>

// ✅ CORRECT - header in flex
<div className="flex flex-col min-h-screen">
  <Header />
  <div className="flex-1">content</div>
</div>
```

### Position Fixed in Responsive Layout

```tsx
// Mobile: fixed sidebar
// Desktop: relative sidebar (participates in flex)
<div className="fixed inset-y-0 md:relative">
```

## Debugging Patterns

See [debugging-patterns.md](references/debugging-patterns.md) for:
- Real-world case studies
- Hypothesis template format
- Git revert commands

## CSS Scoping Reference

See [css-scoping.md](references/css-scoping.md) for:
- Prefixing CSS variables
- Scoping universal selectors
- Template implementation examples

## Atomic Commits

Commit each logical fix separately:
```bash
git add file1.tsx
git commit -m "fix: scope injected CSS variables with prefix

- Add .card-root class to template
- Prefix all CSS vars with --card-
- Scope universal selectors"
```
