import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleDiscordLogin = () => {
    window.location.href = `${API_URL}/auth/discord`;
  };

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={0} 
        sx={{ 
          p: 5, 
          mt: 8,
          position: 'relative',
          overflow: 'hidden',
          borderTop: '4px solid #5B9FFF',
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{
            fontWeight: 700,
            color: '#5B9FFF',
            textShadow: '0 0 10px rgba(91, 159, 255, 0.4)',
            mb: 4,
          }}
        >
          {t('auth.login.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label={t('auth.login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('auth.login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {t('auth.login.loginButton')}
          </Button>
        </Box>

        <Box sx={{ position: 'relative', my: 3 }}>
          <Divider>
            <Typography 
              variant="body2" 
              sx={{ 
                px: 2,
                fontWeight: 600,
                letterSpacing: '1px',
                color: 'text.secondary',
              }}
            >
              {t('auth.login.or')}
            </Typography>
          </Divider>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleLogin}
          >
            {t('auth.login.loginWithGoogle')}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleDiscordLogin}
          >
            {t('auth.login.loginWithDiscord')}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.register')}</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;

