// frontend/src/pages/api/signup.ts
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import type { NextApiRequest, NextApiResponse } from 'next';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const client = await pool.connect();
    try {
        await client.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        res.status(500).json({ message: 'User could not be created' });
    } finally {
        client.release();
    }
}