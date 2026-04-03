/**
 * @file src/App.jsx
 * Root component — handles auth-state routing.
 *
 * Flow:
 *   not logged in + page === 'landing'  → show LandingPage
 *   not logged in + page === 'login'    → show LoginPage
 *   logged in                           → show Dashboard
 */

import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import useIntersectionObserver from './hooks/useIntersectionObserver';

/* Landing page sections */
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSolution from './components/ProblemSolution';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import BottomCTA from './components/BottomCTA';
import Footer from './components/Footer';
import GetStartedModal from './components/GetStartedModal';

/* Auth + dashboard pages */
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/* ── Inner app (needs AuthProvider to be mounted first) ───────────────── */
function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState('landing'); // 'landing' | 'login'
  const [showModal, setShowModal] = useState(false);

  /* Scroll-reveal for landing sections */
  useIntersectionObserver('.reveal', { threshold: 0.12 });

  /* If the user is logged in, always show Dashboard */
  if (user) return <Dashboard />;

  /* Login page */
  if (page === 'login') return <LoginPage onBack={() => setPage('landing')} />;

  /* Landing page */
  return (
    <>
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>

      <Navbar
        onGetStarted={() => setShowModal(true)}
        onLogin={() => setPage('login')}
      />

      <main>
        <HeroSection onGetStarted={() => setShowModal(true)} onLogin={() => setPage('login')} />
        <ProblemSolution />
        <HowItWorks />
        <Features />
        <BottomCTA onGetStarted={() => setShowModal(true)} />
      </main>

      <Footer />

      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </>
  );
}

/* ── Root export ──────────────────────────────────────────────────────── */
export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
