import { LucideIcon } from 'lucide-react';

interface VitalsCardProps {
    title: string;
    value: string | number;
    unit: string;
    baseline: string | number;
    icon: LucideIcon;
    color: string; // bg-blue-50 etc
}

export default function VitalsCard({ title, value, unit, baseline, icon: Icon, color }: VitalsCardProps) {
    return (
        <div className={`p-4 rounded-xl ${color}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700">{title}</span>
                <Icon className="w-5 h-5 text-gray-500 opacity-70" />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-sm text-gray-500">{unit}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
                Baseline: {baseline} {unit}
            </div>
        </div>
    );
}
