const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
app.use(express.json());

app.post('/api/register', async (req, res) => {
    const { username, mssv, email, password } = req.body;
    if (!username || !mssv || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, mssv, email, password) VALUES (?, ?, ?, ?)',
            [username, mssv, email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered', userId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
});

app.post('/api/vehicles', async (req, res) => {
    const { user_id, license_plate, vehicle_type } = req.body;
    if (!user_id || !license_plate || !vehicle_type) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO vehicles (user_id, license_plate, vehicle_type) VALUES (?, ?, ?)',
            [user_id, license_plate, vehicle_type]
        );
        res.status(201).json({ message: 'Vehicle registered', vehicleId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error registering vehicle', error });
    }
});

app.get('/api/parking-history/:vehicle_id', async (req, res) => {
    const { vehicle_id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT * FROM parking_history WHERE vehicle_id = ? ORDER BY entry_time DESC LIMIT 30',
            [vehicle_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history', error });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
