import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        router.push('/login');
    };

    return (
        <main>
            <div className="container">
                <h1>Sign Up</h1>
                <form onSubmit={handleSubmit}>
                    {/* Add input fields for email and password and a submit button */}
                </form>
            </div>
        </main>
    );
}