const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tournament_db',
  ssl: false
});

async function generateSchema() {
  try {
    // Récupérer toutes les tables
    const tablesResult = await pool.query(`
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    // Récupérer les colonnes et leurs relations
    const columnsResult = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
      ORDER BY tc.table_name, tc.constraint_type;
    `);

    // Récupérer les détails des colonnes
    const columnDetailsResult = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    // Générer le schéma en format Mermaid
    let mermaid = `erDiagram\n`;
    
    const tables = tablesResult.rows;
    const columns = columnDetailsResult.rows;
    const constraints = columnsResult.rows;

    // Grouper les colonnes par table
    const columnsByTable = {};
    columns.forEach(col => {
      if (!columnsByTable[col.table_name]) {
        columnsByTable[col.table_name] = [];
      }
      columnsByTable[col.table_name].push(col);
    });

    // Générer les entités
    tables.forEach(table => {
      mermaid += `    ${table.table_name} {\n`;
      const tableColumns = columnsByTable[table.table_name] || [];
      tableColumns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '?' : '';
        const type = col.data_type.toUpperCase();
        mermaid += `        ${col.column_name}${nullable} ${type}\n`;
      });
      mermaid += `    }\n\n`;
    });

    // Générer les relations
    const foreignKeys = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
    foreignKeys.forEach(fk => {
      mermaid += `    ${fk.table_name} ||--o{ ${fk.foreign_table_name} : "${fk.column_name}"\n`;
    });

    // Sauvegarder le fichier Mermaid
    fs.writeFileSync('database/schema.mmd', mermaid);
    console.log('✅ Schéma Mermaid généré dans database/schema.mmd');
    console.log('📊 Vous pouvez le visualiser sur https://mermaid.live/');

    // Générer aussi un schéma en format texte
    let textSchema = '# Schéma de la base de données Tournament Platform\n\n';
    
    tables.forEach(table => {
      textSchema += `## Table: ${table.table_name}\n\n`;
      const tableColumns = columnsByTable[table.table_name] || [];
      textSchema += '| Colonne | Type | Nullable | Défaut |\n';
      textSchema += '|---------|------|----------|--------|\n';
      tableColumns.forEach(col => {
        textSchema += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || '-'} |\n`;
      });
      textSchema += '\n';
    });

    // Ajouter les relations
    if (foreignKeys.length > 0) {
      textSchema += '## Relations\n\n';
      foreignKeys.forEach(fk => {
        textSchema += `- ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}\n`;
      });
    }

    fs.writeFileSync('database/schema.md', textSchema);
    console.log('✅ Schéma Markdown généré dans database/schema.md');

    await pool.end();
  } catch (error) {
    console.error('Erreur lors de la génération du schéma:', error);
    await pool.end();
    process.exit(1);
  }
}

generateSchema();

