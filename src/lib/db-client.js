// src/lib/db-client.js
// Cliente que usa SOLO Turso (sin SQLite local)

import { getDatabase, closeDatabase } from './database-turso.js';

export { getDatabase, closeDatabase };
export default getDatabase;
