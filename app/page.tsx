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
      <div className="overflow-hidden -mb-6 sm:-mb-12 lg:-mb-16">
        <Image
          src="/logo.svg"
          alt="Paige's Bagels"
          width={375}
          height={375}
          priority
          unoptimized
          className="w-auto h-auto max-w-[280px] sm:max-w-[550px] lg:max-w-[700px] -mb-10 sm:-mb-16 lg:-mb-20"
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
