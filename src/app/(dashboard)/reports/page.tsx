'use client';

import { useEffect, useState } from 'react';
import HistoryTable from '@/components/analytics/HistoryTable';

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/history').then(res => res.json()).then(setData);
    }, []);

    if (!data) return <div className="text-gray-400">Loading reports...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Recovery Reports</h1>
                <p className="text-gray-500 mt-1">Detailed logs of every 6-hour window.</p>
            </header>

            <HistoryTable data={data.history || []} />
        </div>
    );
}
