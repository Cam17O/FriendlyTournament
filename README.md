# Friendly Tournament

Plateforme web permettant de créer et gérer des tournois amicaux sur plusieurs jeux vidéo.

**Friendly Tournament** - Create and manage friendly tournaments on your favorite games.

## Fonctionnalités

- Authentification OAuth (Google, Discord) et par email
- Gestion de profil avec jeux liés
- Création et gestion de tournois
- Intégration API Riot Games pour League of Legends
- Système d'amis
- Suivi des objectifs, récompenses et punitions

## Technologies

- **Frontend**: React + Material UI
- **Backend**: Node.js + Express
- **Base de données**: PostgreSQL

## Installation

### Option 1 : Docker (Recommandé)

Le projet est entièrement containerisé avec Docker. C'est la méthode la plus simple.

#### Prérequis

- Docker (v20.10+)
- Docker Compose (v2.0+)

#### Démarrage rapide

1. Créez un fichier `.env` à la racine avec vos variables d'environnement (voir `DOCKER.md`)

2. Démarrer tous les services :
```bash
docker-compose up -d
```

3. Accéder à l'application :
   - Frontend : http://localhost:3000
   - Backend API : http://localhost:5000

Pour plus de détails, consultez [DOCKER.md](DOCKER.md)

### Option 2 : Installation manuelle

#### Prérequis

- Node.js (v18+)
- PostgreSQL (v14+)
- Clés API : Google OAuth, Discord OAuth, Riot Games API

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement dans .env
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

#### Base de données

```bash
cd database
node migrate.js
```

## Configuration

Voir les fichiers `.env.example` dans chaque dossier pour la configuration des variables d'environnement.

Pour Docker, consultez [DOCKER.md](DOCKER.md) pour la configuration complète.

