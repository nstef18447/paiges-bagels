import Image from 'next/image';
import Link from 'next/link';

export default function MerchPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#f6f4f0' }}>
      <Link href="/">
        <Image
          src="/logo.svg"
          alt="Paige's Bagels"
          width={300}
          height={300}
          unoptimized
          className="w-auto h-auto max-w-[350px] cursor-pointer"
          style={{ marginTop: '-40px', marginBottom: '-60px' }}
          priority
        />
      </Link>
      <h1 className="text-4xl font-extrabold" style={{ color: '#004AAD' }}>
        Coming Soon...
      </h1>
    </div>
  );
}
