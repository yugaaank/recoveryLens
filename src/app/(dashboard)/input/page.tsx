'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Heart, Thermometer, Moon, Footprints, AlertCircle, Save } from 'lucide-react';
import clsx from 'clsx';

export default function InputPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        heart_rate: '',
        spo2: '',
        temperature: '',
        steps: '',
        minutes_moved: '',
        sleep_hours: '',
        pain: 0,
        symptoms: [] as string[]
    });

    const symptomsList = ['Nauseous', 'Dizzy', 'Vomiting', 'Headache', 'Chills'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleSymptom = (symptom: string) => {
        setFormData(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter(s => s !== symptom)
                : [...prev.symptoms, symptom]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation conversion
        const payload = {
            heart_rate: Number(formData.heart_rate),
            spo2: Number(formData.spo2),
            temperature: Number(formData.temperature),
            steps: Number(formData.steps),
            minutes_moved: Number(formData.minutes_moved),
            sleep_hours: Number(formData.sleep_hours),
            pain: formData.pain,
            symptoms: formData.symptoms
        };

        try {
            const res = await fetch('/api/input', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit data');
            }

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Health Check-in</h1>
                <p className="text-gray-500 mt-1">
                    Log your daily vitals to help us track your recovery progress.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Context / Patient Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5" />
                            Why this matters
                        </h3>
                        <p className="text-blue-100 text-sm leading-relaxed mb-4">
                            Consistent data helps our AI engine detect potential complications early.
                            Please try to measure your vitals at the same time every day.
                        </p>
                        <div className="bg-blue-500/30 rounded-xl p-4 text-sm border border-blue-400/30">
                            <p className="font-semibold mb-1">Tip:</p>
                            Take your resting heart rate after sitting calmly for 5 minutes.
                        </div>
                    </div>
                </div>

                {/* Right Column: Input Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-8">
                            {/* Vitals Section */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-rose-500" />
                                    Vital Signs
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Heart Rate (bpm)</label>
                                        <input
                                            type="number"
                                            name="heart_rate"
                                            value={formData.heart_rate}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                            placeholder="75"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">SpO2 (%)</label>
                                        <input
                                            type="number"
                                            name="spo2"
                                            value={formData.spo2}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                            placeholder="98"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Temperature (°C)</label>
                                        <input
                                            type="number"
                                            name="temperature"
                                            value={formData.temperature}
                                            onChange={handleInputChange}
                                            step="0.1"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                            placeholder="36.5"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-gray-100" />

                            {/* Activity Section */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <Footprints className="w-5 h-5 text-emerald-500" />
                                    Activity & Sleep
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Steps Today</label>
                                        <input
                                            type="number"
                                            name="steps"
                                            value={formData.steps}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                            placeholder="1500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Active Minutes</label>
                                        <input
                                            type="number"
                                            name="minutes_moved"
                                            value={formData.minutes_moved}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                            placeholder="30"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Sleep Duration (hours)</label>
                                        <input
                                            type="number"
                                            name="sleep_hours"
                                            value={formData.sleep_hours}
                                            onChange={handleInputChange}
                                            step="0.5"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                                            placeholder="7.5"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-gray-100" />

                            {/* Pain & Symptoms */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <Thermometer className="w-5 h-5 text-orange-500" />
                                    Pain & Symptoms
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <label className="text-sm font-medium text-gray-700">Pain Level</label>
                                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                {formData.pain}/10
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="1"
                                            value={formData.pain}
                                            onChange={(e) => setFormData(p => ({ ...p, pain: Number(e.target.value) }))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>No Pain</span>
                                            <span>Severe</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700">Symptoms Experienced</label>
                                        <div className="flex flex-wrap gap-2">
                                            {symptomsList.map(symptom => (
                                                <button
                                                    key={symptom}
                                                    type="button"
                                                    onClick={() => toggleSymptom(symptom)}
                                                    className={clsx(
                                                        "px-4 py-2 rounded-full text-sm font-medium transition border",
                                                        formData.symptoms.includes(symptom)
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                    )}
                                                >
                                                    {symptom}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Entry
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
