'use client';

export default function RSIGauge({ score, explanation }: { score: number, explanation?: string }) {
    // Score 0-100 mapped to angle -90 (red) to 90 (green)
    // Actually standard gauge is usually -90 to +90 degrees (180 deg total)
    // But we want Red on Left, Green on Right.
    // 0 = -90deg, 100 = 90deg.
    const angle = (score / 100) * 180 - 90;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    Recovery Stability Index (RSI)
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                    Your overall recovery score.
                </p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[160px]">
                <div className="relative w-64 h-32 overflow-hidden">
                    {/* SVG Gauge */}
                    <svg viewBox="0 0 200 100" className="w-full h-full">
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />   {/* Red */}
                                <stop offset="50%" stopColor="#eab308" />   {/* Yellow */}
                                <stop offset="100%" stopColor="#22c55e" />  {/* Green */}
                            </linearGradient>
                        </defs>

                        {/* Background Track - Grey Shadow? No, screenshot shows just colored track ?? 
                            Actually screenshot shows a very thick colored track. 
                            Let's do a thick track with the gradient. */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="20"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                        />

                        {/* Needle */}
                        {/* Pivot point is 100,100 */}
                        <g transform={`rotate(${angle}, 100, 100)`}>
                            {/* Simple Black Needle */}
                            <path d="M 100 100 L 100 35" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="100" cy="100" r="6" fill="#1f2937" />
                        </g>
                    </svg>
                </div>

                <div className="text-center -mt-4 relative z-10">
                    <div className="text-6xl font-bold text-gray-900 tracking-tighter">
                        {Math.round(score)}
                    </div>
                    {/* Status Text - e.g. "Stable" */}
                    <div className="text-lg font-medium text-emerald-500 mt-1">
                        Stable
                    </div>
                </div>
            </div>

            {/* If explanation exists, we could show it, but screenshot doesn't show it inside the gauge area directly like a footer explanation. 
                We'll hide it for strict match or keep if useful. Keep strict match for now? User said "Ui should look like this". 
                I'll keep it conditional but unobtrusive.
            */}
            {explanation && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100 w-full">
                    <span className="font-semibold block mb-1 text-gray-900">Analysis:</span>
                    {explanation}
                </div>
            )}
        </div>
    );
}
