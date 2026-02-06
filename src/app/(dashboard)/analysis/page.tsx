'use client';

import { useEffect, useState } from 'react';
import TrendCharts from '@/components/analytics/TrendCharts';

export default function AnalysisPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/history').then(res => res.json()).then(setData);
    }, []);

    if (!data) return <div className="text-muted-foreground">Loading analysis...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-foreground">Recovery Analytics</h1>
                <div className="mt-3 h-1 w-12 rounded-full bg-emerald-500/80" />
                <p className="text-muted-foreground mt-1">Longitudinal trends for post‑operative vitals and risk markers.</p>
                <p className="text-muted-foreground text-sm mt-1">
                    Review temporal patterns to identify stability, deviations, and response to recovery protocols.
                </p>
            </header>

            {data.history?.length > 0 ? (
                <TrendCharts data={data.history} />
            ) : (
                <div className="text-center py-12 text-muted-foreground">No data available for charts yet.</div>
            )}
        </div>
    );
}
