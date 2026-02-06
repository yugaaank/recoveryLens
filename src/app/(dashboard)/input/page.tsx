'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';

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

        const activeSymptoms = Object.keys(formData.symptoms).filter(k => formData.symptoms[k]);

        try {
            const res = await fetch('/api/input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pain: parseInt(formData.pain.toString()),
                    steps: parseInt(formData.steps) || 0,
                    minutes_moved: parseInt(formData.minutes_moved) || 0,
                    temperature: parseFloat(formData.temperature) || 0,
                    heart_rate: parseInt(formData.heart_rate) || 0,
                    spo2: parseInt(formData.spo2) || 98,
                    sleep_hours: parseFloat(formData.sleep_hours) || 0,
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
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Left Panel - Blue Sidebar */}
            <div className="w-full md:w-1/3 min-w-[320px] bg-blue-600 p-8 md:p-12 text-white flex flex-col relative overflow-hidden">
                {/* Cancel Link */}
                <div className="absolute top-8 left-8 z-10">
                    <Link href="/dashboard" className="text-blue-100 hover:text-white text-sm font-medium">Cancel</Link>
                </div>

                <div className="mt-16 md:mt-24 relative z-10">
                    {/* Badge */}
                    <div className="inline-block bg-blue-500/50 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded mb-4 tracking-wider uppercase">
                        {isBaseline ? `Baseline Entry ${status?.baselineCount + 1}/2` : 'Daily Entry'}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 opacity-95">
                        {isBaseline ? 'Establish Your Baseline' : 'Log Recovery Window'}
                    </h1>

                    <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
                        Enter metrics for the current 6-hour recovery block. Accurate data helps us track your stability.
                    </p>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 md:h-screen md:overflow-y-auto">
                <div className="max-w-xl mx-auto p-8 md:p-16">
                    <form onSubmit={handleSubmit} className="space-y-12">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        {/* VITALS SECTION */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Vitals</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                                <NumberInput
                                    label="Heart Rate"
                                    subLabel="(bpm)"
                                    placeholder="72"
                                    value={formData.heart_rate}
                                    onChange={v => setFormData({ ...formData, heart_rate: v })}
                                />
                                <NumberInput
                                    label="SpO₂"
                                    subLabel="(%)"
                                    placeholder="98"
                                    value={formData.spo2}
                                    onChange={v => setFormData({ ...formData, spo2: v })}
                                />
                                <NumberInput
                                    label="Temperature"
                                    subLabel="(°C)"
                                    placeholder="36.5"
                                    value={formData.temperature}
                                    onChange={v => setFormData({ ...formData, temperature: v })}
                                />
                            </div>
                        </section>

                        {/* ACTIVITY SECTION */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Activity & Sleep</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                                <NumberInput
                                    label="Steps"
                                    placeholder="500"
                                    value={formData.steps}
                                    onChange={v => setFormData({ ...formData, steps: v })}
                                />
                                <NumberInput
                                    label="Minutes Moved"
                                    placeholder="15"
                                    value={formData.minutes_moved}
                                    onChange={v => setFormData({ ...formData, minutes_moved: v })}
                                />
                                <NumberInput
                                    label="Sleep"
                                    subLabel="(Hours)"
                                    placeholder="7.5"
                                    value={formData.sleep_hours}
                                    onChange={v => setFormData({ ...formData, sleep_hours: v })}
                                />
                            </div>
                        </section>

                        {/* STATUS SECTION */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Status</h3>

                            <div className="mb-10">
                                <div className="flex justify-between items-end mb-4">
                                    <label className="text-base font-medium text-gray-900">Pain Level</label>
                                    <span className="text-blue-600 font-bold text-lg">{formData.pain}/10</span>
                                </div>
                                <div className="relative h-2 bg-gray-100 rounded-full">
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
                                        value={formData.pain}
                                        onChange={(e) => setFormData({ ...formData, pain: parseInt(e.target.value) })}
                                    />
                                    <div
                                        className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-150"
                                        style={{ width: `${(formData.pain / 10) * 100}%` }}
                                    ></div>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow transition-all duration-150 pointer-events-none"
                                        style={{ left: `calc(${(formData.pain / 10) * 100}% - 10px)` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                                    <span>None</span>
                                    <span>Severe</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-900 mb-4">Symptoms <span className="text-gray-400 font-normal text-sm ml-1">(check all that apply)</span></label>
                                <div className="flex flex-wrap gap-3">
                                    {['Nauseous', 'Dizzy', 'Vomiting'].map(sym => (
                                        <button
                                            key={sym}
                                            type="button"
                                            onClick={() => toggleSymptom(sym)}
                                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${formData.symptoms[sym]
                                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                        >
                            {submitting ? 'Analyzing Recovery...' : 'Submit Entry'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Reusable Number Input Component matching the screenshot style
function NumberInput({
    label,
    subLabel,
    value,
    onChange,
    placeholder
}: {
    label: string,
    subLabel?: string,
    value: string | number,
    onChange: (val: string) => void,
    placeholder: string
}) {
    return (
        <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-2 font-medium">
                {label} {subLabel && <span className="text-gray-400 font-normal">{subLabel}</span>}
            </label>
            <div className="relative group">
                <input
                    type="number"
                    className="w-full bg-gray-50 text-gray-900 font-semibold px-4 py-3.5 rounded-xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />

                {/* Custom Spinner Controls (Visual only for now, standard input handles typing) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="p-0.5 hover:bg-gray-200 rounded cursor-pointer" onClick={() => {
                        const current = parseFloat(value.toString()) || 0;
                        onChange(String(current + 1));
                    }}>
                        <ChevronUp size={14} className="text-gray-600" />
                    </div>
                    <div className="p-0.5 hover:bg-gray-200 rounded cursor-pointer" onClick={() => {
                        const current = parseFloat(value.toString()) || 0;
                        // Prevent negative for most vitals if needed, but keeping simple
                        onChange(String(Math.max(0, current - 1)));
                    }}>
                        <ChevronDown size={14} className="text-gray-600" />
                    </div>
                </div>
            </div>
        </div>
    );
}

