const mysql = require('mysql2/promise');
require('dotenv').config();

// Creamos un pool de conexiones que manejará la concurrencia eficientemente
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'centros_interes',
    waitForConnections: true,
    connectionLimit: 10,  // Ajustable según la carga de los 500 estudiantes
    maxIdle: 10, 
    idleTimeout: 60000, 
    queueLimit: 0
});

module.exports = pool;
