const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL user
    password: '', // Replace with your MySQL password
    database: 'eParking_db',
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
