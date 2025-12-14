const axios = require('axios');
const pool = require('../config/database');

const RIOT_API_BASE = 'https://euw1.api.riotgames.com';
const RIOT_API_ACCOUNT_BASE = 'https://europe.api.riotgames.com'; // Pour l'API Account v1
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Vérifier que la clé API est présente au démarrage
if (!RIOT_API_KEY) {
  console.warn('⚠️  RIOT_API_KEY n\'est pas définie dans les variables d\'environnement');
} else {
  console.log('✅ RIOT_API_KEY chargée (longueur:', RIOT_API_KEY.length, 'caractères)');
}

// Rate limiting: 100 requests per 2 minutes
let requestCount = 0;
let resetTime = Date.now() + 120000;

const checkRateLimit = () => {
  const now = Date.now();
  if (now > resetTime) {
    requestCount = 0;
    resetTime = now + 120000;
  }
  if (requestCount >= 100) {
    throw new Error('Rate limit atteint pour l\'API Riot Games');
  }
  requestCount++;
};

const makeRiotRequest = async (endpoint) => {
  if (!RIOT_API_KEY) {
    throw new Error('Clé API Riot Games non configurée. Vérifiez votre fichier .env');
  }
  
  checkRateLimit();
  try {
    const response = await axios.get(`${RIOT_API_BASE}${endpoint}`, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Joueur non trouvé');
    }
    if (error.response?.status === 403) {
      console.error('❌ Erreur 403 - Clé API invalide ou expirée');
      console.error('Vérifiez que RIOT_API_KEY est correctement définie dans votre .env');
      throw new Error('Clé API invalide ou expirée. Vérifiez votre clé API Riot Games dans le fichier .env');
    }
    if (error.response?.status === 401) {
      throw new Error('Clé API non autorisée');
    }
    throw new Error(`Erreur API Riot: ${error.message}`);
  }
};

// Récupérer le compte par Riot ID (nouveau format: GameName#Tagline)
const getAccountByRiotId = async (gameName, tagLine) => {
  if (!RIOT_API_KEY) {
    throw new Error('Clé API Riot Games non configurée. Vérifiez votre fichier .env');
  }
  
  checkRateLimit();
  
  // L'API Account v1 nécessite la région "europe" pour EUW
  const url = `${RIOT_API_ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  
  console.log(`🔍 Tentative de récupération du compte Riot ID: ${gameName}#${tagLine}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
      },
      validateStatus: (status) => status < 500, // Ne pas throw pour les erreurs 4xx
    });
    
    if (response.status === 200) {
      console.log('✅ Compte Riot ID récupéré avec succès');
      return response.data;
    }
    
    // Gérer les erreurs HTTP
    if (response.status === 404) {
      throw new Error('Joueur non trouvé avec ce Riot ID. Vérifiez que le Riot ID est correct (format: NomDuJoueur#TAG)');
    }
    
    if (response.status === 403) {
      console.error('❌ Erreur 403 - Détails:', response.data);
      console.error('🔑 Clé API utilisée (premiers 10 caractères):', RIOT_API_KEY.substring(0, 10) + '...');
      throw new Error('Clé API invalide ou expirée. Les clés de développement expirent après 24h. Générez une nouvelle clé sur https://developer.riotgames.com/');
    }
    
    if (response.status === 401) {
      throw new Error('Clé API non autorisée. Vérifiez que votre clé a accès à l\'API Account v1');
    }
    
    throw new Error(`Erreur API Riot (${response.status}): ${JSON.stringify(response.data)}`);
  } catch (error) {
    if (error.response) {
      // Erreur HTTP avec réponse
      if (error.response.status === 403) {
        console.error('❌ Erreur 403 - Détails:', error.response.data);
        throw new Error('Clé API invalide ou expirée. Les clés de développement expirent après 24h. Générez une nouvelle clé sur https://developer.riotgames.com/');
      }
      throw new Error(`Erreur API Riot (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    }
    // Erreur réseau ou autre
    throw error;
  }
};

// Récupérer le summoner par puuid (pour compatibilité)
const getSummonerByPuuid = async (puuid) => {
  if (!RIOT_API_KEY) {
    throw new Error('Clé API Riot Games non configurée. Vérifiez votre fichier .env');
  }
  
  checkRateLimit();
  
  console.log(`🔍 Récupération du summoner pour puuid: ${puuid.substring(0, 10)}...`);
  
  try {
    const response = await axios.get(
      `${RIOT_API_BASE}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
        validateStatus: (status) => status < 500,
      }
    );
    
    if (response.status === 200) {
      console.log('✅ Summoner récupéré avec succès');
      return response.data;
    }
    
    if (response.status === 403) {
      console.error('❌ Erreur 403 lors de la récupération du summoner');
      throw new Error('Clé API invalide ou expirée pour l\'API Summoner v4');
    }
    
    throw new Error(`Erreur API Riot (${response.status}): ${JSON.stringify(response.data)}`);
  } catch (error) {
    if (error.response) {
      if (error.response.status === 403) {
        throw new Error('Clé API invalide ou expirée. Les clés de développement expirent après 24h.');
      }
      throw new Error(`Erreur API Riot (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Récupérer le summoner ID par nom d'utilisateur (ancienne méthode, pour compatibilité)
const getSummonerByName = async (summonerName) => {
  const encodedName = encodeURIComponent(summonerName);
  return await makeRiotRequest(`/lol/summoner/v4/summoners/by-name/${encodedName}`);
};

// Récupérer le rank du joueur par PUUID (méthode recommandée)
const getRankByPuuid = async (puuid) => {
  if (!RIOT_API_KEY) {
    throw new Error('Clé API Riot Games non configurée. Vérifiez votre fichier .env');
  }
  
  checkRateLimit();
  
  console.log(`🏆 Récupération du rank pour puuid: ${puuid.substring(0, 10)}...`);
  
  try {
    // Utiliser by-puuid au lieu de by-summoner (plus fiable et disponible)
    const response = await axios.get(
      `${RIOT_API_BASE}/lol/league/v4/entries/by-puuid/${puuid}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
        validateStatus: (status) => status < 500,
      }
    );
    
    if (response.status === 200) {
      // Trouver le rank en Ranked Solo/Duo
      const soloQueue = response.data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
      if (soloQueue) {
        console.log(`✅ Rank trouvé: ${soloQueue.tier} ${soloQueue.rank}`);
      } else {
        console.log(`ℹ️  Aucun rank Solo/Duo trouvé`);
      }
      return soloQueue || null;
    }
    
    if (response.status === 403) {
      console.error('❌ Erreur 403 lors de la récupération du rank');
      console.error('📋 Réponse:', JSON.stringify(response.data, null, 2));
      // Ne pas bloquer si on ne peut pas récupérer le rank, continuer sans
      console.warn('⚠️  Impossible de récupérer le rank, mais on continue sans');
      return null;
    }
    
    // Si 404, le joueur n'a pas de rank (normal)
    if (response.status === 404) {
      console.log(`ℹ️  Aucun rank trouvé (404)`);
      return null;
    }
    
    console.warn(`⚠️  Erreur ${response.status} lors de la récupération du rank, on continue sans`);
    return null;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 403) {
        console.warn('⚠️  Clé API n\'a pas accès à l\'API League v4, on continue sans le rank');
        return null; // Ne pas bloquer, continuer sans le rank
      }
      if (error.response.status === 404) {
        return null; // Pas de rank, c'est normal
      }
      console.warn(`⚠️  Erreur ${error.response.status}, on continue sans le rank`);
      return null;
    }
    console.warn('⚠️  Erreur lors de la récupération du rank, on continue sans');
    return null; // Ne pas bloquer pour une erreur de rank
  }
};

// Récupérer le rank par summoner ID (ancienne méthode, pour compatibilité)
const getRankBySummonerId = async (summonerId) => {
  // Utiliser getRankByPuuid à la place si on a le puuid
  // Sinon, essayer l'ancienne méthode
  if (!RIOT_API_KEY) {
    throw new Error('Clé API Riot Games non configurée. Vérifiez votre fichier .env');
  }
  
  checkRateLimit();
  
  try {
    const response = await axios.get(
      `${RIOT_API_BASE}/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
        validateStatus: (status) => status < 500,
      }
    );
    
    if (response.status === 200) {
      const soloQueue = response.data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
      return soloQueue || null;
    }
    
    if (response.status === 403) {
      console.warn('⚠️  Méthode by-summoner non disponible, essayez by-puuid');
      return null;
    }
    
    if (response.status === 404) {
      return null;
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️  Erreur lors de la récupération du rank par summoner ID');
    return null;
  }
};

// Récupérer les stats de match récents
const getMatchHistory = async (puuid, count = 10) => {
  // D'abord récupérer le puuid depuis le summoner
  // Puis utiliser l'API match v5
  // Note: L'API match v5 nécessite une région différente (europe)
  const matchApiBase = 'https://europe.api.riotgames.com';
  checkRateLimit();
  
  try {
    const response = await axios.get(
      `${matchApiBase}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return [];
  }
};

// Fonction principale pour récupérer toutes les stats d'un joueur
// Supporte les deux formats : Riot ID (GameName#Tagline) ou ancien Summoner Name
const fetchPlayerStats = async (playerIdentifier) => {
  try {
    let puuid;
    let summoner;
    let riotId = null;

    // Vérifier si c'est un Riot ID (format: GameName#Tagline)
    if (playerIdentifier.includes('#')) {
      const [gameName, tagLine] = playerIdentifier.split('#');
      
      // 1. Récupérer le compte via Riot ID (nouvelle méthode)
      const account = await getAccountByRiotId(gameName, tagLine);
      puuid = account.puuid;
      riotId = {
        gameName: account.gameName,
        tagLine: account.tagLine,
      };

      // 2. Récupérer les infos du summoner via puuid
      summoner = await getSummonerByPuuid(puuid);
    } else {
      // Ancienne méthode : utiliser le summoner name
      summoner = await getSummonerByName(playerIdentifier);
      puuid = summoner.puuid;
    }
    
    // 3. Récupérer le rank (utiliser puuid au lieu de summoner ID - plus fiable)
    console.log(`🏆 Récupération du classement...`);
    const rankData = await getRankByPuuid(puuid);
    
    // 4. Construire les données à retourner
    const stats = {
      summonerId: summoner.id,
      accountId: summoner.accountId,
      puuid: puuid,
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      riotId: riotId, // Nouveau format Riot ID
      rank: rankData
        ? {
            tier: rankData.tier,
            rank: rankData.rank,
            leaguePoints: rankData.leaguePoints,
            wins: rankData.wins,
            losses: rankData.losses,
          }
        : null,
      lastUpdated: new Date().toISOString(),
    };

    return stats;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour les stats d'un compte de jeu lié
const updateGameAccountStats = async (userGameAccountId) => {
  try {
    const result = await pool.query(
      'SELECT game_username, game_account_id FROM user_game_accounts WHERE id = $1',
      [userGameAccountId]
    );

    if (result.rows.length === 0) {
      throw new Error('Compte de jeu non trouvé');
    }

    const { game_username } = result.rows[0];
    const stats = await fetchPlayerStats(game_username);

    // Mettre à jour dans la base de données
    await pool.query(
      'UPDATE user_game_accounts SET api_data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(stats), userGameAccountId]
    );

    return stats;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des stats:', error);
    throw error;
  }
};

module.exports = {
  fetchPlayerStats,
  updateGameAccountStats,
  getSummonerByName,
  getRankBySummonerId,
};

