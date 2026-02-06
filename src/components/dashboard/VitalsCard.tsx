import { LucideIcon } from 'lucide-react';

interface VitalsCardProps {
    title: string;
    value: string | number;
    unit: string;
    baseline: string | number;
    sparkline?: number[];
    progress?: number;
    icon: LucideIcon;
    color: string; // bg-blue-50 etc
}

// Assuming consistent styling from screenshot
export default function VitalsCard({
    title,
    value,
    unit,
    baseline,
    sparkline,
    progress,
    icon: Icon,
    color
}: VitalsCardProps) {
    const styleMap: Record<string, {
        wash: string;
        border: string;
        gradient: string;
        iconWrap: string;
        icon: string;
        spark: string;
        glow: string;
    }> = {
        'Heart Rate': {
            wash: 'bg-rose-500/5',
            border: 'border-t-rose-400/80',
            gradient: 'from-foreground to-rose-500',
            iconWrap: 'bg-rose-500/10',
            icon: 'text-rose-600 icon-pulse',
            spark: 'text-rose-400',
            glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.35)]'
        },
        'SpO2': {
            wash: 'bg-teal-500/5',
            border: 'border-t-teal-400/80',
            gradient: 'from-foreground to-teal-500',
            iconWrap: 'bg-teal-500/10',
            icon: 'text-teal-600',
            spark: 'text-teal-400',
            glow: 'drop-shadow-[0_0_8px_rgba(20,184,166,0.35)]'
        },
        'Temperature': {
            wash: 'bg-amber-500/6',
            border: 'border-t-amber-400/80',
            gradient: 'from-foreground to-amber-500',
            iconWrap: 'bg-amber-500/10',
            icon: 'text-amber-600',
            spark: 'text-amber-400',
            glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]'
        },
        'Steps Today': {
            wash: 'bg-emerald-500/5',
            border: 'border-t-emerald-400/80',
            gradient: 'from-foreground to-emerald-500',
            iconWrap: 'bg-emerald-500/10',
            icon: 'text-emerald-600',
            spark: 'text-emerald-400',
            glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]'
        },
        'Pain Score': {
            wash: 'bg-rose-500/4',
            border: 'border-t-rose-300/80',
            gradient: 'from-foreground to-rose-400',
            iconWrap: 'bg-rose-500/10',
            icon: 'text-rose-500',
            spark: 'text-rose-300',
            glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]'
        },
        'Sleep': {
            wash: 'bg-indigo-500/5',
            border: 'border-t-indigo-400/80',
            gradient: 'from-foreground to-indigo-500',
            iconWrap: 'bg-indigo-500/10',
            icon: 'text-indigo-500 icon-float',
            spark: 'text-indigo-300',
            glow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.35)]'
        }
    };

    const styles = styleMap[title] ?? {
        wash: 'bg-muted',
        border: 'border-t-emerald-400/60',
        gradient: 'from-foreground to-emerald-500',
        iconWrap: 'bg-emerald-500/10',
        icon: 'text-emerald-500/80',
        spark: 'text-emerald-400',
        glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'
    };

    const spark = (Array.isArray(sparkline) && sparkline.length > 1)
        ? sparkline
        : null;

    // Screenshot shows uniform light blue/gray background for all cards.
    // e.g., "bg-slate-100" or similar.
    return (
        <div className={`${styles.wash} p-4 rounded-lg flex flex-col justify-between h-full border border-border border-t-4 ${styles.border} shadow-sm transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md`}>
            <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${styles.iconWrap}`}>
                    <Icon className={`w-4 h-4 ${styles.icon}`} />
                </span>
            </div>

            <div className="mt-3">
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold bg-gradient-to-r ${styles.gradient} bg-clip-text text-transparent`}>
                        {value}
                    </span>
                    {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-medium">
                    Baseline: {baseline}{unit}
                </div>

                {spark && (
                    <svg viewBox="0 0 100 28" className="mt-3 h-7 w-full">
                        <polyline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`${styles.spark} ${styles.glow}`}
                            points={spark
                                .slice(-8)
                                .map((v, i, arr) => {
                                    const min = Math.min(...arr);
                                    const max = Math.max(...arr);
                                    const range = max - min || 1;
                                    const x = (i / (arr.length - 1)) * 100;
                                    const y = 26 - ((v - min) / range) * 22;
                                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                                })
                                .join(' ')
                            }
                        />
                    </svg>
                )}

                {typeof progress === 'number' && (
                    <div className="mt-3 h-2 w-full rounded-full bg-border overflow-hidden">
                        <div
                            className="h-full rounded-full bg-emerald-500/80"
                            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
