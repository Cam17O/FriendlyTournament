const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const { findOrCreateUser } = require('../services/oauthService');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query('SELECT id, email, username, avatar_url FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${backendUrl}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser('google', profile.id, {
            email: profile.emails[0].value,
            username: profile.displayName,
            avatar: profile.photos[0]?.value,
            accessToken,
          });
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// Discord OAuth
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: `${backendUrl}/api/auth/discord/callback`,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser('discord', profile.id, {
            email: profile.email,
            username: profile.username,
            avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
            accessToken,
          });
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;

