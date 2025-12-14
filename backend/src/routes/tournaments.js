const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer tous les tournois
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, g.name as game_name, u.username as creator_name,
       (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
       FROM tournaments t
       JOIN games g ON t.game_id = g.id
       JOIN users u ON t.creator_id = u.id
       ORDER BY t.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des tournois:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un tournoi spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les infos du tournoi
    const tournamentResult = await pool.query(
      `SELECT t.*, g.name as game_name, u.username as creator_name, u.id as creator_id
       FROM tournaments t
       JOIN games g ON t.game_id = g.id
       JOIN users u ON t.creator_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournoi non trouvé' });
    }

    const tournament = tournamentResult.rows[0];

    // Récupérer les objectifs
    const objectivesResult = await pool.query(
      'SELECT * FROM tournament_objectives WHERE tournament_id = $1',
      [id]
    );

    // Récupérer les récompenses
    const rewardsResult = await pool.query(
      'SELECT * FROM tournament_rewards WHERE tournament_id = $1 ORDER BY position',
      [id]
    );

    // Récupérer les punitions
    const punishmentsResult = await pool.query(
      'SELECT * FROM tournament_punishments WHERE tournament_id = $1',
      [id]
    );

    // Récupérer les participants
    const participantsResult = await pool.query(
      `SELECT tp.*, u.id as user_id, u.username, u.avatar_url, uga.api_data
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       LEFT JOIN user_game_accounts uga ON u.id = uga.user_id AND uga.game_id = $2
       WHERE tp.tournament_id = $1`,
      [id, tournament.game_id]
    );

    // Récupérer les admins
    const adminsResult = await pool.query(
      `SELECT ta.*, u.username
       FROM tournament_admins ta
       JOIN users u ON ta.user_id = u.id
       WHERE ta.tournament_id = $1`,
      [id]
    );

    res.json({
      ...tournament,
      objectives: objectivesResult.rows,
      rewards: rewardsResult.rows,
      punishments: punishmentsResult.rows,
      participants: participantsResult.rows,
      admins: adminsResult.rows,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du tournoi:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un tournoi
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      name,
      description,
      gameId,
      startDate,
      endDate,
      objectives,
      rewards,
      punishments,
      participantIds,
    } = req.body;

    if (!name || !gameId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    await client.query('BEGIN');

    // Créer le tournoi
    const tournamentResult = await client.query(
      `INSERT INTO tournaments (creator_id, name, description, game_id, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'upcoming')
       RETURNING *`,
      [req.user.id, name, description || null, gameId, startDate, endDate]
    );

    const tournament = tournamentResult.rows[0];

    // Ajouter le créateur comme admin
    await client.query(
      'INSERT INTO tournament_admins (tournament_id, user_id) VALUES ($1, $2)',
      [tournament.id, req.user.id]
    );

    // Ajouter les objectifs
    if (objectives && objectives.length > 0) {
      for (const objective of objectives) {
        await client.query(
          'INSERT INTO tournament_objectives (tournament_id, type, target_value, description) VALUES ($1, $2, $3, $4)',
          [tournament.id, objective.type, objective.targetValue || null, objective.description || null]
        );
      }
    }

    // Ajouter les récompenses
    if (rewards && rewards.length > 0) {
      for (const reward of rewards) {
        await client.query(
          'INSERT INTO tournament_rewards (tournament_id, name, description, position) VALUES ($1, $2, $3, $4)',
          [tournament.id, reward.name, reward.description || null, reward.position || null]
        );
      }
    }

    // Ajouter les punitions
    if (punishments && punishments.length > 0) {
      for (const punishment of punishments) {
        await client.query(
          'INSERT INTO tournament_punishments (tournament_id, name, description, condition) VALUES ($1, $2, $3, $4)',
          [tournament.id, punishment.name, punishment.description || null, punishment.condition || null]
        );
      }
    }

    // Ajouter le créateur comme participant
    await client.query(
      'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2)',
      [tournament.id, req.user.id]
    );

    // Ajouter les autres participants
    if (participantIds && participantIds.length > 0) {
      for (const userId of participantIds) {
        if (userId !== req.user.id) {
          await client.query(
            'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [tournament.id, userId]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json(tournament);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du tournoi:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Mettre à jour un tournoi (admins uniquement)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier les droits admin
    const adminCheck = await pool.query(
      'SELECT * FROM tournament_admins WHERE tournament_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      status,
      objectives,
      rewards,
      punishments,
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Mettre à jour le tournoi
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (startDate !== undefined) {
        updateFields.push(`start_date = $${paramCount++}`);
        values.push(startDate);
      }
      if (endDate !== undefined) {
        updateFields.push(`end_date = $${paramCount++}`);
        values.push(endDate);
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        await client.query(
          `UPDATE tournaments SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }

      // Mettre à jour les objectifs si fournis
      if (objectives !== undefined) {
        await client.query('DELETE FROM tournament_objectives WHERE tournament_id = $1', [id]);
        for (const objective of objectives) {
          await client.query(
            'INSERT INTO tournament_objectives (tournament_id, type, target_value, description) VALUES ($1, $2, $3, $4)',
            [id, objective.type, objective.targetValue || null, objective.description || null]
          );
        }
      }

      // Mettre à jour les récompenses si fournies
      if (rewards !== undefined) {
        await client.query('DELETE FROM tournament_rewards WHERE tournament_id = $1', [id]);
        for (const reward of rewards) {
          await client.query(
            'INSERT INTO tournament_rewards (tournament_id, name, description, position) VALUES ($1, $2, $3, $4)',
            [id, reward.name, reward.description || null, reward.position || null]
          );
        }
      }

      // Mettre à jour les punitions si fournies
      if (punishments !== undefined) {
        await client.query('DELETE FROM tournament_punishments WHERE tournament_id = $1', [id]);
        for (const punishment of punishments) {
          await client.query(
            'INSERT INTO tournament_punishments (tournament_id, name, description, condition) VALUES ($1, $2, $3, $4)',
            [id, punishment.name, punishment.description || null, punishment.condition || null]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Tournoi mis à jour' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du tournoi:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rejoindre un tournoi
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le tournoi existe
    const tournamentResult = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournoi non trouvé' });
    }

    // Vérifier que l'utilisateur n'est pas déjà participant
    const existing = await pool.query(
      'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Vous êtes déjà participant' });
    }

    await pool.query(
      'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2)',
      [id, req.user.id]
    );

    res.json({ message: 'Vous avez rejoint le tournoi' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du participant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un admin (seulement pour les admins existants)
router.post('/:id/admins', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Vérifier les droits admin
    const adminCheck = await pool.query(
      'SELECT * FROM tournament_admins WHERE tournament_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Vérifier que l'utilisateur est participant
    const participantCheck = await pool.query(
      'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(400).json({ error: 'L\'utilisateur doit être participant' });
    }

    await pool.query(
      'INSERT INTO tournament_admins (tournament_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, userId]
    );

    res.json({ message: 'Admin ajouté' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

