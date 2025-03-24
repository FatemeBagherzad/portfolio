import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import './App.scss';
import Menu from '../src/components/Menu/Menu';
import Home from './pages/Home/Home';
import Challenges from './pages/Challenges/Challenges';
import Projects from './pages/Projects/Projects';
import AboutMe from './pages/AboutMe/AboutMe';
import Contact from './pages//Contact/Contact';
import Resume from './pages/Resume/Resume';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Menu />

        <div className="body">
          {/* <hr /> */}

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/about-me" element={<AboutMe />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/resume" element={<Resume />} />
            <Route path={'*'} element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
