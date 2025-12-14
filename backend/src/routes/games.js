const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { fetchPlayerStats, updateGameAccountStats } = require('../services/riotApi');

const router = express.Router();

// Récupérer tous les jeux disponibles
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des jeux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau jeu personnalisé
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom du jeu est requis' });
    }

    // Vérifier si le jeu existe déjà
    const existingResult = await pool.query('SELECT id FROM games WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Ce jeu existe déjà' });
    }

    // Créer le nouveau jeu
    const insertResult = await pool.query(
      'INSERT INTO games (name, api_available, api_endpoint) VALUES ($1, FALSE, NULL) RETURNING *',
      [name.trim()]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création du jeu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un jeu (seulement si aucun compte n'est lié)
router.delete('/:gameId', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;

    // Vérifier si des comptes sont liés à ce jeu
    const accountsResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_game_accounts WHERE game_id = $1',
      [gameId]
    );

    if (parseInt(accountsResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer ce jeu car des comptes y sont liés' });
    }

    // Vérifier si le jeu existe
    const gameResult = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Jeu non trouvé' });
    }

    await pool.query('DELETE FROM games WHERE id = $1', [gameId]);
    res.json({ message: 'Jeu supprimé' });
  } catch (error) {
    console.error('Erreur lors de la suppression du jeu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer tous les jeux avec leur statut pour un utilisateur
router.get('/user/:userId/status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur demande ses propres jeux
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer tous les jeux
    const allGamesResult = await pool.query('SELECT * FROM games ORDER BY name');
    
    // Récupérer les jeux liés de l'utilisateur
    const linkedGamesResult = await pool.query(
      `SELECT uga.*, g.name as game_name, g.api_available 
       FROM user_game_accounts uga 
       JOIN games g ON uga.game_id = g.id 
       WHERE uga.user_id = $1`,
      [userId]
    );

    // Créer un map des jeux liés
    const linkedGamesMap = {};
    linkedGamesResult.rows.forEach(game => {
      linkedGamesMap[game.game_id] = game;
    });

    // Combiner tous les jeux avec leur statut
    const gamesWithStatus = allGamesResult.rows.map(game => {
      const linkedGame = linkedGamesMap[game.id];
      return {
        id: game.id,
        name: game.name,
        api_available: game.api_available,
        api_endpoint: game.api_endpoint,
        linked: !!linkedGame,
        account: linkedGame ? {
          id: linkedGame.id,
          game_username: linkedGame.game_username,
          game_account_id: linkedGame.game_account_id,
          api_data: linkedGame.api_data,
        } : null
      };
    });

    res.json(gamesWithStatus);
  } catch (error) {
    console.error('Erreur lors de la récupération des jeux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lier un compte de jeu (avec API ou manuel)
router.post('/link', authenticateToken, async (req, res) => {
  try {
    const { gameId, gameUsername, gameAccountId, rank, elo } = req.body;

    if (!gameId || !gameUsername) {
      return res.status(400).json({ error: 'gameId et gameUsername requis' });
    }

    // Vérifier si le jeu existe
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Jeu non trouvé' });
    }

    const game = gameResult.rows[0];
    let apiData = null;

    // Si c'est League of Legends et que l'API est disponible, récupérer les stats
    if (game.api_available && game.name === 'League of Legends') {
      try {
        // Valider le format Riot ID pour League of Legends
        if (!gameUsername.includes('#')) {
          return res.status(400).json({ 
            error: 'Pour League of Legends, utilisez votre Riot ID au format: NomDuJoueur#TAG (ex: Cam17OO#EUW)' 
          });
        }
        
        const stats = await fetchPlayerStats(gameUsername);
        apiData = JSON.stringify(stats);
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        return res.status(400).json({ 
          error: error.message || 'Erreur lors de la récupération des statistiques. Vérifiez votre Riot ID.' 
        });
      }
    } else {
      // Pour les jeux sans API, créer un objet avec les données manuelles
      apiData = JSON.stringify({
        game_username: gameUsername,
        rank: rank || null,
        elo: elo || null,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Vérifier si le compte est déjà lié
    const existingResult = await pool.query(
      'SELECT id FROM user_game_accounts WHERE user_id = $1 AND game_id = $2',
      [req.user.id, gameId]
    );

    if (existingResult.rows.length > 0) {
      // Mettre à jour le compte existant
      await pool.query(
        'UPDATE user_game_accounts SET game_username = $1, game_account_id = $2, api_data = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [gameUsername, gameAccountId || null, apiData, existingResult.rows[0].id]
      );
      res.json({ message: 'Compte mis à jour' });
    } else {
      // Créer un nouveau lien
      const insertResult = await pool.query(
        'INSERT INTO user_game_accounts (user_id, game_id, game_username, game_account_id, api_data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [req.user.id, gameId, gameUsername, gameAccountId || null, apiData]
      );
      res.status(201).json(insertResult.rows[0]);
    }
  } catch (error) {
    console.error('Erreur lors du lien du compte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un compte de jeu
router.delete('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Vérifier que le compte appartient à l'utilisateur
    const accountResult = await pool.query(
      'SELECT id FROM user_game_accounts WHERE id = $1 AND user_id = $2',
      [accountId, req.user.id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    await pool.query('DELETE FROM user_game_accounts WHERE id = $1', [accountId]);
    res.json({ message: 'Compte supprimé' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour les stats d'un compte (pour League of Legends)
router.post('/:accountId/update-stats', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Vérifier que le compte appartient à l'utilisateur
    const accountResult = await pool.query(
      'SELECT uga.*, g.name as game_name FROM user_game_accounts uga JOIN games g ON uga.game_id = g.id WHERE uga.id = $1 AND uga.user_id = $2',
      [accountId, req.user.id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    const account = accountResult.rows[0];

    if (account.game_name !== 'League of Legends' || !account.api_data) {
      return res.status(400).json({ error: 'Ce compte ne supporte pas la mise à jour automatique' });
    }

    const stats = await updateGameAccountStats(accountId);
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des stats:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Récupérer les comptes de jeux d'un utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur demande ses propres comptes ou est admin
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const result = await pool.query(
      `SELECT uga.*, g.name as game_name, g.api_available 
       FROM user_game_accounts uga 
       JOIN games g ON uga.game_id = g.id 
       WHERE uga.user_id = $1 
       ORDER BY g.name`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
