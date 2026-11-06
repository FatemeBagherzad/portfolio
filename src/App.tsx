import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import './App.scss';
import Menu from './components/Menu/Menu';
import Home from './pages/Home/Home';
import Challenges from './pages/Challenges/Challenges';
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

      <main id="main-content" ref={mainRef} tabIndex={-1} className="body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/challenges" element={<Challenges />} />
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
