const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer le profil d'un utilisateur
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les infos de base
    const userResult = await pool.query(
      'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];

    // Récupérer tous les jeux disponibles (sauf ceux supprimés)
    const allGamesResult = await pool.query('SELECT * FROM games ORDER BY name');
    
    // Récupérer les jeux liés de l'utilisateur
    const linkedGamesResult = await pool.query(
      `SELECT uga.*, g.name as game_name, g.api_available 
       FROM user_game_accounts uga 
       JOIN games g ON uga.game_id = g.id 
       WHERE uga.user_id = $1 
       ORDER BY g.name`,
      [id]
    );

    // Créer un map des jeux liés
    const linkedGamesMap = {};
    linkedGamesResult.rows.forEach(game => {
      linkedGamesMap[game.game_id] = game;
    });

    // Combiner tous les jeux avec leur statut
    const gamesWithStatus = allGamesResult.rows.map(game => {
      const linkedGame = linkedGamesMap[game.id];
      return linkedGame || {
        id: null,
        game_id: game.id,
        game_name: game.name,
        game_username: null,
        game_account_id: null,
        api_data: null,
        api_available: game.api_available,
      };
    });

    // Récupérer les tournois en cours
    const ongoingTournamentsResult = await pool.query(
      `SELECT t.*, g.name as game_name 
       FROM tournaments t
       JOIN tournament_participants tp ON t.id = tp.tournament_id
       JOIN games g ON t.game_id = g.id
       WHERE tp.user_id = $1 AND t.status = 'ongoing'
       ORDER BY t.start_date DESC`,
      [id]
    );

    // Récupérer les tournois passés
    const pastTournamentsResult = await pool.query(
      `SELECT t.*, g.name as game_name 
       FROM tournaments t
       JOIN tournament_participants tp ON t.id = tp.tournament_id
       JOIN games g ON t.game_id = g.id
       WHERE tp.user_id = $1 AND t.status = 'completed'
       ORDER BY t.end_date DESC
       LIMIT 20`,
      [id]
    );

    res.json({
      ...user,
      games: gamesWithStatus,
      ongoingTournaments: ongoingTournamentsResult.rows,
      pastTournaments: pastTournamentsResult.rows,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur modifie son propre profil
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { username, avatar_url } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      // Vérifier que le username n'est pas déjà pris
      const existing = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà utilisé' });
      }
      updateFields.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, username, avatar_url, created_at`;
    
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

