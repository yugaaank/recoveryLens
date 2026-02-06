'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check session
    fetch('/api/me')
      .then((res) => {
        if (res.ok) {
          router.push('/dashboard');
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Guest Landing View
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-5xl mb-4">
            Patient Recovery Portal
          </h1>
          <p className="text-lg text-muted-foreground">
            Secure access to your post-surgery recovery guidelines and monitoring tools.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl bg-card text-foreground border border-border font-semibold hover:bg-muted hover:border-emerald-300/60 transition shadow-sm"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl bg-foreground text-background font-semibold hover:bg-foreground/90 transition shadow-lg ring-1 ring-emerald-400/20"
          >
            Register New Patient
          </Link>
        </div>
      </div>
    </div>
  );
}
