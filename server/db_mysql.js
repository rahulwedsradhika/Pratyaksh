import mysql from 'mysql2/promise';

/**
 * Hostinger MySQL / MariaDB Connection Pool
 * Supports environment variables:
 * - DB_HOST (default: 127.0.0.1 or localhost)
 * - DB_PORT (default: 3306)
 * - DB_DATABASE / DB_NAME
 * - DB_USERNAME / DB_USER
 * - DB_PASSWORD
 * - DB_CHARSET (default: utf8mb4)
 * - DB_CONNECTION_LIMIT (default: 10)
 */

let pool = null;

export function getMysqlPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_DATABASE || process.env.DB_NAME || 'pratyaksh_ayurveda';
  const user = process.env.DB_USERNAME || process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const charset = process.env.DB_CHARSET || 'utf8mb4';
  const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10);

  if (process.env.DB_CONNECTION === 'mysql' && (!process.env.DB_HOST || !(process.env.DB_DATABASE || process.env.DB_NAME) || !(process.env.DB_USERNAME || process.env.DB_USER))) {
    throw new Error('Explicit DB_HOST, DB_NAME and DB_USER are required for MySQL.');
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    charset,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 100,
    connectTimeout: 10000,
    multipleStatements: false,
    decimalNumbers: true,
    timezone: 'Z',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true // Return dates as strings to match SQLite behavior
  });

  return pool;
}

export async function closeMysqlPool() { if(pool){await pool.end();pool=null;} }

/**
 * Execute a query and return all rows
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Array>}
 */
export async function queryAll(sql, params = []) {
  const p = getMysqlPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

/**
 * Execute a query and return the first row (or null)
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Object|null>}
 */
export async function queryGet(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<{ affectedRows: number, insertId: number|string }>}
 */
export async function executeRun(sql, params = []) {
  const p = getMysqlPool();
  const [result] = await p.execute(sql, params);
  return {
    changes: result.affectedRows,
    affectedRows: result.affectedRows,
    lastInsertRowid: result.insertId,
    insertId: result.insertId
  };
}

/**
 * Execute raw batch SQL (DDL migrations)
 * @param {string} sql 
 * @returns {Promise<any>}
 */
export async function executeRaw(sql) {
  const p = getMysqlPool();
  return await p.query(sql);
}

/**
 * Test connectivity to Hostinger MySQL / MariaDB server
 * @returns {Promise<{ success: boolean, version?: string, error?: string, database?: string, host?: string }>}
 */
export async function testMysqlConnection() {
  try {
    const p = getMysqlPool();
    const [rows] = await p.query('SELECT VERSION() AS version, DATABASE() AS database_name, CURRENT_TIMESTAMP AS server_time');
    return {
      success: true,
      version: rows[0]?.version || 'Unknown',
      database: rows[0]?.database_name || process.env.DB_DATABASE || 'Unknown',
      host: process.env.DB_HOST || '127.0.0.1',
      serverTime: rows[0]?.server_time
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: err.code,
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_DATABASE || process.env.DB_NAME
    };
  }
}

