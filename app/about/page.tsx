'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center overflow-hidden" style={{ marginBottom: '-70px' }}>
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Paige's Bagels"
              width={375}
              height={375}
              unoptimized
              className="w-auto h-auto max-w-[450px] cursor-pointer"
              style={{ marginBottom: '-70px' }}
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex justify-center gap-8 mb-8">
          <Link
            href="/about"
            className="font-semibold tracking-widest transition-all"
            style={{ color: '#1A1A1A', borderBottom: '2px solid #004AAD' }}
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
            className="font-semibold tracking-widest transition-all hover:scale-105"
            style={{ color: '#004AAD' }}
          >
            CONTACT
          </Link>
        </nav>

        {/* About Section */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E0DB'
          }}
        >
          <h1
            className="text-3xl mb-4 pb-2 text-center"
            style={{
              color: '#1A1A1A',
              borderBottom: '2px solid #004AAD'
            }}
          >
            About Us
          </h1>

          <div className="space-y-4" style={{ color: '#4A4A4A' }}>
            <p>
              Welcome to Paige&apos;s Bagels! We&apos;re passionate about crafting
              authentic sourdough bagels using traditional methods and the finest ingredients.
            </p>

            <p>
              Each bagel is hand-rolled and boiled before baking, giving them that
              perfect chewy interior and crispy exterior that bagel lovers crave.
            </p>

            <p>
              Our sourdough starter has been carefully maintained to develop complex
              flavors that make our bagels truly special. We believe in quality over
              quantity, which is why we make limited batches to ensure freshness.
            </p>
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
