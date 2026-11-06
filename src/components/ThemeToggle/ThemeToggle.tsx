import { useRef } from 'react';
import './ThemeToggle.scss';
import { useTheme } from '../../store/themeStore';
import {
  useSystemThemeSync,
  useThemeTransition,
} from '../../hooks/useThemeTransition';

const ThemeToggle = () => {
  const theme = useTheme();
  const toggleTheme = useThemeTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  useSystemThemeSync();

  const handleClick = (): void => {
    const rect = buttonRef.current?.getBoundingClientRect();
    // The reveal grows out of this button, so pass its centre as the origin.
    toggleTheme(
      rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : undefined
    );
  };

  const goingDark = theme === 'light';

  return (
    <button
      type="button"
      ref={buttonRef}
      className="theme-toggle"
      onClick={handleClick}
      aria-pressed={theme === 'dark'}
      aria-label={goingDark ? 'Switch to dark theme' : 'Switch to light theme'}
      title={goingDark ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {goingDark ? (
        // Moon: pressing this now gives you the dark theme.
        <svg
          className="theme-toggle__icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Sun: pressing this now returns you to the light theme.
        <svg
          className="theme-toggle__icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
