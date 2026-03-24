# Debugging Patterns Reference

## Real-World Case Studies

### Case 1: CSS Pollution from injected HTML

**Problem**: Button colors changed, margins disappeared

**Investigation**:
1. Searched for wrong color value
2. Found `:root { --text-primary: #1e293b; }` in template CSS
3. Found `* { margin: 0; padding: 0; }` in template

**Root Cause**: Injected HTML contained global CSS that overrode app styles

**Fix**:
1. Scope CSS variables with prefix: `--card-*`
2. Wrap selectors in scope class: `.card-root *`

---

### Case 2: Flex Layout Overlap

**Problem**: Header overlapped with content below

**Root Cause**: Header outside flex container, both at y=0

**Fix**: Use `flex flex-col` so header participates in flex flow

---

### Case 3: Hydration from Browser Extension

**Problem**: Hydration mismatch errors

**Root Cause**: Browser extension modifying DOM

**Fix**: Not a code issue - check for `data-*-installed` attributes

## Hypothesis Template

```markdown
### 假设 N: [Description]
**分析**: [Theory]
**尝试**: [Change made]
**结果**: ✅/❌
**原因**: [Why]
```

## Git Workflow

```bash
# Revert single file
git checkout HEAD -- file.tsx

# Check what changed
git diff HEAD
```
