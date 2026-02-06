import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 top-48 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
            <Sidebar />
            <main className="md:ml-64 p-6 md:p-8 animate-in fade-in duration-500 relative">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
