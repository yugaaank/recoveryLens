'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InputPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<any>(null);

    const [formData, setFormData] = useState({
        pain: 0,
        steps: '',
        minutes_moved: '',
        temperature: '',
        heart_rate: '',
        spo2: '',
        sleep_hours: '',
        symptoms: {} as Record<string, boolean>
    });

    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/input')
            .then(res => {
                if (res.status === 401) router.push('/login');
                return res.json();
            })
            .then(data => {
                if (data.error) setError(data.error);
                else setStatus(data);
            })
            .finally(() => setLoading(false));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Convert symptoms object to array
        const activeSymptoms = Object.keys(formData.symptoms).filter(k => formData.symptoms[k]);

        try {
            const res = await fetch('/api/input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pain: parseInt(formData.pain.toString()),
                    steps: parseInt(formData.steps),
                    minutes_moved: parseInt(formData.minutes_moved),
                    temperature: parseFloat(formData.temperature),
                    heart_rate: parseInt(formData.heart_rate),
                    spo2: parseInt(formData.spo2),
                    sleep_hours: parseFloat(formData.sleep_hours),
                    symptoms: activeSymptoms
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed');

            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSymptom = (key: string) => {
        setFormData(prev => ({
            ...prev,
            symptoms: { ...prev.symptoms, [key]: !prev.symptoms[key] }
        }));
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Checking status...</div>;

    if (status?.hasSubmittedToday && !status?.needsBaseline) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">All Caught Up!</h2>
                    <p className="text-gray-500">You have already submitted your recovery data for today.</p>
                    <Link href="/" className="inline-block px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const isBaseline = status?.needsBaseline;

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center py-12">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-blue-600 p-6 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <Link href="/dashboard" className="text-blue-100 hover:text-white text-sm">Cancel</Link>
                        <span className="text-xs uppercase tracking-wider font-semibold bg-blue-500 px-2 py-1 rounded">
                            {isBaseline ? `Baseline Entry ${status.baselineCount + 1}/2` : 'Recovery Window Entry'}
                        </span>
                    </div>        </div>
                <h1 className="text-2xl font-bold">
                    {isBaseline ? 'Establish Your Baseline' : 'Log 6-Hour Window'}
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                    Enter metrics for the current 6-hour recovery block.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {/* Vitals Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Vitals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (bpm)</label>
                            <input type="number" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 outline-none" placeholder="72"
                                value={formData.heart_rate} onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SpO₂ (%)</label>
                            <input type="number" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 outline-none" placeholder="98"
                                value={formData.spo2} onChange={(e) => setFormData({ ...formData, spo2: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                            <input type="number" step="0.1" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 outline-none" placeholder="36.5"
                                value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: e.target.value })} />
                        </div>
                    </div>
                </section>

                {/* Activity Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Activity & Sleep</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
                            <input type="number" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 outline-none" placeholder="500"
                                value={formData.steps} onChange={(e) => setFormData({ ...formData, steps: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Minutes Moved</label>
                            <input type="number" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 outline-none" placeholder="15"
                                value={formData.minutes_moved} onChange={(e) => setFormData({ ...formData, minutes_moved: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sleep (Hours)</label>
                            <input type="number" step="0.5" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 outline-none" placeholder="7.5"
                                value={formData.sleep_hours} onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })} />
                        </div>
                    </div>
                </section>

                {/* Pain & Symptoms */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Status</h3>

                    <div className="mb-6">
                        <label className="flex justify-between font-medium text-gray-700 mb-2">
                            Pain Level <span className="text-blue-600 font-bold">{formData.pain}/10</span>
                        </label>
                        <input type="range" min="0" max="10" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={formData.pain} onChange={(e) => setFormData({ ...formData, pain: parseInt(e.target.value) })} />
                        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>None</span><span>Severe</span></div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Symptoms (check all that apply)</label>
                        <div className="flex flex-wrap gap-3">
                            {['Nauseous', 'Dizzy', 'Vomiting'].map(sym => (
                                <button
                                    key={sym}
                                    type="button"
                                    onClick={() => toggleSymptom(sym)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${formData.symptoms[sym]
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {sym}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 transition duration-200 disabled:opacity-50"
                >
                    {submitting ? 'Analyzing & Saving...' : 'Submit Entry'}
                </button>
            </form>
        </div>

    );
}
