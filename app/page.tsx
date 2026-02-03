'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#f6f4f0', marginTop: '-80px' }}
    >
      {/* Logo - Big and Centered */}
      <div className="mb-4 overflow-hidden" style={{ marginBottom: '-60px' }}>
        <Image
          src="/logo.svg"
          alt="Paige's Bagels"
          width={375}
          height={375}
          priority
          unoptimized
          className="w-auto h-auto max-w-[350px] sm:max-w-[550px] lg:max-w-[700px]"
          style={{ marginBottom: '-80px' }}
        />
      </div>

      {/* Navigation Bar */}
      <nav className="flex flex-col sm:flex-row gap-4 sm:gap-16 lg:gap-20 items-center">
        <Link
          href="/about"
          className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest transition-all hover:scale-105"
          style={{ color: '#004AAD' }}
        >
          ABOUT
        </Link>
        <Link
          href="/order"
          className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest transition-all hover:scale-105"
          style={{ color: '#004AAD' }}
        >
          ORDER
        </Link>
        <Link
          href="/contact"
          className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest transition-all hover:scale-105"
          style={{ color: '#004AAD' }}
        >
          CONTACT
        </Link>
      </nav>
    </div>
  );
}
