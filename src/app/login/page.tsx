'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        patient_key: '',
        patient_code: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            router.push('/');
            router.refresh(); // Refresh to update server components/middleware state if any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
            <div className="max-w-md w-full bg-card rounded-xl shadow-md p-8 border border-border">
                <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome Back</h1>
                <p className="text-muted-foreground mb-8">Enter your credentials to access your portal</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Patient Key (4 Digits)</label>
                        <input
                            type="text"
                            required
                            maxLength={4}
                            pattern="\d{4}"
                            className="w-full px-4 py-3 rounded-lg border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition font-mono tracking-widest bg-card"
                            placeholder="0000"
                            value={formData.patient_key}
                            onChange={(e) => setFormData({ ...formData, patient_key: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Patient Code</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition font-mono bg-card"
                            placeholder="P-XXXXXX"
                            value={formData.patient_code}
                            onChange={(e) => setFormData({ ...formData, patient_code: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-foreground hover:bg-foreground/90 text-background font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Access Portal'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    New patient? <Link href="/register" className="text-accent hover:underline">Register here</Link>
                </p>
            </div>
        </div>
    );
}
