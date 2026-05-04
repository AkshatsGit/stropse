import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import NeonLines from './components/NeonLines';
import LoadingScreen from './components/LoadingScreen';

const Home = lazy(() => import('./pages/Home'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'));
const GameProfiles = lazy(() => import('./pages/GameProfiles'));
const Community = lazy(() => import('./pages/Community'));
const Profile = lazy(() => import('./pages/Profile'));
const Auth = lazy(() => import('./pages/Auth'));
const Admin = lazy(() => import('./pages/Admin'));
const CardView = lazy(() => import('./pages/CardView'));
const GamesLobby = lazy(() => import('./pages/games/GamesLobby'));
const ChessGame = lazy(() => import('./pages/games/ChessGame'));
const SudokuGame = lazy(() => import('./pages/games/SudokuGame'));
const TournamentLobby = lazy(() => import('./pages/games/TournamentLobby'));

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
}

function AdminRoute({ children }) {
  return children; // Admin has its own login
}

function ScrollObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    const mutObserver = new MutationObserver(() => {
      document.querySelectorAll('.scroll-reveal:not(.observed)').forEach(el => {
        el.classList.add('observed');
        observer.observe(el);
      });
    });

    document.querySelectorAll('.scroll-reveal:not(.observed)').forEach(el => {
      el.classList.add('observed');
      observer.observe(el);
    });

    mutObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutObserver.disconnect();
    };
  }, []);
  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollObserver />
      <NeonLines />
      <Navbar />
      <main style={{ paddingTop: '72px', minHeight: '100vh', position: 'relative' }}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/game-profiles" element={<ProtectedRoute><GameProfiles /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/card/:profileId" element={<CardView />} />
            <Route path="/games" element={<GamesLobby />} />
            <Route path="/games/chess" element={<ChessGame />} />
            <Route path="/games/sudoku" element={<SudokuGame />} />
            <Route path="/games/tournament" element={<TournamentLobby />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
