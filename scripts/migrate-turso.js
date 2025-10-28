// scripts/migrate-turso.js
// Script para inicializar y poblar la base de datos Turso

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
config({ path: join(__dirname, '..', '.env.local') });

async function migrate() {
  console.log('🚀 Iniciando migración a Turso...\n');

  try {
    // Importar módulos después de cargar .env
    const { initializeDatabase } = await import('../src/lib/database-turso.js');
    const { seedDatabase } = await import('../src/lib/seed-turso.js');

    // 1. Crear tablas
    console.log('📋 Creando esquema de base de datos...');
    await initializeDatabase();
    console.log('✅ Esquema creado\n');

    // 2. Poblar con datos
    console.log('🌱 Poblando base de datos con datos de ejemplo...');
    await seedDatabase();
    console.log('✅ Datos insertados\n');

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n📊 Puedes verificar tus datos en:');
    console.log('   https://turso.tech/app');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrate();
