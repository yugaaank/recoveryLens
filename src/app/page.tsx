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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Guest Landing View
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            Patient Recovery Portal
          </h1>
          <p className="text-lg text-gray-600">
            Secure access to your post-surgery recovery guidelines and monitoring tools.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl bg-white text-gray-900 border border-gray-200 font-semibold hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
          >
            Register New Patient
          </Link>
        </div>
      </div>
    </div>
  );
}
