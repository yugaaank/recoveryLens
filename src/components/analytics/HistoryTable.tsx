'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface HistoryTableProps {
    data: any[];
}

export default function HistoryTable({ data }: HistoryTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete entry');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mt-6 transition-shadow hover:shadow-md">
            <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">Window Summaries</h3>
                <p className="text-muted-foreground text-sm">A detailed breakdown of your recovery metrics for each 6-hour window.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground">
                    <thead className="bg-muted text-xs uppercase font-semibold text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">Window</th>
                            <th className="px-6 py-4">Risk Score</th>
                            <th className="px-6 py-4">Trend</th>
                            <th className="px-6 py-4 text-right">Avg HR</th>
                            <th className="px-6 py-4 text-right">Avg SpO2</th>
                            <th className="px-6 py-4 text-right">Avg Temp</th>
                            <th className="px-6 py-4 text-right">Activity</th>
                            <th className="px-6 py-4 text-right">Avg Pain</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((row, i) => (
                            <tr key={row.id} className="hover:bg-muted transition group">
                                <td className="px-6 py-4 font-medium text-foreground">
                                    W{i + 1} <span className="text-muted-foreground/70 font-normal ml-1">({new Date(row.created_at).getHours()}h)</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                    ${row.status === 'Stable' ? 'bg-emerald-500/15 text-emerald-600' :
                                            row.status === 'Monitor' ? 'bg-amber-500/15 text-amber-600' :
                                                'bg-rose-500/15 text-rose-500'}`}>
                                        {row.risk_score.toFixed(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {row.status}
                                </td>
                                <td className="px-6 py-4 text-right font-mono">{row.heart_rate} bpm</td>
                                <td className="px-6 py-4 text-right font-mono">{row.spo2}%</td>
                                <td className="px-6 py-4 text-right font-mono">{row.temperature.toFixed(1)}°C</td>
                                <td className="px-6 py-4 text-right font-mono">{row.steps} steps</td>
                                <td className="px-6 py-4 text-right font-mono">{row.pain}/10</td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleDelete(row.id)}
                                        disabled={deletingId === row.id}
                                        className="text-muted-foreground/70 hover:text-red-500 transition p-1 rounded-md hover:bg-red-500/10 disabled:opacity-50"
                                        title="Delete Entry"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                                    No history data available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
