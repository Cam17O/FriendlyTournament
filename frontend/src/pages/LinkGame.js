import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const LinkGame = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    gameId: '',
    gameUsername: '',
    gameAccountId: '',
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await axios.get(`${API_URL}/games`);
      setGames(response.data);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/games/link`, formData);
      setSuccess(t('games.link.success'));
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.error || t('games.link.error'));
    } finally {
      setLoading(false);
    }
  };

  const selectedGame = games.find((g) => g.id === parseInt(formData.gameId));

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('games.link.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            select
            label={t('games.link.game')}
            name="gameId"
            value={formData.gameId}
            onChange={handleChange}
            margin="normal"
            required
          >
            {games.map((game) => (
              <MenuItem key={game.id} value={game.id}>
                {game.name}
                {game.api_available && t('games.link.apiAvailable')}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label={t('games.link.gameUsername')}
            name="gameUsername"
            value={formData.gameUsername}
            onChange={handleChange}
            margin="normal"
            required
            helperText={
              selectedGame?.api_available
                ? t('games.link.riotIdHelper')
                : t('games.link.usernameHelper')
            }
            placeholder={selectedGame?.api_available && selectedGame.name === 'League of Legends' ? 'Cam17OO#EUW' : ''}
          />

          {selectedGame && !selectedGame.api_available && (
            <TextField
              fullWidth
              label={t('games.link.gameAccountId')}
              name="gameAccountId"
              value={formData.gameAccountId}
              onChange={handleChange}
              margin="normal"
              helperText={t('games.link.accountIdHelper')}
            />
          )}

          {selectedGame?.api_available && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('games.link.apiInfo')}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('games.link.linkButton')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LinkGame;

