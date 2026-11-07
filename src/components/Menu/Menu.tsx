import { useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';
import './Menu.scss';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import NavDrawer from '../NavDrawer/NavDrawer';
import SiteSearch from '../SiteSearch/SiteSearch';

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

          <SiteSearch />
        </div>

        <nav aria-label="Main">
          <ul className="menu-txt__right">{renderItems('right')}</ul>

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
            {/* The bar has no room for a text field at phone widths, so
                search lives at the top of the drawer instead of being
                dropped from small screens altogether. */}
            <SiteSearch variant="drawer" onNavigate={closeSheet} />
            <ul className="menu-txt__drawer-list">{renderItems('dropdown')}</ul>
          </NavDrawer>
        </nav>
      </div>
    </header>
  );
};

export default Menu;
