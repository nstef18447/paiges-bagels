'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="text-center py-8 px-5" style={{ color: 'var(--text-secondary)' }}>
      <p className="text-[0.78rem] font-medium tracking-[0.06em]">
        Seriously Sourdough Since 2026
      </p>
    </footer>
  );
}
