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
    const iconStyle =
        title === 'Heart Rate' ? 'text-rose-500 icon-pulse' :
        title === 'SpO2' ? 'text-sky-500' :
        title === 'Temperature' ? 'text-amber-500' :
        title === 'Steps Today' ? 'text-emerald-500' :
        title === 'Pain Score' ? 'text-rose-400' :
        title === 'Sleep' ? 'text-indigo-400 icon-float' :
        'text-emerald-500/80';

    const sparkColor =
        title === 'Heart Rate' ? 'text-rose-400' :
        title === 'SpO2' ? 'text-sky-400' :
        title === 'Temperature' ? 'text-amber-400' :
        title === 'Steps Today' ? 'text-emerald-400' :
        title === 'Pain Score' ? 'text-rose-300' :
        title === 'Sleep' ? 'text-indigo-300' :
        'text-emerald-400';

    const spark = (Array.isArray(sparkline) && sparkline.length > 1)
        ? sparkline
        : null;

    // Screenshot shows uniform light blue/gray background for all cards.
    // e.g., "bg-slate-100" or similar.
    return (
        <div className="bg-muted p-4 rounded-lg flex flex-col justify-between h-full border border-border shadow-sm transition-transform transition-shadow hover:-translate-y-1 hover:shadow-md"> {/* Use a soft blue-gray tint */}
            <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <Icon className={`w-4 h-4 ${iconStyle}`} />
            </div>

            <div className="mt-3">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{value}</span>
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
                            className={sparkColor}
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
