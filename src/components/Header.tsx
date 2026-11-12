import { Coffee } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Header() {
  return (
    <header className="site-header">
      <div className="page-container header-inner">
        <div className="brand">
          <Logo className="size-11 shrink-0 sm:size-12" />
          <div>
            <span className="brand-name">Corporate Translator</span>
            <p className="brand-tagline">Say less. Synergise more.</p>
          </div>
        </div>
        <div className="header-actions">
          <a
            href="https://github.com/PeterOu8/Corporate-Translator"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository (opens in a new tab)"
            title="View source on GitHub"
            className="icon-button header-icon"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.63 0c2.15-1.46 3.09-1.16 3.09-1.16.61 1.55.23 2.7.11 2.98.72.79 1.16 1.8 1.16 3.03 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" />
            </svg>
          </a>
          <a
            href="https://buymeacoffee.com/peterou8"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Support me on Buy Me a Coffee (opens in a new tab)"
            title="Buy me a coffee"
            className="support-button"
          >
            <Coffee className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Support me</span>
          </a>
        </div>
      </div>
    </header>
  );
}
