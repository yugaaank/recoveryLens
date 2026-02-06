'use client';

import { useEffect, useState } from 'react';
import RSIGauge from '@/components/dashboard/RSIGauge';
import VitalsCard from '@/components/dashboard/VitalsCard';
import { Heart, Activity, Thermometer, Footprints, Droplets, BedDouble } from 'lucide-react';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/history')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-muted-foreground">Loading dashboard...</div>;

    const latestEntry = data?.history && data.history.length > 0 ? data.history[data.history.length - 1] : null;
    const rsi = latestEntry?.rsi ?? 100;
    const history = Array.isArray(data?.history) ? data.history : [];

    const series = (key: string) =>
        history
            .map((row: any) => Number(row?.[key]))
            .filter((v: number) => Number.isFinite(v))
            .slice(-8);

    const progressRatio = (value?: number, goal?: number) => {
        if (!Number.isFinite(value) || !Number.isFinite(goal) || goal === 0) return undefined;
        return Math.min(1, Math.max(0, value / (goal as number)));
    };

    const baseline = data?.baseline || {};
    const within = (value?: number, base?: number, tolerance = 0.1) => {
        if (!Number.isFinite(value) || !Number.isFinite(base) || base === 0) return true;
        return Math.abs((value as number) - (base as number)) <= Math.abs((base as number) * tolerance);
    };

    const trendDirection = (values: number[], epsilon = 0.02) => {
        if (values.length < 3) return "flat";
        const recent = values[values.length - 1];
        const prevAvg = (values[values.length - 2] + values[values.length - 3]) / 2;
        const delta = (recent - prevAvg) / (prevAvg || 1);
        if (delta > epsilon) return "up";
        if (delta < -epsilon) return "down";
        return "flat";
    };

    const ranges = {
        heart_rate: { min: 55, max: 110, tol: 0.18 },
        spo2: { min: 94, max: 100, tol: 0.05 },
        temperature: { min: 36.0, max: 37.8, tol: 0.02 },
        pain: { warn: 6, high: 7 },
        steps: { tol: 0.25 },
        sleep: { min: 6, tol: 0.25 },
        minutes_moved: { min: 15, tol: 0.3 }
    };

    const latest = latestEntry;
    const symptoms: string[] = Array.isArray(latest?.symptoms) ? latest.symptoms : [];

    const heartWithin = within(latest?.heart_rate, baseline.heart_rate, ranges.heart_rate.tol);
    const spo2Within = within(latest?.spo2, baseline.spo2, ranges.spo2.tol);
    const tempWithin = within(latest?.temperature, baseline.temperature, ranges.temperature.tol);

    const heartAbsOk = Number.isFinite(latest?.heart_rate)
        ? latest.heart_rate >= ranges.heart_rate.min && latest.heart_rate <= ranges.heart_rate.max
        : true;
    const spo2AbsOk = Number.isFinite(latest?.spo2)
        ? latest.spo2 >= ranges.spo2.min && latest.spo2 <= ranges.spo2.max
        : true;
    const tempAbsOk = Number.isFinite(latest?.temperature)
        ? latest.temperature >= ranges.temperature.min && latest.temperature <= ranges.temperature.max
        : true;

    const painWarn = Number.isFinite(latest?.pain) && latest.pain >= ranges.pain.warn;
    const painHigh = Number.isFinite(latest?.pain) && latest.pain >= ranges.pain.high;

    const stepsLow = !within(latest?.steps, baseline.steps, ranges.steps.tol);
    const sleepLow = !within(latest?.sleep_hours, baseline.sleep_hours, ranges.sleep.tol) || (Number.isFinite(latest?.sleep_hours) && latest.sleep_hours < ranges.sleep.min);
    const minutesLow = !within(latest?.minutes_moved, baseline.minutes_moved, ranges.minutes_moved.tol) || (Number.isFinite(latest?.minutes_moved) && latest.minutes_moved < ranges.minutes_moved.min);

    const heartTrend = trendDirection(series('heart_rate'));
    const spo2Trend = trendDirection(series('spo2'));
    const tempTrend = trendDirection(series('temperature'));
    const painTrend = trendDirection(series('pain'));
    const sleepTrend = trendDirection(series('sleep_hours'));
    const stepsTrend = trendDirection(series('steps'));

    const riskPoints = [
        !heartWithin || !heartAbsOk ? 2 : 0,
        !spo2Within || !spo2AbsOk ? 3 : 0,
        !tempWithin || !tempAbsOk ? 3 : 0,
        painHigh ? 3 : painWarn ? 1 : 0,
        stepsLow ? 1 : 0,
        sleepLow ? 2 : 0,
        minutesLow ? 1 : 0,
        symptoms.length > 0 ? 1 : 0,
        tempTrend === "up" && !tempAbsOk ? 1 : 0,
        spo2Trend === "down" && !spo2AbsOk ? 1 : 0,
        heartTrend === "up" && !heartAbsOk ? 1 : 0,
        painTrend === "up" && painWarn ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    const statusLabel = !latest
        ? "No Data"
        : riskPoints >= 6 ? "Needs Attention"
        : riskPoints >= 3 ? "Monitor"
        : "Stable";

    const keySignalText = !latest
        ? "No recent check-ins available. Submit a health check to generate a summary."
        : (!spo2AbsOk || !tempAbsOk || painHigh)
            ? "Priority signals show elevated risk in oxygen saturation, temperature, or pain level."
            : (!heartWithin || !spo2Within || !tempWithin)
                ? "Core vitals are slightly outside baseline and should be watched for change."
                : "Core vitals are within expected post‑op ranges and aligned with baseline.";

    const recoveryPaceText = !latest
        ? "Activity and sleep trends will appear after your first submission."
        : (stepsLow || sleepLow || minutesLow)
            ? "Activity or sleep is below baseline targets; focus on steady pacing and rest."
            : (stepsTrend === "up" || sleepTrend === "up")
                ? "Activity and sleep trends are improving, suggesting healthy recovery momentum."
                : "Activity and sleep are consistent with baseline recovery targets.";

    const attentionText = !latest
        ? "Complete a check-in to unlock personalized guidance."
        : (symptoms.length > 0)
            ? `Reported symptoms: ${symptoms.slice(0, 3).join(', ')}${symptoms.length > 3 ? '…' : ''}. Continue monitoring and record changes.`
            : (painWarn || tempTrend === "up" || spo2Trend === "down")
                ? "Watch for changes in pain, temperature, or oxygen trends over the next check‑ins."
                : "Maintain consistent check‑ins to catch changes early and support stable recovery.";

    return (
        <div className="space-y-6">
            <header>
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Recovery Overview</p>
                        <h1 className="text-3xl font-bold text-foreground mt-1">Dashboard</h1>
                        <div className="mt-3 h-1 w-12 rounded-full bg-emerald-500/80" />
                    </div>
                </div>
                <div className="mt-3 max-w-2xl space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your latest recovery snapshot is ready. Review vitals, compare against baseline targets, and monitor the stability
                        signal generated from your most recent check‑in.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: RSI Gauge */}
                <div className="lg:col-span-1 h-full">
                    <RSIGauge score={rsi} explanation={latestEntry?.explanation} />
                </div>

                {/* Right: Vitals Grid */}
                <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-sm border border-border transition-shadow hover:shadow-md">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-foreground">Latest Vitals</h3>
                        <p className="text-muted-foreground text-sm">Comparison of your latest metrics against your established baseline.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <VitalsCard
                            title="Heart Rate"
                            value={latestEntry?.heart_rate ? `${latestEntry.heart_rate} bpm` : '--'}
                            unit=""
                            baseline={data?.baseline?.heart_rate ? `${data.baseline.heart_rate} bpm` : '--'}
                            sparkline={series('heart_rate')}
                            icon={Heart}
                            color=""
                        />
                        <VitalsCard
                            title="SpO2"
                            value={latestEntry?.spo2 ? `${latestEntry.spo2}%` : '--'}
                            unit=""
                            baseline={data?.baseline?.spo2 ? `${data.baseline.spo2}%` : '--'}
                            sparkline={series('spo2')}
                            icon={Droplets}
                            color=""
                        />
                        <VitalsCard
                            title="Temperature"
                            value={latestEntry?.temperature ? `${latestEntry.temperature}°C` : '--'}
                            unit=""
                            baseline={data?.baseline?.temperature ? `${data.baseline.temperature}°C` : '--'}
                            sparkline={series('temperature')}
                            icon={Thermometer}
                            color=""
                        />
                        <VitalsCard
                            title="Steps Today"
                            value={latestEntry?.steps || '--'}
                            unit=""
                            baseline={data?.baseline?.steps || '--'}
                            sparkline={series('steps')}
                            progress={progressRatio(latestEntry?.steps, data?.baseline?.steps)}
                            icon={Footprints}
                            color=""
                        />
                        <VitalsCard
                            title="Pain Score"
                            value={latestEntry?.pain !== undefined ? `${latestEntry.pain}/10` : '--'}
                            unit=""
                            baseline={data?.baseline?.pain !== undefined ? `${data.baseline.pain}/10` : '--'}
                            sparkline={series('pain')}
                            icon={Activity} // Or a better pain icon if available
                            color=""
                        />
                        <VitalsCard
                            title="Sleep"
                            value={latestEntry?.sleep_hours ? `${latestEntry.sleep_hours} hrs` : '--'}
                            unit=""
                            baseline={data?.baseline?.sleep_hours ? `${data.baseline.sleep_hours} hrs` : '--'}
                            sparkline={series('sleep_hours')}
                            progress={progressRatio(latestEntry?.sleep_hours, data?.baseline?.sleep_hours)}
                            icon={BedDouble}
                            color=""
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                            Patient Summary
                        </p>
                        <h3 className="text-xl font-bold text-foreground mt-1">
                            Current Condition Overview
                        </h3>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        statusLabel === "Stable"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : statusLabel === "Needs Attention"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                : statusLabel === "Monitor"
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : "bg-muted text-muted-foreground border-border"
                    }`}>
                        {statusLabel}
                    </span>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border bg-muted p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Signal</p>
                        <p className="text-sm font-medium text-foreground mt-2">
                            {keySignalText}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recovery Pace</p>
                        <p className="text-sm font-medium text-foreground mt-2">
                            {recoveryPaceText}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attention</p>
                        <p className="text-sm font-medium text-foreground mt-2">
                            {attentionText}
                        </p>
                    </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                    This summary updates automatically after each submission and reflects the most recent recovery window.
                </p>
            </div>
        </div>
    );
}
