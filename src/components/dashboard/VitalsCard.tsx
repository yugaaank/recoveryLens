import { LucideIcon } from 'lucide-react';

interface VitalsCardProps {
    title: string;
    value: string | number;
    unit: string;
    baseline: string | number;
    icon: LucideIcon;
    color: string; // bg-blue-50 etc
}

// Assuming consistent styling from screenshot
export default function VitalsCard({ title, value, unit, baseline, icon: Icon, color }: VitalsCardProps) {
    // Screenshot shows uniform light blue/gray background for all cards.
    // e.g., "bg-slate-100" or similar.
    return (
        <div className="bg-[#e0e7ff]/40 p-4 rounded-lg flex flex-col justify-between h-full"> {/* Use a soft blue-gray tint */}
            <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-600">{title}</span>
                <Icon className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-3">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">{value}</span>
                    {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
                </div>
                <div className="mt-1 text-xs text-slate-500 font-medium">
                    Baseline: {baseline}{unit}
                </div>
            </div>
        </div>
    );
}
