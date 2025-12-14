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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('auth.register.passwordHelper'));
      return;
    }

    const result = await register(email, password, username);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
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
          {t('auth.register.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label={t('auth.register.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('auth.register.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('auth.register.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            helperText={t('auth.register.passwordHelper')}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {t('auth.register.registerButton')}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            {t('auth.register.hasAccount')} <Link to="/login">{t('auth.register.login')}</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;

