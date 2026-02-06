'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart2, FileText, Activity, LogOut, Menu, X, Monitor } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

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
                "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0",
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
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon size={20} className={isActive ? "text-emerald-500" : "text-muted-foreground/70"} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Patient Info Widget (Matching Screenshot) */}
                    <div className="mt-auto bg-muted p-4 rounded-xl border border-border">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-xs">
                                N
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Patient Info</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Age: 45</p>
                                <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        Orthopedic
                                    </span>
                                </div>
                            </div>
                        </div>
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
