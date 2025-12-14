-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    username VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OAuth accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id)
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    api_available BOOLEAN DEFAULT FALSE,
    api_endpoint VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user game accounts table
CREATE TABLE IF NOT EXISTS user_game_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    game_username VARCHAR(255) NOT NULL,
    game_account_id VARCHAR(255),
    api_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id, game_account_id)
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tournament objectives table
CREATE TABLE IF NOT EXISTS tournament_objectives (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    target_value VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tournament rewards table
CREATE TABLE IF NOT EXISTS tournament_rewards (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tournament punishments table
CREATE TABLE IF NOT EXISTS tournament_punishments (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    condition TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tournament participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(tournament_id, user_id)
);

-- Create tournament admins table
CREATE TABLE IF NOT EXISTS tournament_admins (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, user_id)
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Create tournament stats table
CREATE TABLE IF NOT EXISTS tournament_stats (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
    stat_type VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_accounts_user_id ON user_game_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_accounts_game_id ON user_game_accounts(game_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id ON tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_game_id ON tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_admins_tournament_id ON tournament_admins(tournament_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_tournament_stats_participant_id ON tournament_stats(participant_id);

-- Insert default games
INSERT INTO games (name, api_available, api_endpoint) VALUES
    ('League of Legends', TRUE, 'https://euw1.api.riotgames.com'),
    ('Valorant', FALSE, NULL),
    ('Counter-Strike 2', FALSE, NULL),
    ('Rocket League', FALSE, NULL)
ON CONFLICT (name) DO NOTHING;

