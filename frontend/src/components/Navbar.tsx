// frontend/src/components/Navbar.tsx
import Link from 'next/link';

export function Navbar() {
    return (
        <nav className="navbar">
            <Link href="/" className="navbar-logo">
                Interview<span className="accent">Bot</span>
            </Link>
            <div className="navbar-buttons">
                <Link href="/login" className="sign-up">Sign Up</Link>
            </div>
        </nav>
    );
}