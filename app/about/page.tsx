'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-4xl mx-auto px-6 pb-10">
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

        {/* About Section - Text and Image Side by Side */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* About Text */}
          <div
            className="md:w-1/2 rounded-lg p-6"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E0DB'
            }}
          >
            <h1
              className="text-2xl md:text-3xl mb-4 pb-2"
              style={{
                color: '#1A1A1A',
                borderBottom: '2px solid #004AAD'
              }}
            >
              About Paige&apos;s Bagels
            </h1>

            <div className="space-y-4 text-sm md:text-lg" style={{ color: '#4A4A4A' }}>
              <p>
                Paige&apos;s Bagels started at business school at Kellogg, as a side project fueled by a love of bagels, long runs, and the challenge of finding food that actually felt good to eat.
              </p>

              <p>
                As a runner with chronic stomach issues, I spent years avoiding foods I loved - bagels included. That changed when I started baking sourdough and realized how much better it worked for my body. One experiment turned into another, and eventually, sourdough bagels became the thing I couldn&apos;t stop making (or sharing).
              </p>

              <p>
                The goal is simple: bagels that are worth waking up for - naturally fermented, thoughtfully made, with a crisp crust, soft center, and nothing added that doesn&apos;t need to be there.
              </p>

              <p className="font-semibold" style={{ color: '#004AAD' }}>
                I&apos;m so excited for you to try them!
              </p>
            </div>
          </div>

          {/* Bagel Image */}
          <div className="md:w-1/2">
            <div className="rounded-lg overflow-hidden h-full">
              <Image
                src="/bagels.jpg"
                alt="Fresh sourdough bagels"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Benefits Section */}
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
            Benefits of Sourdough Bagels
          </h2>

          <ul className="space-y-3" style={{ color: '#4A4A4A' }}>
            <li>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Easier to digest:</span>{' '}
              The long fermentation process helps break down gluten and starches, which many people, including those with sensitive stomachs or IBS, find gentler to eat.
            </li>
            <li>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Better nutrient absorption:</span>{' '}
              Natural fermentation reduces phytic acid, making it easier for your body to absorb minerals like iron and magnesium.
            </li>
            <li>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Naturally fermented, no shortcuts:</span>{' '}
              Sourdough relies on time rather than commercial yeast, creating better flavor and texture without unnecessary additives.
            </li>
            <li>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Steadier energy:</span>{' '}
              Compared to fast-risen breads, sourdough fermentation leads to a slower rise in blood sugar, which some people with diabetes or blood sugar sensitivity prefer.
            </li>
            <li>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Simple ingredients:</span>{' '}
              Made with flour, water, salt, and time - nothing added that doesn&apos;t need to be there.
            </li>
            <li>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>Better texture and freshness:</span>{' '}
              Natural fermentation helps create a crisp crust and soft center while keeping the bagels fresh without preservatives.
            </li>
          </ul>
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
