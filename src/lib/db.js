// src/lib/db.js
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

// 1. Защита архитектуры: Проверяем наличие переменной окружения
// Если URL базы данных не передан, мы роняем приложение с понятной ошибкой (Slovak), 
// чтобы не искать причину в абстрактных логах.
if (!process.env.DATABASE_URL) {
  throw new Error('Critical error: DATABASE_URL environment variable is missing for Neon database.');
}

// 2. Инициализация подключения (KISS)
// Функция neon() автоматически управляет пулом соединений под капотом, 
// что идеально подходит для бессерверной среды (Serverless/Vercel)
export const sql = neon(process.env.DATABASE_URL);

const pool = globalThis.__neonPool || new Pool({ connectionString: process.env.DATABASE_URL });
if (!globalThis.__neonPool) globalThis.__neonPool = pool;

pool.on('error', (error) => {
  console.error('Unexpected Postgres client error', error);
});

export const db = {
  query: (...args) => pool.query(...args),
};