const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const findOrCreateUser = async (provider, providerId, profile) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Chercher un compte OAuth existant
    const oauthResult = await client.query(
      'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_id = $2',
      [provider, providerId]
    );

    if (oauthResult.rows.length > 0) {
      const userId = oauthResult.rows[0].user_id;
      const userResult = await client.query(
        'SELECT id, email, username, avatar_url FROM users WHERE id = $1',
        [userId]
      );
      await client.query('COMMIT');
      return userResult.rows[0];
    }

    // Chercher un utilisateur avec le même email
    let userResult = await client.query(
      'SELECT id, email, username, avatar_url FROM users WHERE email = $1',
      [profile.email]
    );

    let user;
    if (userResult.rows.length > 0) {
      // Utilisateur existe, lier le compte OAuth
      user = userResult.rows[0];
      await client.query(
        'INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES ($1, $2, $3, $4)',
        [user.id, provider, providerId, profile.accessToken || null]
      );
    } else {
      // Créer un nouvel utilisateur
      const username = profile.username || profile.displayName || profile.email.split('@')[0];
      const insertResult = await client.query(
        'INSERT INTO users (email, username, avatar_url) VALUES ($1, $2, $3) RETURNING id, email, username, avatar_url',
        [profile.email, username, profile.avatar || null]
      );
      user = insertResult.rows[0];

      // Créer le compte OAuth
      await client.query(
        'INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES ($1, $2, $3, $4)',
        [user.id, provider, providerId, profile.accessToken || null]
      );
    }

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { findOrCreateUser, generateToken };

