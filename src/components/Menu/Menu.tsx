import { useState, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Menu.scss';
import menuIcon from '../../assets/icons/menu-white.webp';

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>(location.pathname);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuIconRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setActivePage(location.pathname);
  }, [location]);

  const handleMenuClick = (path: string): void => {
    navigate(path);
    setActivePage(path);
    setMobileMenu(false);
  };

  const openMobileMenu = (event: ReactMouseEvent<HTMLImageElement>): void => {
    event.stopPropagation();
    setMobileMenu((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node | null;
      if (
        menuRef.current &&
        target &&
        !menuRef.current.contains(target) &&
        menuIconRef.current !== target
      ) {
        setMobileMenu(false);
      }
    };

    if (mobileMenu) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenu]);

  return (
    <div className="menu">
      <div className="menu-txt container">
        <div className="menu-txt__left">
          <span onClick={() => handleMenuClick('/')}>fatemeh</span>
        </div>

        <ul className="menu-txt__right">
          <li
            className={activePage === '/' ? 'menu-txt__right--active-menu' : ''}
            onClick={() => handleMenuClick('/')}
          >
            Home
          </li>
          <li
            className={
              activePage === '/projects' ? 'menu-txt__right--active-menu' : ''
            }
            onClick={() => handleMenuClick('/projects')}
          >
            Projects
          </li>
          <li
            className={
              activePage === '/challenges' ? 'menu-txt__right--active-menu' : ''
            }
            onClick={() => handleMenuClick('/challenges')}
          >
            Challenges
          </li>
          <li
            className={
              activePage === '/about-me' ? 'menu-txt__right--active-menu' : ''
            }
            onClick={() => handleMenuClick('/about-me')}
          >
            About
          </li>
        </ul>

        <img
          ref={menuIconRef}
          src={menuIcon}
          alt="menu icon"
          width={64}
          height={64}
          className="menu-txt__menuIcon"
          onClick={openMobileMenu}
        />

        {mobileMenu && (
          <div ref={menuRef} className="menu-txt__dropdown">
            <ul>
              <li
                className={
                  activePage === '/' ? 'menu-txt__dropdown--active-menu' : ''
                }
                onClick={() => handleMenuClick('/')}
              >
                Home
              </li>
              <li
                className={
                  activePage === '/projects'
                    ? 'menu-txt__dropdown--active-menu'
                    : ''
                }
                onClick={() => handleMenuClick('/projects')}
              >
                Projects
              </li>
              <li
                className={
                  activePage === '/challenges'
                    ? 'menu-txt__dropdown--active-menu'
                    : ''
                }
                onClick={() => handleMenuClick('/challenges')}
              >
                Challenges
              </li>
              <li
                className={
                  activePage === '/about-me'
                    ? 'menu-txt__dropdown--active-menu'
                    : ''
                }
                onClick={() => handleMenuClick('/about-me')}
              >
                About
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
