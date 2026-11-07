import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import './App.scss';
import Menu from './components/Menu/Menu';
import CommandPalette from './components/CommandPalette/CommandPalette';
import Home from './pages/Home/Home';
import DeepDives from './pages/DeepDives/DeepDives';
import Projects from './pages/Projects/Projects';
import AboutMe from './pages/AboutMe/AboutMe';
import NotFound from './pages/NotFound/NotFound';

/**
 * Restores the two things a real page load gives you for free and a
 * single-page app does not: the new page starts at the top, and focus moves
 * to its content instead of being stranded on the link that was clicked.
 */
const AppShell = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const mainRef = useRef<HTMLElement>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Only a new navigation starts at the top. Back and forward are a POP,
    // and the browser already restores the position the visitor left — so
    // overriding it there would throw away where they were.
    if (navigationType !== 'POP') {
      // `instant` rather than the stylesheet's smooth scrolling: animating
      // a jump between pages is slow and disorienting, and on a long page
      // the old content visibly streaks past.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // preventScroll matters on a POP: focusing an element scrolls it into
    // view by default, which would undo the restoration we just preserved.
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, navigationType]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Menu />
      <CommandPalette />

      {/* Purely decorative, and purely CSS where the browser supports it. */}
      <div className="scroll-progress" aria-hidden="true" />

      <main id="main-content" ref={mainRef} tabIndex={-1} className="body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/deep-dives" element={<DeepDives />} />
          {/* Old path kept so links shared before the rename still land. */}
          <Route
            path="/challenges"
            element={<Navigate to="/deep-dives" replace />}
          />
          <Route path="/projects" element={<Projects />} />
          <Route path="/about-me" element={<AboutMe />} />
          <Route path={'*'} element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
