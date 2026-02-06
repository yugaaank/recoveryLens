'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Heart, Thermometer, Footprints, AlertCircle, Save } from 'lucide-react';
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
                <h1 className="text-3xl font-bold text-foreground">Health Check-in</h1>
                <div className="mt-3 h-1 w-12 rounded-full bg-emerald-500/80" />
                <p className="text-muted-foreground mt-1">
                    Log your daily vitals to help us track your recovery progress.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Context / Patient Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card rounded-2xl p-6 text-foreground shadow-sm border border-border border-l-4 border-l-foreground/70 transition-shadow hover:shadow-md">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5" />
                            Why this matters
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                            Consistent data helps our AI engine detect potential complications early.
                            Please try to measure your vitals at the same time every day.
                        </p>
                        <div className="bg-muted rounded-xl p-4 text-sm border border-border">
                            <p className="font-semibold mb-1">Tip:</p>
                            Take your resting heart rate after sitting calmly for 5 minutes.
                        </div>
                    </div>
                </div>

                {/* Right Column: Input Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 text-red-500 rounded-xl flex items-center gap-3 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-8 transition-shadow hover:shadow-md">
                            {/* Vitals Section */}
                            <section>
                                <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-rose-500" />
                                    Vital Signs
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Heart Rate (bpm)</label>
                                        <input
                                            type="number"
                                            name="heart_rate"
                                            value={formData.heart_rate}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:bg-card focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 transition outline-none"
                                            placeholder="75"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">SpO2 (%)</label>
                                        <input
                                            type="number"
                                            name="spo2"
                                            value={formData.spo2}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:bg-card focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 transition outline-none"
                                            placeholder="98"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Temperature (°C)</label>
                                        <input
                                            type="number"
                                            name="temperature"
                                            value={formData.temperature}
                                            onChange={handleInputChange}
                                            step="0.1"
                                            className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:bg-card focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 transition outline-none"
                                            placeholder="36.5"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border" />

                            {/* Activity Section */}
                            <section>
                                <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                                    <Footprints className="w-5 h-5 text-emerald-500" />
                                    Activity & Sleep
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Steps Today</label>
                                        <input
                                            type="number"
                                            name="steps"
                                            value={formData.steps}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:bg-card focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 transition outline-none"
                                            placeholder="1500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Active Minutes</label>
                                        <input
                                            type="number"
                                            name="minutes_moved"
                                            value={formData.minutes_moved}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:bg-card focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 transition outline-none"
                                            placeholder="30"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Sleep Duration (hours)</label>
                                        <input
                                            type="number"
                                            name="sleep_hours"
                                            value={formData.sleep_hours}
                                            onChange={handleInputChange}
                                            step="0.5"
                                            className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:bg-card focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 transition outline-none"
                                            placeholder="7.5"
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border" />

                            {/* Pain & Symptoms */}
                            <section>
                                <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                                    <Thermometer className="w-5 h-5 text-orange-500" />
                                    Pain & Symptoms
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <label className="text-sm font-medium text-muted-foreground">Pain Level</label>
                                            <span className="text-sm font-bold text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-md">
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
                                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>No Pain</span>
                                            <span>Severe</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-muted-foreground">Symptoms Experienced</label>
                                        <div className="flex flex-wrap gap-2">
                                            {symptomsList.map(symptom => (
                                                <button
                                                    key={symptom}
                                                    type="button"
                                                    onClick={() => toggleSymptom(symptom)}
                                                    className={clsx(
                                                        "px-4 py-2 rounded-full text-sm font-medium transition border",
                                                        formData.symptoms.includes(symptom)
                                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                                                            : "bg-card text-muted-foreground border-border hover:bg-muted"
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
                                className="flex items-center gap-2 px-8 py-3.5 bg-foreground text-background rounded-xl font-semibold hover:bg-foreground/90 transition shadow-lg ring-1 ring-emerald-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
