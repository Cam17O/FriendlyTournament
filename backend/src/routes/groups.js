const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Fonction helper pour vérifier les droits admin
const checkAdminAccess = async (groupId, userId) => {
  // Vérifier si c'est le créateur
  const creatorCheck = await pool.query(
    'SELECT id FROM groups WHERE id = $1 AND creator_id = $2',
    [groupId, userId]
  );

  if (creatorCheck.rows.length > 0) {
    return true;
  }

  // Vérifier si c'est un admin
  const adminCheck = await pool.query(
    'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = $3 AND status = $4',
    [groupId, userId, 'admin', 'accepted']
  );

  return adminCheck.rows.length > 0;
};

// Récupérer tous les groupes de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT g.*, 
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND status = 'accepted') + 
              CASE WHEN g.creator_id = $1 THEN 1 ELSE 0 END as member_count,
              (SELECT COUNT(*) FROM group_games WHERE group_id = g.id) as game_count
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.creator_id = $1 
          OR gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un groupe spécifique avec ses membres et jeux
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur est membre du groupe
    const memberCheck = await pool.query(
      `SELECT gm.*, g.* 
       FROM group_members gm 
       JOIN groups g ON gm.group_id = g.id 
       WHERE gm.group_id = $1 AND gm.user_id = $2`,
      [id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      // Vérifier si c'est le créateur
      const creatorCheck = await pool.query(
        'SELECT * FROM groups WHERE id = $1 AND creator_id = $2',
        [id, req.user.id]
      );
      if (creatorCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    // Récupérer les infos du groupe
    const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    const group = groupResult.rows[0];

    // Récupérer les membres (inclure le créateur même s'il n'est pas dans group_members)
    const membersResult = await pool.query(
      `WITH creator_member AS (
         SELECT 
           0 as id,
           g.id as group_id,
           u.id as user_id,
           u.username,
           u.avatar_url,
           u.email,
           'admin' as role,
           'accepted' as status,
           NULL::integer as invited_by,
           g.created_at as joined_at,
           g.created_at
         FROM groups g
         JOIN users u ON g.creator_id = u.id
         WHERE g.id = $1
       ),
       other_members AS (
         SELECT 
           gm.id,
           gm.group_id,
           u.id as user_id,
           u.username,
           u.avatar_url,
           u.email,
           gm.role,
           gm.status,
           gm.invited_by,
           gm.joined_at,
           gm.created_at
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         JOIN groups g ON g.id = $1
         WHERE gm.group_id = $1 AND u.id != g.creator_id
       ),
       all_members AS (
         SELECT * FROM creator_member
         UNION ALL
         SELECT * FROM other_members
       )
       SELECT * FROM all_members
       ORDER BY 
         CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
         joined_at DESC NULLS LAST`,
      [parseInt(id)]
    );

    // Récupérer les jeux du groupe
    const gamesResult = await pool.query(
      `SELECT g.*, gg.id as group_game_id
       FROM games g
       JOIN group_games gg ON g.id = gg.game_id
       WHERE gg.group_id = $1
       ORDER BY g.name`,
      [id]
    );

    // Vérifier le rôle de l'utilisateur
    const userMember = memberCheck.rows[0] || { role: 'admin' }; // Le créateur est admin par défaut

    res.json({
      ...group,
      members: membersResult.rows,
      games: gamesResult.rows,
      userRole: userMember.role || (group.creator_id === req.user.id ? 'admin' : null),
      isCreator: group.creator_id === req.user.id,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du groupe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un groupe
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom du groupe est requis' });
    }

    const result = await pool.query(
      'INSERT INTO groups (name, description, creator_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description || null, req.user.id]
    );

    const group = result.rows[0];

    // Ajouter le créateur comme admin
    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role, status, joined_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
      [group.id, req.user.id, 'admin', 'accepted']
    );

    res.status(201).json(group);
  } catch (error) {
    console.error('Erreur lors de la création du groupe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Inviter un ami dans un groupe
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'friendId requis' });
    }

    // Vérifier que l'utilisateur est admin du groupe
    const isAdmin = await checkAdminAccess(id, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Seuls les admins peuvent inviter des membres' });
    }

    // Vérifier que c'est bien un ami
    const friendshipCheck = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [req.user.id, friendId]
    );

    if (friendshipCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Vous ne pouvez inviter que vos amis' });
    }

    // Vérifier si l'utilisateur n'est pas déjà membre
    const existingCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, friendId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cet utilisateur est déjà membre ou a déjà été invité' });
    }

    // Créer l'invitation
    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role, status, invited_by) VALUES ($1, $2, $3, $4, $5)',
      [id, friendId, 'member', 'pending', req.user.id]
    );

    res.json({ message: 'Invitation envoyée' });
  } catch (error) {
    console.error('Erreur lors de l\'invitation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Accepter une invitation
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE group_members SET status = $1, joined_at = CURRENT_TIMESTAMP WHERE group_id = $2 AND user_id = $3 AND status = $4 RETURNING *',
      ['accepted', id, req.user.id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    res.json({ message: 'Invitation acceptée' });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Refuser une invitation
router.post('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE group_members SET status = $1 WHERE group_id = $2 AND user_id = $3 AND status = $4 RETURNING *',
      ['declined', id, req.user.id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    res.json({ message: 'Invitation refusée' });
  } catch (error) {
    console.error('Erreur lors du refus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Quitter un groupe
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que ce n'est pas le créateur
    const groupCheck = await pool.query(
      'SELECT creator_id FROM groups WHERE id = $1',
      [id]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    if (groupCheck.rows[0].creator_id === req.user.id) {
      return res.status(400).json({ error: 'Le créateur ne peut pas quitter le groupe' });
    }

    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Groupe quitté' });
  } catch (error) {
    console.error('Erreur lors de la sortie du groupe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un jeu au groupe (admin seulement)
router.post('/:id/games', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId requis' });
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = await checkAdminAccess(id, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Seuls les admins peuvent gérer les jeux' });
    }

    // Vérifier que le jeu existe
    const gameCheck = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Jeu non trouvé' });
    }

    // Ajouter le jeu au groupe
    await pool.query(
      'INSERT INTO group_games (group_id, game_id) VALUES ($1, $2) ON CONFLICT (group_id, game_id) DO NOTHING',
      [id, gameId]
    );

    res.json({ message: 'Jeu ajouté au groupe' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du jeu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Retirer un jeu du groupe (admin seulement)
router.delete('/:id/games/:gameId', authenticateToken, async (req, res) => {
  try {
    const { id, gameId } = req.params;

    // Vérifier que l'utilisateur est admin
    const isAdmin = await checkAdminAccess(id, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Seuls les admins peuvent gérer les jeux' });
    }

    await pool.query(
      'DELETE FROM group_games WHERE group_id = $1 AND game_id = $2',
      [id, gameId]
    );

    res.json({ message: 'Jeu retiré du groupe' });
  } catch (error) {
    console.error('Erreur lors du retrait du jeu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les profils du groupe classés par jeu et elo
router.get('/:id/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { gameId } = req.query;

    // Vérifier que l'utilisateur est membre du groupe
    const memberCheck = await pool.query(
      `SELECT * FROM group_members 
       WHERE group_id = $1 AND user_id = $2 AND status = 'accepted'
       UNION
       SELECT NULL, $1, $2, 'admin', 'accepted', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       WHERE EXISTS (SELECT 1 FROM groups WHERE id = $1 AND creator_id = $2)`,
      [id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer les membres acceptés (inclure le créateur)
    const membersResult = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.avatar_url
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1 AND gm.status = 'accepted'
       UNION
       SELECT u.id, u.username, u.avatar_url
       FROM groups g
       JOIN users u ON g.creator_id = u.id
       WHERE g.id = $1
       AND NOT EXISTS (
         SELECT 1 FROM group_members gm2 
         WHERE gm2.group_id = $1 AND gm2.user_id = u.id
       )`,
      [id]
    );

    const members = membersResult.rows;
    const memberIds = members.map(m => m.id);

    if (memberIds.length === 0) {
      return res.json([]);
    }

    // Récupérer les comptes de jeux des membres
    let query = `
      SELECT uga.*, g.name as game_name, g.api_available, u.username, u.avatar_url
      FROM user_game_accounts uga
      JOIN games g ON uga.game_id = g.id
      JOIN users u ON uga.user_id = u.id
      WHERE uga.user_id = ANY($1::int[])
    `;

    const params = [memberIds];

    if (gameId) {
      query += ' AND uga.game_id = $2';
      params.push(gameId);
    }

    query += ' ORDER BY g.name, uga.api_data';

    const accountsResult = await pool.query(query, params);

    // Parser les données et classer par elo
    const leaderboard = accountsResult.rows.map(account => {
      let stats = null;
      let elo = null;

      if (account.api_data) {
        try {
          stats = typeof account.api_data === 'string' 
            ? JSON.parse(account.api_data) 
            : account.api_data;
          
          // Extraire l'elo selon le type de jeu
          if (account.game_name === 'League of Legends' && stats.rank) {
            // Pour LoL, utiliser les LP comme elo
            elo = stats.rank.leaguePoints || 0;
          } else if (stats.elo) {
            elo = parseInt(stats.elo) || 0;
          } else if (stats.rank && typeof stats.rank === 'object' && stats.rank.rating) {
            elo = parseInt(stats.rank.rating) || 0;
          }
        } catch (e) {
          console.error('Error parsing api_data:', e);
        }
      }

      return {
        ...account,
        stats,
        elo: elo || 0,
      };
    });

    // Grouper par jeu et trier par elo décroissant
    const groupedByGame = {};
    leaderboard.forEach(account => {
      if (!groupedByGame[account.game_name]) {
        groupedByGame[account.game_name] = [];
      }
      groupedByGame[account.game_name].push(account);
    });

    // Trier chaque groupe par elo décroissant
    Object.keys(groupedByGame).forEach(gameName => {
      groupedByGame[gameName].sort((a, b) => (b.elo || 0) - (a.elo || 0));
    });

    // Reconstruire la liste triée par nom de jeu
    const sortedGames = Object.keys(groupedByGame).sort();
    const sortedLeaderboard = [];
    sortedGames.forEach(gameName => {
      sortedLeaderboard.push(...groupedByGame[gameName]);
    });

    res.json(sortedLeaderboard);
  } catch (error) {
    console.error('Erreur lors de la récupération du leaderboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
