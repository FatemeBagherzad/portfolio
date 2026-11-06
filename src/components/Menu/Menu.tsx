import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Menu.scss';
import menuIcon from '../../assets/icons/menu-white.webp';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);
  const activePage = location.pathname;

  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const handleMenuClick = (path: string): void => {
    navigate(path);
    setMobileMenu(false);
  };

  useEffect(() => {
    if (!mobileMenu) return;

    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setMobileMenu(false);
    };

    // Escape closes the menu and returns focus to the button that opened it,
    // so a keyboard user is never left with focus inside a hidden element.
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMobileMenu(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenu]);

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
            fatemeh
            <span className="visually-hidden"> — go to the home page</span>
          </button>
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
            <img
              src={menuIcon}
              alt=""
              width={64}
              height={64}
              className="menu-txt__menuIcon"
            />
          </button>

          {mobileMenu && (
            <div ref={menuRef} id="mobile-menu" className="menu-txt__dropdown">
              <ul>{renderItems('dropdown')}</ul>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Menu;
