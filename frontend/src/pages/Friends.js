import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Tabs,
  Tab,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';


const Friends = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [friendsData, setFriendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriendsData(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;

    setSearching(true);
    try {
      const response = await api.get(`/friends/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId) => {
    try {
      await api.post('/friends/request', { friendId });
      fetchFriends();
      setSearchResults(searchResults.filter((u) => u.id !== friendId));
    } catch (error) {
      alert(error.response?.data?.error || t('friends.errorSending'));
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      await api.post(`/friends/accept/${friendshipId}`);
      fetchFriends();
    } catch (error) {
      alert(error.response?.data?.error || t('friends.errorAccepting'));
    }
  };

  const handleReject = async (friendshipId) => {
    try {
      await api.delete(`/friends/${friendshipId}`);
      fetchFriends();
    } catch (error) {
      alert(error.response?.data?.error || t('friends.errorRejecting'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Amis
        </Typography>

        <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Rechercher un utilisateur"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom d'utilisateur..."
            />
            <Button type="submit" variant="contained" disabled={searching}>
              {searching ? 'Recherche...' : 'Rechercher'}
            </Button>
          </Box>
        </Box>

        {searchResults.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résultats de recherche
            </Typography>
            <Grid container spacing={2}>
              {searchResults.map((result) => (
                <Grid item xs={12} sm={6} md={4} key={result.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar src={result.avatar_url} sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="h6">{result.username}</Typography>
                        </Box>
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleSendRequest(result.id)}
                      >
                        {t('friends.sendRequest')}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label={`${t('friends.friendsTab')} (${friendsData?.friends?.length || 0})`} />
          <Tab label={`${t('friends.receivedRequests')} (${friendsData?.pendingReceived?.length || 0})`} />
          <Tab label={`${t('friends.sentRequests')} (${friendsData?.pendingSent?.length || 0})`} />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            {friendsData?.friends && friendsData.friends.length > 0 ? (
              <Grid container spacing={2}>
                {friendsData.friends.map((friend) => (
                  <Grid item xs={12} sm={6} md={4} key={friend.friend_id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar src={friend.avatar_url} sx={{ mr: 2 }} />
                          <Typography variant="h6">{friend.username}</Typography>
                        </Box>
                        <Button
                          fullWidth
                          variant="outlined"
                          sx={{ mt: 2 }}
                          component={Link}
                          to={`/profile/${friend.friend_id}`}
                        >
                          {t('friends.viewProfile')}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">{t('friends.noFriends')}</Alert>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            {friendsData?.pendingReceived && friendsData.pendingReceived.length > 0 ? (
              <Grid container spacing={2}>
                {friendsData.pendingReceived.map((request) => (
                  <Grid item xs={12} sm={6} md={4} key={request.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar src={request.avatar_url} sx={{ mr: 2 }} />
                          <Typography variant="h6">{request.username}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleAccept(request.id)}
                          >
                            {t('friends.accept')}
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={() => handleReject(request.id)}
                          >
                            {t('friends.reject')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">{t('friends.noReceivedRequests')}</Alert>
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            {friendsData?.pendingSent && friendsData.pendingSent.length > 0 ? (
              <Grid container spacing={2}>
                {friendsData.pendingSent.map((request) => (
                  <Grid item xs={12} sm={6} md={4} key={request.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar src={request.avatar_url} sx={{ mr: 2 }} />
                          <Typography variant="h6">{request.username}</Typography>
                        </Box>
                        <Chip label={t('friends.pending')} color="warning" />
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(request.id)}
                          sx={{ mt: 2 }}
                        >
                          {t('friends.cancelRequest')}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">{t('friends.noSentRequests')}</Alert>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Friends;

