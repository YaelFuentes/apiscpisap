// scripts/init-db.js
// Script para inicializar la base de datos

import { seedDatabase } from '../src/lib/seed.js';
import fs from 'fs';
import path from 'path';

// Crear carpeta data si no existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Carpeta data creada');
}

// Ejecutar seed
console.log('🚀 Inicializando base de datos...');
seedDatabase();
console.log('✅ Base de datos lista para usar');
