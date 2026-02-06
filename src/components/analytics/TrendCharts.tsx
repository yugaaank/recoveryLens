'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

interface TrendChartsProps {
    data: any[];
}

export default function TrendCharts({ data }: TrendChartsProps) {
    // Format data for simpler timestamps
    const chartData = data.map((d, i) => ({
        name: `W${i + 1}`, // Window 1, 2, ...
        heart_rate: d.heart_rate,
        spo2: d.spo2,
        temperature: d.temperature,
        steps: d.steps,
        minutes_moved: d.minutes_moved,
        pain: d.pain,
        risk_score: d.risk_score
    }));

    return (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Vitals Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-bold text-foreground mb-1">Vitals Trend</h3>
                <p className="text-muted-foreground text-sm mb-4">Heart rate, SpO2, and temperature over time.</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" domain={[60, 120]} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" domain={[35, 40]} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area yAxisId="left" type="monotone" dataKey="heart_rate" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHr)" name="Heart Rate" />
                            <Area yAxisId="right" type="monotone" dataKey="temperature" stroke="#f97316" fill="transparent" name="Temperature" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-bold text-foreground mb-1">Activity Trend</h3>
                <p className="text-muted-foreground text-sm mb-4">Steps and minutes moved per recovery window.</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="steps" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Steps" />
                            <Bar dataKey="minutes_moved" fill="#86efac" radius={[4, 4, 0, 0]} name="Minutes Moved" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pain Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-bold text-foreground mb-1">Pain Score Trend</h3>
                <p className="text-muted-foreground text-sm mb-4">Pain score evolution over time.</p>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area type="step" dataKey="pain" stroke="#fca5a5" fill="#fca5a5" fillOpacity={0.6} name="Pain Score" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Risk Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-bold text-foreground mb-1">Risk Score Trend</h3>
                <p className="text-muted-foreground text-sm mb-4">Overall risk score per recovery window.</p>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="risk_score" fill="#a855f7" radius={[4, 4, 0, 0]} name="Risk Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
