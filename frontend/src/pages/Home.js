import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments`);
      setTournaments(response.data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <Box 
        sx={{ 
          my: 6,
          textAlign: 'center',
          position: 'relative',
          py: 8,
          backgroundColor: 'rgba(91, 159, 255, 0.05)',
          borderRadius: '20px',
          border: '2px solid #5B9FFF',
          overflow: 'hidden',
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            color: '#5B9FFF',
            textShadow: '0 0 20px rgba(91, 159, 255, 0.4)',
            mb: 2,
          }}
        >
          {t('home.welcome')}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'text.secondary',
            maxWidth: '600px',
            mx: 'auto',
            fontSize: '1.2rem',
            letterSpacing: '0.5px',
          }}
        >
          {t('home.subtitle')}
        </Typography>
      </Box>

      {/* Tournaments Section */}
      <Box sx={{ mt: 8 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 4,
            fontWeight: 700,
            color: 'primary.main',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(91, 159, 255, 0.3)',
          }}
        >
          {t('home.recentTournaments')}
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
        ) : tournaments.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 8,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: '12px',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {t('home.noTournaments')}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {tournaments.map((tournament) => (
              <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2,
                        fontWeight: 600,
                        color: 'primary.main',
                      }}
                    >
                      {tournament.name}
                    </Typography>
                    <Typography 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        minHeight: '60px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {tournament.description || t('home.noDescription')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip 
                        label={tournament.status?.toUpperCase() || 'UPCOMING'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      fullWidth
                      variant="contained" 
                      component={Link} 
                      to={`/tournaments/${tournament.id}`}
                      sx={{
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {t('home.viewDetails')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Home;

