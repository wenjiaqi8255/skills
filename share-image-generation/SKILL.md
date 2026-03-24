---
name: share-image-generation
description: |
  Implement share image generation using html2canvas in React applications.
  Use when: (1) Building share-to-image functionality (2) Capturing DOM as images
  (3) Implementing social share cards (4) Adding QR codes to share cards
---

# Share Image Generation

## Quick Reference

### Core Pattern
```tsx
// 1. Clone element
const clone = element.cloneNode(true) as HTMLElement;

// 2. Make visible
clone.style.position = 'absolute';
clone.style.opacity = '1';
clone.style.visibility = 'visible';

// 3. Append to body
document.body.appendChild(clone);

// 4. Capture
const canvas = await html2canvas(clone, { scale: 2 });

// 5. Clean up
document.body.removeChild(clone);
```

### QR Code Integration
```tsx
import QRCode from 'qrcode';

// Generate QR as data URL
const qrDataUrl = await QRCode.toDataURL(shareUrl, {
  width: 120,
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' },
  errorCorrectionLevel: 'M',
});

// Use in JSX
<img src={qrDataUrl} alt="QR Code" style={{ width: '120px' }} />
```

### CSS Requirements
```css
.share-card {
  position: absolute;      /* NOT fixed */
  visibility: visible;     /* Critical for html2canvas */
  left: -9999px;          /* Hide but keep measurable */
}
```

## Key Files
- `src/components/ShareCard.tsx` - Hidden card component
- `src/components/ShareButton.tsx` - Preview modal with download
- `src/utils/qrcode.ts` - QR code generation utility

## Common Issues

| Issue | Fix |
|-------|-----|
| Blank image | Use clone-based approach |
| scrollHeight = 0 | Use visibility: visible |
| Wrong position | Use position: absolute |
| QR not rendering | Wait for async QR generation |

## Dependencies
```bash
npm install html2canvas qrcode @types/qrcode
```
