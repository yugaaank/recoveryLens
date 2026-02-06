'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Male',
        surgery: 'Heart Surgery',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState<{ patient_key: string; patient_code: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    age: parseInt(formData.age),
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Registration failed');

            setSuccessData(data.credentials);
            // Optional: Redirect after some time or let user click
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 p-6">
                <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Registration Successful!</h2>
                    <p className="mb-6 text-gray-600">Please save your login credentials securely.</p>

                    <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left space-y-2 border border-gray-200">
                        <div>
                            <span className="text-sm text-gray-500 uppercase font-semibold">Patient Key</span>
                            <div className="text-2xl font-mono tracking-widest font-bold text-gray-900">{successData.patient_key}</div>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 uppercase font-semibold">Patient Code</span>
                            <div className="text-xl font-mono text-gray-900">{successData.patient_code}</div>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 p-6">
            <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">New Patient</h1>
                <p className="text-gray-500 mb-8">Register to access your portal</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder="45"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                            <select
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Surgery Type</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
                            value={formData.surgery}
                            onChange={(e) => setFormData({ ...formData, surgery: e.target.value })}
                        >
                            <option value="Heart Surgery">Heart Surgery</option>
                            <option value="Maternity">Maternity</option>
                            <option value="Neuro">Neuro</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Registering...' : 'Register Patient'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already registered? <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
