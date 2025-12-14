import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';
import Friends from './pages/Friends';
import Home from './pages/Home';
import AuthCallback from './pages/auth/Callback';
import LinkGame from './pages/LinkGame';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/tournaments/create"
            element={
              <PrivateRoute>
                <CreateTournament />
              </PrivateRoute>
            }
          />
          <Route
            path="/tournaments/:id"
            element={
              <PrivateRoute>
                <TournamentDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <PrivateRoute>
                <Friends />
              </PrivateRoute>
            }
          />
          <Route
            path="/games/link"
            element={
              <PrivateRoute>
                <LinkGame />
              </PrivateRoute>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;

