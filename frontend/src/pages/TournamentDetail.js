import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TournamentDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [joinLoading, setJoinLoading] = useState(false);

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: '',
  });

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments/${id}`);
      setTournament(response.data);
      
      // Préparer les données pour l'édition
      setEditData({
        name: response.data.name,
        description: response.data.description || '',
        startDate: response.data.start_date ? new Date(response.data.start_date).toISOString().slice(0, 16) : '',
        endDate: response.data.end_date ? new Date(response.data.end_date).toISOString().slice(0, 16) : '',
        status: response.data.status,
      });
    } catch (error) {
      setError(t('tournament.detail.error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = tournament?.admins?.some((admin) => admin.user_id === user?.id);
  const isParticipant = tournament?.participants?.some((p) => p.user_id === user?.id);

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      await axios.post(`${API_URL}/tournaments/${id}/join`);
      fetchTournament();
    } catch (error) {
      alert(error.response?.data?.error || t('tournament.detail.errorJoining'));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      await axios.put(`${API_URL}/tournaments/${id}`, {
        ...editData,
        startDate: new Date(editData.startDate).toISOString(),
        endDate: new Date(editData.endDate).toISOString(),
      });
      setEditDialogOpen(false);
      fetchTournament();
    } catch (error) {
      alert(error.response?.data?.error || t('tournament.detail.errorUpdating'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tournament) {
    return (
      <Container>
        <Alert severity="error">{error || t('tournament.detail.notFound')}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {tournament.name}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {tournament.game_name} • {t('tournament.detail.createdBy')} {tournament.creator_name}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip label={tournament.status} color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary" component="span">
                {t('tournament.detail.from')} {new Date(tournament.start_date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} {t('tournament.detail.to')}{' '}
                {new Date(tournament.end_date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
              </Typography>
            </Box>
          </Box>
          <Box>
            {isAdmin && (
              <Button variant="contained" onClick={() => setEditDialogOpen(true)} sx={{ mr: 1 }}>
                {t('tournament.detail.modify')}
              </Button>
            )}
            {!isParticipant && user && (
              <Button
                variant="outlined"
                onClick={handleJoin}
                disabled={joinLoading}
              >
                {joinLoading ? t('tournament.detail.joining') : t('tournament.detail.join')}
              </Button>
            )}
          </Box>
        </Box>

        {tournament.description && (
          <Typography variant="body1" sx={{ mb: 3 }}>
            {tournament.description}
          </Typography>
        )}

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label={t('tournament.detail.participants')} />
          <Tab label={t('tournament.detail.objectives')} />
          <Tab label={t('tournament.detail.rewards')} />
          <Tab label={t('tournament.detail.punitions')} />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('tournament.detail.participants')} ({tournament.participants?.length || 0})
            </Typography>
            <Grid container spacing={2}>
              {tournament.participants?.map((participant) => (
                <Grid item xs={12} sm={6} md={4} key={participant.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">{participant.username}</Typography>
                        {tournament.admins?.some((a) => a.user_id === participant.user_id) && (
                          <Chip label="Admin" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Box>
                      {participant.api_data && (
                        <Box sx={{ mt: 1 }}>
                          {(() => {
                            try {
                              const stats = JSON.parse(participant.api_data);
                              if (stats.rank) {
                                return (
                                  <Typography variant="body2">
                                    {stats.rank.tier} {stats.rank.rank} - {stats.rank.leaguePoints} LP
                                    <br />
                                    {stats.rank.wins}V / {stats.rank.losses}D
                                  </Typography>
                                );
                              }
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('tournament.detail.objectives')}
            </Typography>
            {tournament.objectives && tournament.objectives.length > 0 ? (
              <Grid container spacing={2}>
                {tournament.objectives.map((objective) => (
                  <Grid item xs={12} sm={6} key={objective.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{objective.type}</Typography>
                        {objective.target_value && (
                          <Typography color="text.secondary">
                            {t('tournament.detail.target')}: {objective.target_value}
                          </Typography>
                        )}
                        {objective.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {objective.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">{t('tournament.detail.noObjectives')}</Typography>
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('tournament.detail.rewards')}
            </Typography>
            {tournament.rewards && tournament.rewards.length > 0 ? (
              <Grid container spacing={2}>
                {tournament.rewards.map((reward) => (
                  <Grid item xs={12} sm={6} md={4} key={reward.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{reward.name}</Typography>
                        {reward.position && (
                          <Chip label={`${t('tournament.detail.position')} ${reward.position}`} size="small" sx={{ mt: 1 }} />
                        )}
                        {reward.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {reward.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">{t('tournament.detail.noRewards')}</Typography>
            )}
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('tournament.detail.punitions')}
            </Typography>
            {tournament.punishments && tournament.punishments.length > 0 ? (
              <Grid container spacing={2}>
                {tournament.punishments.map((punishment) => (
                  <Grid item xs={12} sm={6} md={4} key={punishment.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{punishment.name}</Typography>
                        {punishment.condition && (
                          <Typography color="text.secondary" sx={{ mt: 1 }}>
                            {t('tournament.detail.condition')}: {punishment.condition}
                          </Typography>
                        )}
                        {punishment.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {punishment.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">{t('tournament.detail.noPunishments')}</Typography>
            )}
          </Box>
        )}
      </Paper>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tournament.detail.edit.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('tournament.detail.edit.name')}
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('tournament.detail.edit.description')}
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label={t('tournament.detail.edit.startDate')}
              type="datetime-local"
              value={editData.startDate}
              onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t('tournament.detail.edit.endDate')}
              type="datetime-local"
              value={editData.endDate}
              onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              select
              label={t('tournament.detail.edit.status')}
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              margin="normal"
            >
              <MenuItem value="upcoming">{t('tournament.detail.edit.statuses.upcoming')}</MenuItem>
              <MenuItem value="ongoing">{t('tournament.detail.edit.statuses.ongoing')}</MenuItem>
              <MenuItem value="completed">{t('tournament.detail.edit.statuses.completed')}</MenuItem>
              <MenuItem value="cancelled">{t('tournament.detail.edit.statuses.cancelled')}</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleEdit} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TournamentDetail;

