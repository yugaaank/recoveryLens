'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart2, FileText, Activity, Menu, X, Monitor, Moon, Sun, User, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [patientMeta, setPatientMeta] = useState<{
        id: string;
        patient_key: string;
        patient_code: string;
        name?: string;
        age?: number;
        gender?: string;
        surgery?: string;
    } | null>(null);
    const [patientLoading, setPatientLoading] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);

    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === 'dark';

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/input', label: 'Data Input', icon: Activity },
        { href: '/analysis', label: 'Analytics', icon: BarChart2 },
        { href: '/reports', label: 'Reports', icon: FileText },
    ];

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/login');
    };

    useEffect(() => {
        let isActive = true;
        setPatientLoading(true);
        fetch('/api/me', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((payload) => {
                if (!isActive) return;
                if (payload?.user) setPatientMeta(payload.user);
            })
            .finally(() => {
                if (isActive) setPatientLoading(false);
            });
        return () => {
            isActive = false;
        };
    }, []);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-card rounded-lg shadow-sm border border-border"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Container */}
            <aside className={clsx(
                "fixed left-4 top-4 bottom-4 z-40 w-64 bg-card border border-border rounded-2xl shadow-lg transform transition-transform duration-200 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col p-6">
                    {/* Logo */}
                        <div className="flex items-center gap-3 mb-8">
                        <div className="bg-emerald-500/15 text-emerald-600 p-2 rounded-lg">
                            <Monitor size={24} />
                        </div>
                        <span className="font-bold text-xl text-foreground">RecoveryLens</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                                        isActive
                                            ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-600 shadow-[0_8px_24px_rgba(16,185,129,0.18)]"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon size={20} className={isActive ? "text-emerald-500" : "text-muted-foreground/70"} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-6 border-t border-border pt-4 space-y-3">
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                            <div className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                                        <User className="h-3.5 w-3.5" />
                                    </span>
                                    <p className="text-sm font-semibold text-foreground">Patient Info</p>
                                </div>
                                {patientLoading && !patientMeta ? (
                                    <p className="text-xs text-muted-foreground mt-2">Loading patient details...</p>
                                ) : (
                                    <>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {patientMeta?.name ? `Name: ${patientMeta.name}` : 'Name: --'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {patientMeta?.age ? `Age: ${patientMeta.age}` : 'Age: --'}
                                        </p>
                                    </>
                                )}
                                <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        {patientMeta?.surgery || 'Orthopedic'}
                                    </span>
                                </div>
                            </div>
                            <div className="px-3 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCredentials((v) => !v)}
                                    className="w-full inline-flex items-center justify-center rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold text-foreground hover:bg-muted transition"
                                >
                                    {showCredentials ? 'Hide Login IDs' : 'Show Login IDs'}
                                </button>
                                {showCredentials && (
                                    <div className="mt-3 rounded-lg border border-border bg-muted p-2 text-[11px] text-muted-foreground">
                                        {patientLoading && <div>Loading...</div>}
                                        {!patientLoading && (
                                            <>
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <span>Patient Key</span>
                                                    <span className="font-mono text-foreground">{patientMeta?.patient_key || '--'}</span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <span>Patient Code</span>
                                                    <span className="font-mono text-foreground">{patientMeta?.patient_code || '--'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="my-2 h-px bg-border" />
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                            >
                                <LogOut className="h-4 w-4 text-muted-foreground" />
                                Log out
                            </button>
                        </div>

                        <div className="h-px w-full bg-border" />

                        <button
                            type="button"
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-label={mounted ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
                        >
                            {mounted ? (isDark ? <Sun size={14} /> : <Moon size={14} />) : <span className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">{mounted ? (isDark ? 'Light' : 'Dark') : 'Theme'}</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
