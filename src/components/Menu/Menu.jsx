import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Menu.scss';
import menuIcon from '../../assets/icons/menu-white.png';

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activePage, setActivePage] = useState(location.pathname);

  const menuRef = useRef(null);
  const menuIconRef = useRef(null);

  useEffect(() => {
    setActivePage(location.pathname);
  }, [location]);

  const handleMenuClick = (path) => {
    navigate(path);
    setActivePage(path);
    setMobileMenu(false);
  };

  const openMobileMenu = (event) => {
    event.stopPropagation();
    setMobileMenu((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuIconRef.current !== event.target
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
          <span onClick={() => handleMenuClick('/')}>fateme</span>
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
          <li
            className={
              activePage === '/contact' ? 'menu-txt__right--active-menu' : ''
            }
            onClick={() => handleMenuClick('/contact')}
          >
            Contact
          </li>
        </ul>

        <img
          ref={menuIconRef}
          src={menuIcon}
          alt="menu icon"
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
              <li
                className={
                  activePage === '/contact'
                    ? 'menu-txt__dropdown--active-menu'
                    : ''
                }
                onClick={() => handleMenuClick('/contact')}
              >
                Contact
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
