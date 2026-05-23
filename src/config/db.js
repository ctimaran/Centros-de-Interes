const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuramos SSL dinámicamente:
// Si el host no es 'localhost', asumimos que es un entorno en la nube y requiere SSL.
const sslConfig = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' 
    ? { rejectUnauthorized: false } 
    : false;


// Creamos un pool de conexiones que manejará la concurrencia eficientemente
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'centros_interes',
    waitForConnections: true,
    connectionLimit: 10,  // Ajustable según la carga de los 500 estudiantes
    maxIdle: 10, 
    idleTimeout: 60000, 
    queueLimit: 0,
    ssl: sslConfig
});

module.exports = pool;
