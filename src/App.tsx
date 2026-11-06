import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import './App.scss';
import Menu from './components/Menu/Menu';
import CommandPalette from './components/CommandPalette/CommandPalette';
import Home from './pages/Home/Home';
import DeepDives from './pages/DeepDives/DeepDives';
import Projects from './pages/Projects/Projects';
import AboutMe from './pages/AboutMe/AboutMe';
import NotFound from './pages/NotFound/NotFound';

/**
 * In a single-page app a route change does not move focus, so keyboard and
 * screen-reader users stay stranded wherever they clicked. Moving focus to
 * <main> on every navigation (but not on first load) restores the behaviour
 * a normal page load would have given them.
 */
const AppShell = () => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [location.pathname]);

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
    // `reducedMotion="user"` makes every framer-motion animation honour the
    // operating system's "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
