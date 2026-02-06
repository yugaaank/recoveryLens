'use client';

import { useEffect, useState } from 'react';
import RSIGauge from '@/components/dashboard/RSIGauge';
import VitalsCard from '@/components/dashboard/VitalsCard';
import { Heart, Activity, Thermometer, Footprints, Droplets } from 'lucide-react';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/history')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-gray-400">Loading dashboard...</div>;

    const latestEntry = data?.history && data.history.length > 0 ? data.history[data.history.length - 1] : null;
    const rsi = latestEntry?.rsi ?? 100;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">
                    Your post-discharge recovery overview.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: RSI Gauge */}
                <div className="lg:col-span-1 h-full">
                    <RSIGauge score={rsi} explanation={latestEntry?.explanation} />
                </div>

                {/* Right: Vitals Grid */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Latest Vitals</h3>
                        <p className="text-gray-500 text-sm">Comparison against your established baseline.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <VitalsCard
                            title="Heart Rate"
                            value={latestEntry?.heart_rate || '--'}
                            unit="bpm"
                            baseline={data?.baseline?.heart_rate}
                            icon={Heart}
                            color="bg-blue-50"
                        />
                        <VitalsCard
                            title="SpO2"
                            value={latestEntry?.spo2 || '--'}
                            unit="%"
                            baseline={data?.baseline?.spo2}
                            icon={Droplets}
                            color="bg-sky-50"
                        />
                        <VitalsCard
                            title="Temperature"
                            value={latestEntry?.temperature || '--'}
                            unit="°C"
                            baseline={data?.baseline?.temperature}
                            icon={Thermometer}
                            color="bg-orange-50"
                        />
                        <VitalsCard
                            title="Steps Today"
                            value={latestEntry?.steps || '--'}
                            unit=""
                            baseline={data?.baseline?.steps}
                            icon={Footprints}
                            color="bg-emerald-50"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
