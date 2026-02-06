'use client';
import { Doughnut } from 'react-chartjs-2'; // Wait, I said recharts. Recharts doesn't do gauge easily.
// I will use SVG for a simple Gauge to avoid heavy chartjs just for this, or a Pie chart from Recharts.
// Let's use a simple SVG approach for clean, lightweight gauge.

export default function RSIGauge({ score, explanation }: { score: number, explanation?: string }) {
    // Score 0-100
    // Color logic
    const getColor = (s: number) => {
        if (s >= 85) return '#22c55e'; // Green
        if (s >= 60) return '#eab308'; // Yellow
        return '#ef4444'; // Red
    };

    const color = getColor(score);
    const status = score >= 85 ? 'Stable' : score >= 60 ? 'Monitor' : 'Critical';

    // SVG Arc calculation
    // Half circle: 180 degrees.
    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    // We want half circle, so max offset is half circumference? No, let's just do a CSS trick or partial stroke
    // Actually, easiest custom gauge:

    // Let's just use a Recharts Pie chart to be consistent with the plan

    const angle = 180 * (score / 100);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Recovery Stability Index (RSI)</h3>
            <p className="text-gray-500 text-sm mb-6">Your overall recovery score.</p>

            <div className="relative w-48 h-24 mb-4 overflow-hidden">
                {/* Background Arc */}
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[20px] border-gray-100 border-b-0 border-l-0 border-r-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>

                {/* Gradient Arc - simplified with CSS conic gradient for a 'gauge' look or just simple color */}
                <div
                    className="absolute top-0 left-0 w-48 h-48 rounded-full border-[20px] transition-all duration-1000 ease-out"
                    style={{
                        borderColor: color,
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                        transform: `rotate(${angle - 180}deg)`, // Reveal from left
                        opacity: 0.8
                    }}
                ></div>

                {/* For a true gauge look, we usually use SVG. Let's do a reliable SVG. */}
            </div>

            {/* Reliable SVG Implementation */}
            <div className="relative -mt-28">
                <svg width="200" height="110" viewBox="0 0 200 110">
                    {/* Background Track */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f3f4f6" strokeWidth="20" strokeLinecap="round" />

                    {/* Value Track - using stroke-dasharray */}
                    {/* Length of arc = PI * R = 3.14 * 80 ~= 251 */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={color}
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (251 * score / 100)} // Inverse logic
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                    <span className="text-5xl font-bold text-gray-900">{score}</span>
                    <span className="text-lg font-medium mt-1" style={{ color }}>{status}</span>
                </div>
            </div>

            {/* Explanation */}
            {explanation && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100 w-full">
                    <span className="font-semibold block mb-1 text-gray-900">Analysis:</span>
                    {explanation}
                </div>
            )}
        </div>
    );
}
