import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const GameCard = ({ game, isOwnProfile, onUpdate, onDelete, onOpenStats }) => {
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    gameUsername: game.game_username || '',
    rank: '',
    elo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stats = game.api_data ? (typeof game.api_data === 'string' ? JSON.parse(game.api_data) : game.api_data) : null;
  const isLinked = !!game.game_username;
  const isLoL = game.game_name === 'League of Legends';
  const hasStats = isLinked && stats && (isLoL ? stats.rank : (stats.rank || stats.elo));

  const handleOpenEdit = () => {
    if (stats && !isLoL) {
      setFormData({
        gameUsername: game.game_username || '',
        rank: stats.rank || '',
        elo: stats.elo || '',
      });
    } else {
      setFormData({
        gameUsername: game.game_username || '',
        rank: '',
        elo: '',
      });
    }
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        gameId: game.game_id,
        gameUsername: formData.gameUsername,
        rank: formData.rank || null,
        elo: formData.elo || null,
      };

      await axios.post(`${API_URL}/games/link`, payload);
      handleCloseEdit();
      if (onUpdate) onUpdate();
    } catch (error) {
      setError(error.response?.data?.error || 'Error updating game');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('games.confirmDeleteAccount'))) return;

    if (!game.id) {
      alert('Game not linked');
      return;
    }

    try {
      await axios.delete(`${API_URL}/games/${game.id}`);
      if (onDelete) onDelete();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting game account');
    }
  };

  const handleDeleteGame = async () => {
    if (!window.confirm(t('games.confirmRemoveGame'))) return;

    try {
      await axios.delete(`${API_URL}/games/${game.game_id}`);
      if (onDelete) onDelete();
    } catch (error) {
      alert(error.response?.data?.error || 'Error removing game');
    }
  };

  const getRankDisplay = () => {
    if (!stats) return null;

    if (isLoL && stats.rank) {
      return `${stats.rank.tier} ${stats.rank.rank} - ${stats.rank.leaguePoints} LP`;
    } else if (!isLoL && stats.rank) {
      return stats.rank;
    }
    return null;
  };

  const getEloDisplay = () => {
    if (!stats) return null;
    if (isLoL && stats.rank) {
      return `${stats.rank.wins}W / ${stats.rank.losses}L`;
    } else if (!isLoL && stats.elo) {
      return `${stats.elo} ELO`;
    }
    return null;
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity: isLinked ? 1 : 0.6,
          border: isLinked ? '2px solid' : '2px dashed',
          borderColor: isLinked ? 'primary.main' : 'divider',
          position: 'relative',
          cursor: hasStats && isLoL ? 'pointer' : 'default',
          transition: 'all 0.2s',
          '&:hover': hasStats && isLoL ? {
            transform: 'translateY(-4px)',
            boxShadow: 4
          } : {}
        }}
        onClick={(e) => {
          if (e.target.closest('button') || e.target.closest('[role="button"]')) {
            return;
          }
          if (hasStats && isLoL && onOpenStats) {
            onOpenStats(game);
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
            <Typography variant="h6">{game.game_name}</Typography>
            {isOwnProfile && (
              <Box>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGame();
                  }} 
                  color="error"
                  title={t('games.removeGame')}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit();
                  }} 
                  color="primary"
                >
                  {isLinked ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                </IconButton>
              </Box>
            )}
          </Box>

          {isLinked ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('profile.username')}: {game.game_username}
              </Typography>
              {stats && (
                <Box sx={{ mt: 1 }}>
                  {getRankDisplay() && (
                    <Chip
                      label={getRankDisplay()}
                      color="primary"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                  {getEloDisplay() && (
                    <Typography variant="body2" color="text.secondary">
                      {getEloDisplay()}
                    </Typography>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('games.notConfigured')}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isLinked ? t('games.editGame') : t('games.addGame')} - {game.game_name}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <TextField
              fullWidth
              label={t('games.gameUsername')}
              value={formData.gameUsername}
              onChange={(e) => setFormData({ ...formData, gameUsername: e.target.value })}
              margin="normal"
              required
              helperText={
                isLoL
                  ? t('games.link.riotIdHelper')
                  : t('games.link.usernameHelper')
              }
            />

            {!game.api_available && (
              <>
                <TextField
                  fullWidth
                  label={t('games.rank')}
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  margin="normal"
                  placeholder="e.g., Gold, Diamond, Immortal"
                />
                <TextField
                  fullWidth
                  label={t('games.elo')}
                  value={formData.elo}
                  onChange={(e) => setFormData({ ...formData, elo: e.target.value })}
                  margin="normal"
                  type="number"
                  placeholder="e.g., 1500, 2000"
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default GameCard;
