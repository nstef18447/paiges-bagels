'use client';

import Image from 'next/image';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

const BENEFITS = [
  {
    title: 'Easier to Digest',
    desc: 'Long fermentation breaks down gluten and starches, making it gentler on sensitive stomachs and IBS.',
  },
  {
    title: 'Better Nutrient Absorption',
    desc: 'Natural fermentation reduces phytic acid, making it easier to absorb minerals like iron and magnesium.',
  },
  {
    title: 'Naturally Fermented, No Shortcuts',
    desc: 'Sourdough relies on time rather than commercial yeast, creating better flavor and texture without additives.',
  },
  {
    title: 'Steadier Energy',
    desc: 'Sourdough fermentation leads to a slower rise in blood sugar compared to fast-risen breads.',
  },
  {
    title: 'Simple Ingredients',
    desc: "Made with flour, water, salt, and time — nothing added that doesn't need to be there.",
  },
  {
    title: 'Better Texture & Freshness',
    desc: 'Natural fermentation creates a crisp crust and soft center while keeping bagels fresh without preservatives.',
  },
];

const STRIP_IMAGES = [
  { src: '/best-images/IMG_2102.JPG', alt: 'Fresh bagel variety on cutting board' },
  { src: '/best-images/IMG_2105.JPG', alt: 'Hand holding sesame bagel overhead' },
  { src: '/best-images/IMG_2163.JPG', alt: 'Salt bagel with flaky crystals' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <NavBar />

      {/* Story Hero */}
      <div className="max-w-[960px] mx-auto px-5 py-10 md:px-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
          {/* Photo */}
          <div className="relative md:flex-shrink-0 md:sticky md:top-[100px]" style={{ flex: '0 0 auto' }}>
            <div className="relative rounded-2xl overflow-hidden md:w-[340px]">
              <Image
                src="/paige.JPG"
                alt="Paige"
                width={340}
                height={480}
                className="w-full h-[420px] md:h-[480px] object-cover"
                style={{ objectPosition: 'center top' }}
                priority
              />
              {/* Caption pill */}
              <div
                className="absolute bottom-4 left-4 px-4 py-2 rounded-full text-[0.78rem] font-medium text-white"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                Paige &middot; Chief Bagel Officer
              </div>
            </div>
          </div>

          {/* Story text */}
          <div>
            <div
              className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] mb-3"
              style={{ color: 'var(--brown)' }}
            >
              Our Story
            </div>
            <h1
              className="text-[2.2rem] md:text-[2.6rem] font-black mb-6"
              style={{
                color: 'var(--blue)',
                fontFamily: 'var(--font-playfair)',
                lineHeight: 1.1,
              }}
            >
              Born from a love of bagels, long runs, and{' '}
              <em className="font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>real food.</em>
            </h1>

            <div className="space-y-5">
              <p className="text-base leading-[1.75]" style={{ color: '#4a5568' }}>
                Paige&apos;s Bagels started at business school at Kellogg, as a side project fueled by a love of bagels, long runs, and the challenge of finding food that actually felt good to eat.
              </p>
              <p className="text-base leading-[1.75]" style={{ color: '#4a5568' }}>
                As a runner with chronic stomach issues, I spent years avoiding foods I loved — bagels included. That changed when I started baking sourdough and realized how much better it worked for my body. One experiment turned into another, and eventually, sourdough bagels became the thing I couldn&apos;t stop making (or sharing).
              </p>
              <p className="text-base leading-[1.75]" style={{ color: '#4a5568' }}>
                The goal is simple: bagels that are worth waking up for — naturally fermented, thoughtfully made, with a crisp crust, soft center, and nothing added that doesn&apos;t need to be there.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-7 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <div
                className="text-[1.3rem] italic font-bold mb-1"
                style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
              >
                Paige
              </div>
              <div
                className="text-[0.85rem] font-medium"
                style={{ color: 'var(--brown)' }}
              >
                Chief Bagel Officer
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pull Quote */}
      <div className="max-w-[960px] mx-auto px-5 md:px-10 pb-14">
        <div
          className="rounded-2xl text-center px-7 py-10 md:px-12 md:py-14 relative"
          style={{ backgroundColor: 'var(--blue)' }}
        >
          <div
            className="text-[4rem] leading-none -mb-3"
            style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-playfair)' }}
          >
            &ldquo;
          </div>
          <blockquote
            className="text-[1.35rem] md:text-[1.6rem] italic font-bold text-white max-w-[560px] mx-auto"
            style={{ fontFamily: 'var(--font-playfair)', lineHeight: 1.5 }}
          >
            Bagels that are worth waking up for — naturally fermented, thoughtfully made, and nothing added that doesn&apos;t need to be there.
          </blockquote>
        </div>
      </div>

      {/* Benefits of Sourdough */}
      <div className="max-w-[960px] mx-auto px-5 md:px-10 pb-14">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] mb-2"
            style={{ color: 'var(--brown)' }}
          >
            Why Sourdough?
          </div>
          <h2
            className="text-[1.8rem] font-black"
            style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
          >
            Benefits of Sourdough Bagels
          </h2>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="flex gap-4 items-start rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,74,173,0.06)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--blue-light)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--blue)">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h3
                  className="text-base font-bold mb-1"
                  style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
                >
                  {b.title}
                </h3>
                <p
                  className="text-[0.88rem] leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Strip */}
      <div className="max-w-[960px] mx-auto px-5 md:px-10 pb-14">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {STRIP_IMAGES.map((img) => (
            <div
              key={img.src}
              className="flex-shrink-0 w-[280px] h-[280px] md:w-[320px] md:h-[320px] relative rounded-2xl overflow-hidden"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-[960px] mx-auto px-5 md:px-10 pb-12 text-center">
        <h2
          className="text-[1.8rem] font-black mb-2"
          style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
        >
          Ready to try them?
        </h2>
        <p
          className="text-[0.92rem] mb-7 max-w-[400px] mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Order a batch and taste the difference real sourdough makes.
        </p>
        <Link
          href="/order"
          className="inline-flex items-center gap-2 px-12 py-4 font-semibold text-[0.88rem] uppercase tracking-[0.08em] text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--blue)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,74,173,0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--blue)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Place Your Order
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
          </svg>
        </Link>
      </div>

      {/* Bottom spacer */}
      <div className="h-10" />
    </div>
  );
}
