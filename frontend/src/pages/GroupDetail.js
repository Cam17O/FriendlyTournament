import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const GroupDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [gamesDialogOpen, setGamesDialogOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);

  useEffect(() => {
    fetchGroup();
    fetchFriends();
    fetchAvailableGames();
  }, [id]);

  useEffect(() => {
    if (tabValue === 2 && group) {
      fetchLeaderboard();
    }
  }, [tabValue, id, selectedGameId]);

  const fetchGroup = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups/${id}`);
      setGroup(response.data);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends`);
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const fetchAvailableGames = async () => {
    try {
      const response = await axios.get(`${API_URL}/games`);
      setAvailableGames(response.data);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const params = selectedGameId ? { gameId: selectedGameId } : {};
      const response = await axios.get(`${API_URL}/groups/${id}/leaderboard`, { params });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleInvite = async () => {
    try {
      await axios.post(`${API_URL}/groups/${id}/invite`, { friendId: selectedFriend });
      setInviteDialogOpen(false);
      setSelectedFriend('');
      fetchGroup();
    } catch (error) {
      alert(error.response?.data?.error || 'Error inviting friend');
    }
  };

  const handleAccept = async () => {
    try {
      await axios.post(`${API_URL}/groups/${id}/accept`);
      fetchGroup();
    } catch (error) {
      alert(error.response?.data?.error || 'Error accepting invitation');
    }
  };

  const handleDecline = async () => {
    try {
      await axios.post(`${API_URL}/groups/${id}/decline`);
      navigate('/groups');
    } catch (error) {
      alert(error.response?.data?.error || 'Error declining invitation');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(t('groups.confirmLeave'))) return;

    try {
      await axios.post(`${API_URL}/groups/${id}/leave`);
      navigate('/groups');
    } catch (error) {
      alert(error.response?.data?.error || 'Error leaving group');
    }
  };

  const handleAddGame = async () => {
    try {
      await axios.post(`${API_URL}/groups/${id}/games`, { gameId: selectedGame });
      setGamesDialogOpen(false);
      setSelectedGame('');
      fetchGroup();
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding game');
    }
  };

  const handleRemoveGame = async (gameId) => {
    if (!window.confirm(t('groups.confirmRemoveGame'))) return;

    try {
      await axios.delete(`${API_URL}/groups/${id}/games/${gameId}`);
      fetchGroup();
    } catch (error) {
      alert(error.response?.data?.error || 'Error removing game');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return (
      <Container>
        <Alert severity="error">{t('groups.notFound')}</Alert>
      </Container>
    );
  }

  const isAdmin = group.userRole === 'admin' || group.isCreator;
  const userMember = group.members?.find(m => m.user_id === user?.id);
  const isPending = userMember?.status === 'pending';
  const isMember = userMember?.status === 'accepted' || group.isCreator || !userMember;

  // Filtrer les amis qui ne sont pas déjà membres
  const availableFriends = friends.filter(friend => {
    return !group.members?.some(m => m.user_id === friend.friend_id);
  });

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {group.name}
            </Typography>
            {group.description && (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {group.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`${group.members?.length || 0} ${t('groups.members')}`} />
              <Chip label={`${group.games?.length || 0} ${t('groups.games')}`} color="primary" />
            </Box>
          </Box>
          <Box>
            {isPending && (
              <>
                <Button variant="contained" onClick={handleAccept} sx={{ mr: 1 }}>
                  {t('groups.accept')}
                </Button>
                <Button variant="outlined" onClick={handleDecline}>
                  {t('groups.decline')}
                </Button>
              </>
            )}
            {isMember && !group.isCreator && (
              <Button variant="outlined" color="error" onClick={handleLeave}>
                {t('groups.leave')}
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setInviteDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                {t('groups.invite')}
              </Button>
            )}
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label={t('groups.members')} />
          <Tab label={t('groups.games')} />
          <Tab label={t('groups.leaderboard')} />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Grid container spacing={2}>
              {group.members?.map((member) => (
                <Grid item xs={12} sm={6} md={4} key={member.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={member.avatar_url} sx={{ width: 48, height: 48 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">{member.username}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {member.role === 'admin' && (
                              <Chip label={t('groups.admin')} size="small" color="primary" />
                            )}
                            <Chip
                              label={t(`groups.status.${member.status}`)}
                              size="small"
                              color={
                                member.status === 'accepted'
                                  ? 'success'
                                  : member.status === 'pending'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setGamesDialogOpen(true)}
                sx={{ mb: 2 }}
              >
                {t('groups.addGame')}
              </Button>
            )}
            {group.games && group.games.length > 0 ? (
              <Grid container spacing={2}>
                {group.games.map((game) => (
                  <Grid item xs={12} sm={6} md={4} key={game.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">{game.name}</Typography>
                          {isAdmin && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveGame(game.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">{t('groups.noGames')}</Alert>
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            {!isMember ? (
              <Alert severity="info">{t('groups.mustBeMember')}</Alert>
            ) : (
              <>
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    select
                    label={t('groups.filterByGame')}
                    value={selectedGameId || ''}
                    onChange={(e) => setSelectedGameId(e.target.value || null)}
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="">{t('groups.allGames')}</MenuItem>
                    {group.games?.map((game) => (
                      <MenuItem key={game.id} value={game.id}>
                        {game.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

            {leaderboard.length > 0 ? (
              (() => {
                // Grouper par jeu pour afficher le rang par jeu
                const groupedByGame = {};
                leaderboard.forEach(account => {
                  if (!groupedByGame[account.game_name]) {
                    groupedByGame[account.game_name] = [];
                  }
                  groupedByGame[account.game_name].push(account);
                });

                return Object.keys(groupedByGame).sort().map(gameName => (
                  <Box key={gameName} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      {gameName}
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('groups.rank')}</TableCell>
                            <TableCell>{t('groups.player')}</TableCell>
                            <TableCell>{t('groups.username')}</TableCell>
                            <TableCell align="right">{t('groups.elo')}</TableCell>
                            <TableCell align="right">{t('groups.rankLabel')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedByGame[gameName].map((account, index) => {
                            const stats = account.stats;
                            const elo = account.elo || 0;
                            const rankDisplay =
                              account.game_name === 'League of Legends' && stats?.rank
                                ? `${stats.rank.tier} ${stats.rank.rank} - ${stats.rank.leaguePoints} LP`
                                : stats?.rank || t('profile.notRanked');

                            return (
                              <TableRow key={account.id}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    #{index + 1}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar src={account.avatar_url} sx={{ width: 32, height: 32 }} />
                                    <Typography variant="body2">{account.username}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{account.game_username}</TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {elo}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip label={rankDisplay} size="small" color="primary" />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ));
              })()
            ) : (
              <Alert severity="info">{t('groups.noLeaderboard')}</Alert>
            )}
              </>
            )}
          </Box>
        )}
      </Paper>

      {/* Dialog d'invitation */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('groups.inviteFriend')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label={t('groups.selectFriend')}
            value={selectedFriend}
            onChange={(e) => setSelectedFriend(e.target.value)}
            margin="normal"
          >
            {availableFriends.map((friend) => (
              <MenuItem key={friend.friend_id} value={friend.friend_id}>
                {friend.username}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!selectedFriend}
          >
            {t('groups.invite')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'ajout de jeu */}
      <Dialog open={gamesDialogOpen} onClose={() => setGamesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('groups.addGame')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label={t('groups.selectGame')}
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            margin="normal"
          >
            {availableGames
              .filter(game => !group.games?.some(g => g.id === game.id))
              .map((game) => (
                <MenuItem key={game.id} value={game.id}>
                  {game.name}
                </MenuItem>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGamesDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleAddGame}
            variant="contained"
            disabled={!selectedGame}
          >
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroupDetail;
