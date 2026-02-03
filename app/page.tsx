'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#f6f4f0' }}
    >
      {/* Logo - Big and Centered */}
      <div className="mb-12">
        <Image
          src="/logo.png"
          alt="Paige's Bagels"
          width={822}
          height={452}
          priority
          unoptimized
          className="w-auto h-auto max-w-[500px]"
        />
      </div>

      {/* Navigation Bar */}
      <nav className="flex gap-12">
        <Link
          href="/about"
          className="text-xl font-bold tracking-widest transition-all hover:scale-105"
          style={{ color: '#004AAD' }}
        >
          ABOUT
        </Link>
        <Link
          href="/order"
          className="text-xl font-bold tracking-widest transition-all hover:scale-105"
          style={{ color: '#004AAD' }}
        >
          ORDER
        </Link>
        <Link
          href="/contact"
          className="text-xl font-bold tracking-widest transition-all hover:scale-105"
          style={{ color: '#004AAD' }}
        >
          CONTACT
        </Link>
      </nav>
    </div>
  );
}
