'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/about', label: 'ABOUT' },
  { href: '/menu', label: 'MENU' },
  { href: '/order', label: 'ORDER NOW' },
  { href: '/merch', label: 'MERCH' },
  { href: '/contact', label: 'CONTACT' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <div style={{ backgroundColor: '#f6f4f0' }}>
      {/* Logo */}
      <div className="flex justify-center overflow-hidden">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="Paige's Bagels"
            width={375}
            height={375}
            priority
            unoptimized
            className="w-auto h-auto max-w-[300px] sm:max-w-[400px] lg:max-w-[500px] cursor-pointer -mt-12 sm:-mt-16 lg:-mt-20 -mb-14 sm:-mb-18 lg:-mb-22"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex overflow-x-auto gap-5 sm:gap-8 justify-center scrollbar-hide py-2 sm:py-3 px-4">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap font-bold text-lg sm:text-xl lg:text-2xl tracking-widest transition-all ${isActive ? '' : 'hover:scale-105'}`}
              style={isActive
                ? { color: '#1A1A1A', borderBottom: '2px solid #004AAD' }
                : { color: '#004AAD' }
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
