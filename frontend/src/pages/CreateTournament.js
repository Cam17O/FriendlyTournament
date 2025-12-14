import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CreateTournament = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gameId: '',
    startDate: '',
    endDate: '',
    objectives: [{ type: 'rank', targetValue: '', description: '' }],
    rewards: [{ name: '', description: '', position: null }],
    punishments: [{ name: '', description: '', condition: '' }],
    participantIds: [],
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

  const handleObjectiveChange = (index, field, value) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index][field] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, { type: 'rank', targetValue: '', description: '' }],
    });
  };

  const removeObjective = (index) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    setFormData({ ...formData, objectives: newObjectives });
  };

  const handleRewardChange = (index, field, value) => {
    const newRewards = [...formData.rewards];
    newRewards[index][field] = value;
    setFormData({ ...formData, rewards: newRewards });
  };

  const addReward = () => {
    setFormData({
      ...formData,
      rewards: [...formData.rewards, { name: '', description: '', position: null }],
    });
  };

  const removeReward = (index) => {
    const newRewards = formData.rewards.filter((_, i) => i !== index);
    setFormData({ ...formData, rewards: newRewards });
  };

  const handlePunishmentChange = (index, field, value) => {
    const newPunishments = [...formData.punishments];
    newPunishments[index][field] = value;
    setFormData({ ...formData, punishments: newPunishments });
  };

  const addPunishment = () => {
    setFormData({
      ...formData,
      punishments: [...formData.punishments, { name: '', description: '', condition: '' }],
    });
  };

  const removePunishment = (index) => {
    const newPunishments = formData.punishments.filter((_, i) => i !== index);
    setFormData({ ...formData, punishments: newPunishments });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/tournaments`, formData);
      navigate(`/tournaments/${response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.error || t('tournament.create.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('tournament.create.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('tournament.create.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('tournament.create.description')}
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label={t('tournament.create.game')}
                name="gameId"
                value={formData.gameId}
                onChange={handleChange}
                required
              >
                {games.map((game) => (
                  <MenuItem key={game.id} value={game.id}>
                    {game.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label={t('tournament.create.startDate')}
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label={t('tournament.create.endDate')}
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('tournament.create.objectives')}
              </Typography>
              {formData.objectives.map((objective, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          select
                          label={t('tournament.create.objectiveType')}
                          value={objective.type}
                          onChange={(e) => handleObjectiveChange(index, 'type', e.target.value)}
                          SelectProps={{ native: true }}
                        >
                          <option value="rank">{t('tournament.create.objectiveTypes.rank')}</option>
                          <option value="elo_gain">{t('tournament.create.objectiveTypes.eloGain')}</option>
                          <option value="wins">{t('tournament.create.objectiveTypes.wins')}</option>
                          <option value="custom">{t('tournament.create.objectiveTypes.custom')}</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.targetValue')}
                          value={objective.targetValue}
                          onChange={(e) => handleObjectiveChange(index, 'targetValue', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.objectiveDescription')}
                          value={objective.description}
                          onChange={(e) => handleObjectiveChange(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton onClick={() => removeObjective(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Button startIcon={<AddIcon />} onClick={addObjective} variant="outlined">
                {t('tournament.create.addObjective')}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('tournament.create.rewards')}
              </Typography>
              {formData.rewards.map((reward, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.rewardName')}
                          value={reward.name}
                          onChange={(e) => handleRewardChange(index, 'name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.rewardPosition')}
                          type="number"
                          value={reward.position || ''}
                          onChange={(e) => handleRewardChange(index, 'position', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.rewardDescription')}
                          value={reward.description}
                          onChange={(e) => handleRewardChange(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton onClick={() => removeReward(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Button startIcon={<AddIcon />} onClick={addReward} variant="outlined">
                {t('tournament.create.addReward')}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('tournament.create.punishments')}
              </Typography>
              {formData.punishments.map((punishment, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.punishmentName')}
                          value={punishment.name}
                          onChange={(e) => handlePunishmentChange(index, 'name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.punishmentCondition')}
                          value={punishment.condition}
                          onChange={(e) => handlePunishmentChange(index, 'condition', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label={t('tournament.create.punishmentDescription')}
                          value={punishment.description}
                          onChange={(e) => handlePunishmentChange(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton onClick={() => removePunishment(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Button startIcon={<AddIcon />} onClick={addPunishment} variant="outlined">
                {t('tournament.create.addPunishment')}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? t('tournament.create.creating') : t('tournament.create.createButton')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateTournament;

