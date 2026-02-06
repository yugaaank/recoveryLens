'use client';

import { useEffect, useState } from 'react';
import TrendCharts from '@/components/analytics/TrendCharts';

export default function AnalysisPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/history').then(res => res.json()).then(setData);
    }, []);

    if (!data) return <div className="text-gray-400">Loading analysis...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Recovery Analytics</h1>
                <p className="text-gray-500 mt-1">Visualize your recovery progress over time.</p>
            </header>

            {data.history?.length > 0 ? (
                <TrendCharts data={data.history} />
            ) : (
                <div className="text-center py-12 text-gray-400">No data available for charts yet.</div>
            )}
        </div>
    );
}
