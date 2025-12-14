import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import GameCard from '../components/GameCard';
import AddGameCard from '../components/AddGameCard';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const userId = id || currentUser?.id;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`);
      setProfile(response.data);
    } catch (error) {
      setError(t('profile.errorLoading'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStats = async (accountId, e) => {
    e.stopPropagation(); // Empêcher l'ouverture de la popup
    try {
      await axios.post(`${API_URL}/games/${accountId}/update-stats`);
      fetchProfile(); // Recharger le profil
    } catch (error) {
      alert(error.response?.data?.error || t('common.update'));
    }
  };

  const handleOpenStats = (game) => {
    console.log('🖱️ Clic sur la carte du jeu:', game.game_name);
    console.log('📊 Données du jeu:', game);
    setSelectedGame(game);
    setStatsDialogOpen(true);
  };

  const handleCloseStats = () => {
    setStatsDialogOpen(false);
    setSelectedGame(null);
  };

  const parseGameStats = (game) => {
    if (!game.api_data) return null;
    try {
      // Si api_data est déjà un objet (cas JSONB de PostgreSQL), on le retourne tel quel
      if (typeof game.api_data === 'object' && game.api_data !== null) {
        console.log('📊 Stats déjà parsées (JSONB) pour', game.game_name, ':', game.api_data);
        return game.api_data;
      }
      // Sinon, c'est une chaîne JSON qu'on doit parser
      if (typeof game.api_data === 'string') {
        const parsed = JSON.parse(game.api_data);
        console.log('📊 Stats parsées (string) pour', game.game_name, ':', parsed);
        return parsed;
      }
      console.warn('⚠️ Format api_data inattendu pour', game.game_name, ':', typeof game.api_data);
      return null;
    } catch (e) {
      console.error('❌ Error parsing stats:', e);
      console.error('📄 Contenu de api_data:', game.api_data);
      return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Container>
        <Alert severity="error">{error || t('profile.profileNotFound')}</Alert>
      </Container>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <Container maxWidth="xl">
      <Paper 
        elevation={0} 
        sx={{ 
          p: 5, 
          mt: 4,
          position: 'relative',
          overflow: 'hidden',
          borderTop: '4px solid #5B9FFF',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 1,
              fontWeight: 700,
              color: '#5B9FFF',
              textShadow: '0 0 10px rgba(91, 159, 255, 0.4)',
            }}
          >
            {profile.username}
          </Typography>
          <Typography 
            color="text.secondary"
            sx={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 500,
              fontSize: '1.1rem',
            }}
          >
            {t('profile.memberSince')} {new Date(profile.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
          </Typography>
        </Box>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label={t('profile.linkedGames')} />
          <Tab label={t('profile.ongoingTournaments')} />
          <Tab label={t('profile.pastTournaments')} />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('profile.linkedGames')}
            </Typography>
            {profile.games && profile.games.length > 0 ? (
              <Grid container spacing={2}>
                {profile.games.map((game) => (
                  <Grid item xs={12} sm={6} md={4} key={game.game_id || game.id}>
                    <GameCard
                      game={game}
                      isOwnProfile={isOwnProfile}
                      onUpdate={fetchProfile}
                      onDelete={fetchProfile}
                      onOpenStats={handleOpenStats}
                    />
                  </Grid>
                ))}
                {isOwnProfile && (
                  <Grid item xs={12} sm={6} md={4}>
                    <AddGameCard onGameAdded={fetchProfile} />
                  </Grid>
                )}
              </Grid>
            ) : (
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>{t('profile.noLinkedGames')}</Typography>
                {isOwnProfile && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <AddGameCard onGameAdded={fetchProfile} />
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}
            {!isOwnProfile && (
              <Button
                variant="outlined"
                component={Link}
                to={`/friends`}
                sx={{ mt: 2 }}
              >
                {t('profile.addFriend')}
              </Button>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('profile.ongoingTournaments')}
            </Typography>
            {profile.ongoingTournaments && profile.ongoingTournaments.length > 0 ? (
              <Grid container spacing={2}>
                {profile.ongoingTournaments.map((tournament) => (
                  <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{tournament.name}</Typography>
                        <Typography color="text.secondary">
                          {tournament.game_name}
                        </Typography>
                        <Chip label={tournament.status} color="primary" sx={{ mt: 1 }} />
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            component={Link}
                            to={`/tournaments/${tournament.id}`}
                          >
                            {t('profile.viewDetails')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">{t('profile.noOngoingTournaments')}</Typography>
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('profile.pastTournaments')}
            </Typography>
            {profile.pastTournaments && profile.pastTournaments.length > 0 ? (
              <Grid container spacing={2}>
                {profile.pastTournaments.map((tournament) => (
                  <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{tournament.name}</Typography>
                        <Typography color="text.secondary">
                          {tournament.game_name}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Terminé le {new Date(tournament.end_date).toLocaleDateString('fr-FR')}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            component={Link}
                            to={`/tournaments/${tournament.id}`}
                          >
                            Voir les détails
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">Aucun tournoi passé</Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Dialog pour afficher les stats détaillées */}
      <Dialog 
        open={statsDialogOpen} 
        onClose={handleCloseStats}
        maxWidth="sm"
        fullWidth
      >
        {selectedGame && (() => {
          const stats = parseGameStats(selectedGame);
          if (!stats) {
            return (
              <>
                <DialogTitle>{t('profile.stats.title')} - {selectedGame.game_name}</DialogTitle>
                <DialogContent>
                  <Typography>{t('profile.stats.noStats')}</Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseStats}>{t('common.close')}</Button>
                </DialogActions>
              </>
            );
          }

          return (
            <>
              <DialogTitle>
                <Box>
                  <Typography variant="h5">{selectedGame.game_name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedGame.game_username}
                    {stats.riotId && (
                      <Chip 
                        label={`${stats.riotId.gameName}#${stats.riotId.tagLine}`} 
                        size="small" 
                        sx={{ ml: 1 }} 
                        color="primary"
                      />
                    )}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Stack spacing={3}>
                  {/* Informations générales */}
                  {stats.summonerLevel && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('profile.stats.summonerLevel')}
                      </Typography>
                      <Typography variant="h6">{stats.summonerLevel}</Typography>
                    </Box>
                  )}

                  <Divider />

                  {/* Rank - League of Legends */}
                  {selectedGame.game_name === 'League of Legends' && stats.rank ? (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('profile.stats.rankedSoloDuo')}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Chip
                          label={`${stats.rank.tier} ${stats.rank.rank}`}
                          color="primary"
                          size="large"
                        />
                        <Typography variant="h6">
                          {stats.rank.leaguePoints} LP
                        </Typography>
                      </Stack>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                            <Typography variant="h4" color="success.contrastText">
                              {stats.rank.wins}
                            </Typography>
                            <Typography variant="body2" color="success.contrastText">
                              {t('profile.stats.wins')}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Typography variant="h4" color="error.contrastText">
                              {stats.rank.losses}
                            </Typography>
                            <Typography variant="body2" color="error.contrastText">
                              {t('profile.stats.losses')}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body1">
                          {t('profile.stats.winrate')}: {((stats.rank.wins / (stats.rank.wins + stats.rank.losses)) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stats.rank.wins + stats.rank.losses} {t('profile.stats.gamesPlayed')}
                        </Typography>
                      </Box>
                    </Box>
                  ) : selectedGame.game_name !== 'League of Legends' && (stats.rank || stats.elo) ? (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('profile.stats.rank')}
                      </Typography>
                      <Stack spacing={2}>
                        {stats.rank && (
                          <Box>
                            <Chip
                              label={stats.rank}
                              color="primary"
                              size="large"
                            />
                          </Box>
                        )}
                        {stats.elo && (
                          <Box>
                            <Typography variant="h6">
                              {stats.elo} {t('games.elo')}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('profile.stats.rank')}
                      </Typography>
                      <Chip label={t('profile.notRanked')} color="default" />
                    </Box>
                  )}

                  {/* Date de dernière mise à jour */}
                  {stats.lastUpdated && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {t('profile.stats.lastUpdated')}: {new Date(stats.lastUpdated).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                {isOwnProfile && selectedGame.api_available && selectedGame.id && (
                  <Button
                    onClick={(e) => {
                      handleUpdateStats(selectedGame.id, e);
                      setTimeout(() => {
                        fetchProfile();
                        handleCloseStats();
                        handleOpenStats(selectedGame);
                      }, 1000);
                    }}
                  >
                    {t('profile.updateStats')}
                  </Button>
                )}
                <Button onClick={handleCloseStats} variant="contained">
                  {t('common.close')}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Container>
  );
};

export default Profile;

