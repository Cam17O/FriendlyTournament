// Script de test pour vérifier la clé API Riot Games
require('dotenv').config();
const axios = require('axios');

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const RIOT_API_ACCOUNT_BASE = 'https://europe.api.riotgames.com';

async function testRiotAPI() {
  console.log('🧪 Test de la clé API Riot Games\n');
  
  if (!RIOT_API_KEY) {
    console.error('❌ RIOT_API_KEY n\'est pas définie dans .env');
    process.exit(1);
  }
  
  console.log(`✅ Clé API trouvée (longueur: ${RIOT_API_KEY.length} caractères)`);
  console.log(`🔑 Premiers caractères: ${RIOT_API_KEY.substring(0, 10)}...\n`);
  
  // Test avec un Riot ID connu (vous pouvez le changer)
  const gameName = 'Cam17OO';
  const tagLine = 'EUW';
  
  console.log(`📋 Test avec Riot ID: ${gameName}#${tagLine}\n`);
  
  const url = `${RIOT_API_ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  console.log(`📍 URL: ${url}\n`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
      },
      validateStatus: () => true, // Ne pas throw pour les erreurs
    });
    
    console.log(`📊 Statut HTTP: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ SUCCÈS ! La clé API fonctionne correctement.');
      console.log('📦 Données reçues:', JSON.stringify(response.data, null, 2));
    } else if (response.status === 403) {
      console.error('❌ ERREUR 403 - Clé API invalide ou expirée');
      console.error('📋 Réponse:', JSON.stringify(response.data, null, 2));
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Vérifiez que la clé n\'a pas expiré (les clés de dev expirent après 24h)');
      console.error('   2. Générez une nouvelle clé sur https://developer.riotgames.com/');
      console.error('   3. Vérifiez que la clé a accès à l\'API Account v1');
    } else if (response.status === 404) {
      console.error('❌ ERREUR 404 - Riot ID non trouvé');
      console.error('💡 Vérifiez que le Riot ID est correct (format: NomDuJoueur#TAG)');
    } else {
      console.error(`❌ ERREUR ${response.status}`);
      console.error('📋 Réponse:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
    if (error.response) {
      console.error('📋 Statut:', error.response.status);
      console.error('📋 Données:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRiotAPI();

