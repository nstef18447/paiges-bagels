import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: '#f6f4f0' }}
    >
      {/* Big 404 */}
      <h1
        className="font-black select-none"
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: 'clamp(8rem, 25vw, 16rem)',
          color: 'var(--blue)',
          opacity: 0.08,
          lineHeight: 1,
          marginBottom: -24,
        }}
      >
        404
      </h1>

      {/* Headline */}
      <h2
        className="text-[2rem] md:text-[2.5rem] font-black mb-3"
        style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)', lineHeight: 1.15 }}
      >
        Lost Your Bagel?
      </h2>

      {/* Subtitle */}
      <p
        className="text-[1rem] mb-8 mx-auto"
        style={{ color: '#6b7280', maxWidth: 380 }}
      >
        The page you&apos;re looking for doesn&apos;t exist. But our bagels do.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-8 py-3.5 font-semibold text-[0.85rem] uppercase tracking-[0.08em] text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--blue)' }}
        >
          Go Home
        </Link>
        <Link
          href="/order"
          className="px-8 py-3.5 font-semibold text-[0.85rem] uppercase tracking-[0.08em] transition-all hover:-translate-y-0.5"
          style={{
            color: 'var(--blue)',
            border: '2px solid var(--blue)',
            backgroundColor: 'transparent',
          }}
        >
          Order Bagels
        </Link>
      </div>
    </div>
  );
}
