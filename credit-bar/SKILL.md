---
name: credit-bar
description: This skill should be used when the user asks to add a credit bar, add a personal branding footer with social links to a webpage, create a "made by" section with links to GitHub or website, build a personal portfolio with author attribution, or add a stylish attribution component to any React project.
---

# Credit Bar

Add an editorial-style credit bar component to a React/Tailwind project.

## Quick Start

Copy the component file and use it:

1. Copy the component:
   ```bash
   cp ~/.claude/skills/credit-bar/assets/components/CreditBar.jsx src/components/shared/CreditBar.jsx
   ```

2. Import and render:
   ```jsx
   import CreditBar from '../shared/CreditBar';

   // Add at the bottom of the page
   <CreditBar />
   ```

## Configuration

Edit the copied file to customize the component.

### 1. Name & Tagline

Replace the placeholder values:
```jsx
<p className="font-body text-base font-semibold text-on-surface">
  YOUR_NAME
</p>
<p className="font-body text-sm text-on-surface-variant">
  Your tagline here
</p>
```

### 2. Social Links

Update the `socialLinks` array:
```jsx
const socialLinks = [
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/YOUR_USERNAME',
    icon: GithubIcon,
    hoverColor: '#333',
  },
  {
    id: 'website',
    name: 'Website',
    url: 'https://yourwebsite.com',
    icon: Globe,
    hoverColor: 'var(--color-secondary)',
  },
  // Add more links...
];
```

### 3. Add New Social Platforms

Example for Xiaohongshu:
```jsx
{
  id: 'xiaohongshu',
  name: '小红书',
  url: 'https://www.xiaohongshu.com/user/profile/YOUR_ID',
  icon: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10..."/>
    </svg>
  ),
  hoverColor: '#FF2442',
},
```

## Requirements

- React
- Tailwind CSS
- Design tokens (CSS variables): `color-surface-container-low`, `color-on-surface`, etc.
- lucide-react (for Globe icon)

### Without Design Tokens

Replace CSS variables with plain values:
```jsx
// Replace:
style={{ color: 'var(--color-on-surface-variant)' }}
// With:
style={{ color: '#6b7280' }}
```

## Resources

- **`assets/components/CreditBar.jsx`** - The ready-to-use component

## Notes

- Uses design system's CSS variables for theming
- Icons are inline SVGs (no extra dependencies except lucide-react for Globe)
- Tooltips appear on hover showing platform names
- Fully responsive - adapts to container width
