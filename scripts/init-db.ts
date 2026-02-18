/**
 * Database Schema Initialization
 * Run this once to set up tables in Vercel Postgres
 * Command: npx ts-node --esm scripts/init-db.ts
 */

import { sql } from '@vercel/postgres';

async function initDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✓ Created users table');

    // Create mind_maps table
    await sql`
      CREATE TABLE IF NOT EXISTS mind_maps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✓ Created mind_maps table');

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON mind_maps(user_id);
    `;
    console.log('✓ Created index on user_id');

    console.log('\n✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
