import { useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';
import './Menu.scss';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import NavDrawer from '../NavDrawer/NavDrawer';
import { paletteStore } from '../../store/paletteStore';
import { paletteShortcutLabel } from '../../utils/platform';

interface NavItem {
  path: string;
  label: string;
}

// Deep Dives sits second on purpose: it is the strongest material on the
// site and was previously third, where almost nobody reached it.
const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/deep-dives', label: 'Deep Dives' },
  { path: '/projects', label: 'Projects' },
  { path: '/about-me', label: 'About' },
];

const Menu = () => {
  const transitionNavigate = useTransitionNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);
  const activePage = location.pathname;

  const toggleRef = useRef<HTMLButtonElement>(null);

  const handleMenuClick = (path: string): void => {
    transitionNavigate(path);
    setMobileMenu(false);
  };

  // Escape, the backdrop, the scroll lock and returning focus to this
  // button all live in NavDrawer now, rather than being reimplemented here
  // against document listeners.
  const closeSheet = useCallback(() => setMobileMenu(false), []);

  const renderItems = (variant: 'right' | 'dropdown') =>
    NAV_ITEMS.map((item) => {
      const isActive = activePage === item.path;
      return (
        <li key={item.path}>
          <button
            type="button"
            className={`menu-txt__link${
              isActive ? ` menu-txt__${variant}--active-menu` : ''
            }`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => handleMenuClick(item.path)}
          >
            {item.label}
          </button>
        </li>
      );
    });

  return (
    <header className="menu">
      <div className="menu-txt container">
        <div className="menu-txt__left">
          <button
            type="button"
            className="menu-txt__home-btn"
            onClick={() => handleMenuClick('/')}
          >
            Fatemeh
            <span className="visually-hidden"> — go to the home page</span>
          </button>
        </div>

        <nav aria-label="Main">
          <ul className="menu-txt__right">{renderItems('right')}</ul>

          <button
            type="button"
            className="menu-txt__search"
            onClick={() => paletteStore.open()}
            aria-label="Open the command palette. Keyboard shortcut: Control or Command K"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m20 20-3.5-3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {/* Printed from the actual platform: a Windows keyboard has no
                Command key, so showing it there is just wrong. */}
            <kbd className="menu-txt__kbd" aria-hidden="true">
              {paletteShortcutLabel()}
            </kbd>
          </button>

          <ThemeToggle />

          <button
            type="button"
            ref={toggleRef}
            className="menu-txt__menu-toggle"
            aria-expanded={mobileMenu}
            aria-controls="mobile-menu"
            aria-label={mobileMenu ? 'Close main menu' : 'Open main menu'}
            onClick={() => setMobileMenu((prev) => !prev)}
          >
            {/* Inline rather than an image file: the old icon was baked
                white, which was invisible against the light header and left
                what looked like an empty gap. Drawn with currentColor it
                follows the theme, and it is one fewer request. */}
            <svg
              className="menu-txt__menuIcon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
              focusable="false"
            >
              {mobileMenu ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>

          <NavDrawer
            open={mobileMenu}
            onClose={closeSheet}
            id="mobile-menu"
            title="Menu"
          >
            <ul className="menu-txt__drawer-list">{renderItems('dropdown')}</ul>
          </NavDrawer>
        </nav>
      </div>
    </header>
  );
};

export default Menu;
