/**
 * CreditBar - Editorial-style credit bar for personal branding
 * Magazine-style footer with signature and social links
 */
import { useState } from 'react';
import { Globe } from 'lucide-react';

// Custom GitHub icon (lucide-react's Github is deprecated)
function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

// Social link configuration - UPDATE THESE WITH YOUR OWN LINKS
const socialLinks = [
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/YOUR_USERNAME', // TODO: Update this
    icon: GithubIcon,
    hoverColor: '#333',
  },
  {
    id: 'website',
    name: 'Website',
    url: 'https://yourwebsite.com', // TODO: Update this
    icon: Globe,
    hoverColor: 'var(--color-secondary)',
  },
  // Add more social links as needed
];

// Tooltip component
function Tooltip({ children, text }) {
  return (
    <div className="relative group">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          color: 'var(--color-on-surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default function CreditBar() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <footer className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-surface-container-low)' }}>
      <div className="flex items-end justify-between">
        {/* Signature - UPDATE THESE WITH YOUR OWN NAME/TAGLINE */}
        <div className="space-y-1">
          <p className="font-body text-xs text-on-surface-variant">
            Crafted with ♥ by
          </p>
          <p className="font-body text-base font-semibold text-on-surface">
            YOUR_NAME {/* TODO: Update this */}
          </p>
          <p className="font-body text-sm text-on-surface-variant">
            Your tagline here {/* TODO: Update this */}
          </p>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-6">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            const isHovered = hoveredId === link.id;

            return (
              <Tooltip key={link.id} text={link.name}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all duration-200 hover:scale-110"
                  onMouseEnter={() => setHoveredId(link.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    color: isHovered ? link.hoverColor : 'var(--color-on-surface-variant)',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </a>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
