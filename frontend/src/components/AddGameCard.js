import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AddGameCard = ({ onGameAdded }) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setDialogOpen(true);
    setGameName('');
    setError('');
  };

  const handleClose = () => {
    setDialogOpen(false);
    setGameName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/games`, { name: gameName });
      handleClose();
      if (onGameAdded) onGameAdded();
    } catch (error) {
      setError(error.response?.data?.error || 'Error adding game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: '2px dashed',
          borderColor: 'divider',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        onClick={handleOpen}
      >
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" align="center">
            {t('games.addNewGame')}
          </Typography>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('games.addNewGame')}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <TextField
              fullWidth
              label={t('games.gameName')}
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              margin="normal"
              required
              autoFocus
              placeholder="e.g., Overwatch, Fortnite"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={loading || !gameName.trim()}>
              {loading ? t('common.loading') : t('common.add')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AddGameCard;
