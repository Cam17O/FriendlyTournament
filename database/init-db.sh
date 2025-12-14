#!/bin/bash
set -e

echo "Attente de PostgreSQL..."
until pg_isready -h postgres -U ${POSTGRES_USER:-postgres}; do
  sleep 1
done

echo "PostgreSQL est prêt !"

# Exécuter les migrations
echo "Exécution des migrations..."
psql -h postgres -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-tournament_db} -f /docker-entrypoint-initdb.d/001_initial_schema.sql

echo "Migrations terminées !"

