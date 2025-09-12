// frontend/src/pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // We'll set this in a .env file
});

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials) {
                    return null;
                }
                const client = await pool.connect();
                try {
                    const { rows } = await client.query('SELECT * FROM users WHERE email = $1', [credentials.email]);
                    const user = rows[0];

                    if (user && bcrypt.compareSync(credentials.password, user.password)) {
                        // Return user object without the password
                        return { id: user.id, email: user.email };
                    } else {
                        return null;
                    }
                } finally {
                    client.release();
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login', // Redirect to /login page for signing in
    },
    secret: process.env.NEXTAUTH_SECRET,
});