'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Logo Section */}
        <div className="mb-10 flex flex-col items-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Paige's Bagels"
              width={450}
              height={450}
              priority
              className="cursor-pointer"
            />
          </Link>
        </div>

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

        {/* Contact/Hours Section */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{
            backgroundColor: '#E8EDF5',
            border: '1px solid #D4DCE8'
          }}
        >
          <h2
            className="text-2xl mb-4 pb-2"
            style={{
              color: '#1A1A1A',
              borderBottom: '2px solid #004AAD'
            }}
          >
            Get In Touch
          </h2>

          <div className="space-y-3" style={{ color: '#4A4A4A' }}>
            <p>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Instagram:</span>{' '}
              <a
                href="https://www.instagram.com/paigesbagels"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#004AAD' }}
                className="hover:underline"
              >
                @paigesbagels
              </a>
            </p>

            <p>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Order Online:</span>{' '}
              Place your order through our website and pay via Venmo.
            </p>
          </div>
        </div>

        {/* Order Button */}
        <Link
          href="/"
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
