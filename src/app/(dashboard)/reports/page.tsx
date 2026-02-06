'use client';

import { useEffect, useState } from 'react';
import HistoryTable from '@/components/analytics/HistoryTable';

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/history').then(res => res.json()).then(setData);
    }, []);

    if (!data) return <div className="text-muted-foreground">Loading reports...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-foreground">Recovery Reports</h1>
                <div className="mt-3 h-1 w-12 rounded-full bg-emerald-500/80" />
                <p className="text-muted-foreground mt-1">Detailed logs of every 6-hour window.</p>
            </header>

            <HistoryTable data={data.history || []} />
        </div>
    );
}
