'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/orders');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}
