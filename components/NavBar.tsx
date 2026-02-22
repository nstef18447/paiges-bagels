'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/menu', label: 'Menu' },
  { href: '/merch', label: 'Merch' },
  { href: '/contact', label: 'Contact' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* Sticky Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 md:px-10 md:py-4 overflow-hidden"
        style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Paige's Bagels"
            className="h-10 md:h-12 w-auto"
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="text-[0.82rem] font-medium uppercase tracking-[0.07em] transition-colors hover:text-brown"
                style={{
                  color: isActive ? 'var(--text-dark)' : 'var(--blue)',
                  borderBottom: isActive ? '2px solid var(--blue)' : 'none',
                  paddingBottom: isActive ? '2px' : '0',
                }}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/order"
            className="px-6 py-2.5 text-[0.8rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-blue-hover"
            style={{ backgroundColor: 'var(--blue)', color: 'var(--bg)' }}
          >
            Order Now
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-[5px] p-2 cursor-pointer bg-transparent border-none"
          aria-label="Toggle menu"
        >
          <span
            className="block w-[22px] h-0.5 transition-all duration-300"
            style={{
              backgroundColor: 'var(--blue)',
              transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }}
          />
          <span
            className="block w-[22px] h-0.5 transition-all duration-300"
            style={{
              backgroundColor: 'var(--blue)',
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-[22px] h-0.5 transition-all duration-300"
            style={{
              backgroundColor: 'var(--blue)',
              transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            }}
          />
        </button>
      </nav>

      {/* Mobile Slide-in Menu */}
      <div
        className="fixed inset-0 z-40 flex flex-col px-6 pt-10 md:hidden transition-transform duration-300"
        style={{
          top: '68px',
          backgroundColor: 'var(--bg)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            className="py-4 text-[1.8rem] font-bold transition-colors hover:text-brown"
            style={{
              fontFamily: 'var(--font-playfair)',
              color: pathname === href ? 'var(--brown)' : 'var(--blue)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/order"
          onClick={() => setMenuOpen(false)}
          className="mt-8 py-4 text-center text-[0.9rem] font-semibold uppercase tracking-[0.08em] transition-colors"
          style={{ backgroundColor: 'var(--blue)', color: 'var(--bg)' }}
        >
          Order Now
        </Link>
      </div>
    </>
  );
}
