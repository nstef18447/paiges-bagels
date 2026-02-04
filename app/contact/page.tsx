'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-xl mx-auto px-6 pb-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center overflow-hidden" style={{ marginBottom: '-30px' }}>
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Paige's Bagels"
              width={375}
              height={375}
              unoptimized
              className="w-auto h-auto max-w-[450px] cursor-pointer"
              style={{ marginTop: '-50px', marginBottom: '-70px' }}
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex justify-center gap-8 mb-8">
          <Link
            href="/about"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ABOUT
          </Link>
          <Link
            href="/order"
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            ORDER
          </Link>
          <Link
            href="/contact"
            className="font-semibold tracking-widest transition-all"
            style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}
          >
            CONTACT
          </Link>
        </nav>

        {/* Contact Section */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E0DB'
          }}
        >
          <h1
            className="text-3xl mb-6 pb-2 text-center"
            style={{
              color: '#1A1A1A',
              borderBottom: '2px solid #004AAD'
            }}
          >
            Get In Touch
          </h1>

          <div className="space-y-6" style={{ color: '#4A4A4A' }}>
            <div className="text-center">
              <p className="font-semibold text-xl md:text-2xl mb-2" style={{ color: '#1A1A1A' }}>
                Instagram
              </p>
              <a
                href="https://www.instagram.com/paigesbagels"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#004AAD' }}
                className="text-xl md:text-2xl hover:underline"
              >
                @paigesbagels
              </a>
            </div>

            <div className="text-center pt-4">
              <p className="text-lg md:text-xl" style={{ color: '#6B6B6B' }}>
                Questions about your order? DM us on Instagram!
              </p>
            </div>
          </div>
        </div>

        {/* Order Button */}
        <Link
          href="/order"
          className="block w-full py-4 px-6 font-semibold rounded-lg text-center transition-all"
          style={{
            backgroundColor: '#004AAD',
            color: '#FFFFFF'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#003A8C'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#004AAD'}
        >
          Order Bagels
        </Link>
      </div>
    </div>
  );
}
