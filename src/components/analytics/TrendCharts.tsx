'use client';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    Legend,
    ReferenceArea
} from 'recharts';

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
        risk_score: d.risk_score,
        heart_rate_delta: i > 0 && Number.isFinite(d.heart_rate) && Number.isFinite(data[i - 1].heart_rate) ? d.heart_rate - data[i - 1].heart_rate : 0,
        spo2_delta: i > 0 && Number.isFinite(d.spo2) && Number.isFinite(data[i - 1].spo2) ? d.spo2 - data[i - 1].spo2 : 0,
        temperature_delta: i > 0 && Number.isFinite(d.temperature) && Number.isFinite(data[i - 1].temperature) ? d.temperature - data[i - 1].temperature : 0,
        steps_delta: i > 0 && Number.isFinite(d.steps) && Number.isFinite(data[i - 1].steps) ? d.steps - data[i - 1].steps : 0,
        minutes_moved_delta: i > 0 && Number.isFinite(d.minutes_moved) && Number.isFinite(data[i - 1].minutes_moved) ? d.minutes_moved - data[i - 1].minutes_moved : 0,
        pain_delta: i > 0 && Number.isFinite(d.pain) && Number.isFinite(data[i - 1].pain) ? d.pain - data[i - 1].pain : 0,
        risk_score_delta: i > 0 && Number.isFinite(d.risk_score) && Number.isFinite(data[i - 1].risk_score) ? d.risk_score - data[i - 1].risk_score : 0
    }));

    const percentile = (values: number[], p: number) => {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
        return sorted[idx];
    };

    const stepsValues = chartData.map(d => d.steps).filter((v) => Number.isFinite(v));
    const stepsBandLow = percentile(stepsValues, 0.3);
    const stepsBandHigh = percentile(stepsValues, 0.7);

    const tooltipFormatter = (value: any, name: string, props: any) => {
        const dataKey = props?.dataKey || name;
        const unitMap: Record<string, string> = {
            heart_rate: 'bpm',
            spo2: '%',
            temperature: '°C',
            steps: 'steps',
            minutes_moved: 'min',
            pain: '/10',
            risk_score: 'score'
        };

        const deltaKey = `${dataKey}_delta`;
        const delta = props?.payload?.[deltaKey];
        const deltaStr = Number.isFinite(delta)
            ? ` (${delta >= 0 ? '+' : ''}${delta}${unitMap[dataKey] ? ` ${unitMap[dataKey]}` : ''})`
            : '';
        return [`${value}${unitMap[dataKey] ? ` ${unitMap[dataKey]}` : ''}${deltaStr}`, String(name).toUpperCase()];
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Vitals Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-lg font-bold text-foreground mb-1">Vitals Trend</h3>
                <p className="text-muted-foreground text-sm mb-2">Heart rate, SpO2, and temperature over time.</p>
                <p className="text-muted-foreground text-xs mb-4">
                    Monitor physiologic stability and detect deviations from baseline.
                </p>
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
                            <YAxis yAxisId="spo2" orientation="right" domain={[90, 100]} hide />
                            <ReferenceArea yAxisId="left" y1={60} y2={100} fill="#e5e7eb" fillOpacity={0.4} />
                            <ReferenceArea yAxisId="right" y1={36.2} y2={37.6} fill="#fde68a" fillOpacity={0.2} />
                            <ReferenceArea yAxisId="spo2" y1={94} y2={100} fill="#bbf7d0" fillOpacity={0.2} />
                            <Tooltip formatter={tooltipFormatter} />
                            <Legend verticalAlign="top" height={24} />
                            <Area yAxisId="left" type="monotone" dataKey="heart_rate" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHr)" name="Heart Rate" />
                            <Area yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#22c55e" fillOpacity={0.2} fill="url(#colorSpo2)" name="SpO2" />
                            <Area yAxisId="right" type="monotone" dataKey="temperature" stroke="#f97316" fill="transparent" name="Temperature" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-lg font-bold text-foreground mb-1">Activity Trend</h3>
                <p className="text-muted-foreground text-sm mb-2">Steps and minutes moved per recovery window.</p>
                <p className="text-muted-foreground text-xs mb-4">
                    Assess mobility recovery and tolerance to activity load.
                </p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <ReferenceArea y1={stepsBandLow} y2={stepsBandHigh} fill="#d1fae5" fillOpacity={0.25} />
                            <Tooltip formatter={tooltipFormatter} />
                            <Legend verticalAlign="top" height={24} />
                            <Bar dataKey="steps" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Steps" />
                            <Bar dataKey="minutes_moved" fill="#86efac" radius={[4, 4, 0, 0]} name="Minutes Moved" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pain Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-lg font-bold text-foreground mb-1">Pain Score Trend</h3>
                <p className="text-muted-foreground text-sm mb-2">Pain score evolution over time.</p>
                <p className="text-muted-foreground text-xs mb-4">
                    Track analgesia effectiveness and symptom burden over time.
                </p>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} />
                            <ReferenceArea y1={0} y2={3} fill="#bbf7d0" fillOpacity={0.35} />
                            <Tooltip formatter={tooltipFormatter} />
                            <Legend verticalAlign="top" height={24} />
                            <Area type="step" dataKey="pain" stroke="#fca5a5" fill="#fca5a5" fillOpacity={0.6} name="Pain Score" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Risk Trend */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-lg font-bold text-foreground mb-1">Risk Score Trend</h3>
                <p className="text-muted-foreground text-sm mb-2">Overall risk score per recovery window.</p>
                <p className="text-muted-foreground text-xs mb-4">
                    Composite risk trajectory based on recent clinical signals.
                </p>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <ReferenceArea y1={0} y2={30} fill="#d1fae5" fillOpacity={0.35} />
                            <Tooltip formatter={tooltipFormatter} />
                            <Legend verticalAlign="top" height={24} />
                            <Bar dataKey="risk_score" fill="#a855f7" radius={[4, 4, 0, 0]} name="Risk Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
