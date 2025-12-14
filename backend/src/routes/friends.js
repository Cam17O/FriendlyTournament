const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer les amis d'un utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Récupérer les amis acceptés
    const friendsResult = await pool.query(
      `SELECT 
        CASE 
          WHEN f.user_id = $1 THEN f.friend_id
          ELSE f.user_id
        END as friend_id,
        u.username,
        u.avatar_url,
        f.status,
        f.created_at
       FROM friendships f
       JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) = u.id
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
       ORDER BY u.username`,
      [req.user.id]
    );

    // Récupérer les demandes en attente (reçues)
    const pendingReceivedResult = await pool.query(
      `SELECT f.*, u.username, u.avatar_url
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    // Récupérer les demandes en attente (envoyées)
    const pendingSentResult = await pool.query(
      `SELECT f.*, u.username, u.avatar_url
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json({
      friends: friendsResult.rows,
      pendingReceived: pendingReceivedResult.rows,
      pendingSent: pendingSentResult.rows,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des amis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer une demande d'amitié
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'friendId requis' });
    }

    if (parseInt(friendId) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous ajouter vous-même' });
    }

    // Vérifier que l'utilisateur existe
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [friendId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si une demande existe déjà
    const existingResult = await pool.query(
      `SELECT * FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [req.user.id, friendId]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Vous êtes déjà amis' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Demande déjà envoyée' });
      }
    }

    // Créer la demande
    await pool.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [req.user.id, friendId, 'pending']
    );

    res.json({ message: 'Demande d\'amitié envoyée' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Accepter une demande d'amitié
router.post('/accept/:friendshipId', authenticateToken, async (req, res) => {
  try {
    const { friendshipId } = req.params;

    // Vérifier que la demande existe et appartient à l'utilisateur
    const friendshipResult = await pool.query(
      'SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
      [friendshipId, req.user.id, 'pending']
    );

    if (friendshipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Accepter la demande
    await pool.query(
      'UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['accepted', friendshipId]
    );

    res.json({ message: 'Demande acceptée' });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Refuser/Supprimer une demande d'amitié
router.delete('/:friendshipId', authenticateToken, async (req, res) => {
  try {
    const { friendshipId } = req.params;

    // Vérifier que la demande existe et appartient à l'utilisateur
    const friendshipResult = await pool.query(
      'SELECT * FROM friendships WHERE id = $1 AND (user_id = $2 OR friend_id = $2)',
      [friendshipId, req.user.id]
    );

    if (friendshipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Supprimer la demande
    await pool.query('DELETE FROM friendships WHERE id = $1', [friendshipId]);

    res.json({ message: 'Demande supprimée' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rechercher des utilisateurs
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Requête de recherche trop courte' });
    }

    const result = await pool.query(
      `SELECT id, username, avatar_url, created_at
       FROM users
       WHERE username ILIKE $1 AND id != $2
       ORDER BY username
       LIMIT 20`,
      [`%${q}%`, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

