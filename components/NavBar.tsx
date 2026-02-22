'use client';

import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ backgroundColor: '#f6f4f0' }}>
      {/* Logo + Mobile Hamburger Row */}
      <div className="relative flex justify-center overflow-hidden">
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
        {/* Mobile Hamburger — positioned to right of logo */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden absolute right-2 bottom-4 p-2 cursor-pointer"
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span
              className="block w-7 h-0.5 transition-all"
              style={{
                backgroundColor: '#004AAD',
                transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
              }}
            />
            <span
              className="block w-7 h-0.5 transition-all"
              style={{
                backgroundColor: '#004AAD',
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-7 h-0.5 transition-all"
              style={{
                backgroundColor: '#004AAD',
                transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
              }}
            />
          </div>
        </button>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-8 justify-center py-3 px-4">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap font-bold text-xl lg:text-2xl tracking-widest transition-all ${isActive ? '' : 'hover:scale-105'}`}
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

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <nav className="md:hidden flex flex-col items-center gap-4 pb-4">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="font-bold text-lg tracking-widest transition-all"
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
      )}
    </div>
  );
}
