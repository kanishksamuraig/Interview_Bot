import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signIn('credentials', { email, password, callbackUrl: '/' });
    };

    return (
        <main>
            <div className="container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    {/* Add input fields for email and password */}
                </form>
            </div>
        </main>
    );
}