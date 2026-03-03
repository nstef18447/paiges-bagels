import { notFound } from 'next/navigation';
import Image from 'next/image';
import NavBar from '@/components/NavBar';
import { getProductById } from '@/lib/products';
import ProductDetailActions from '@/app/components/ProductDetailActions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) return notFound();

  const soldOut = product.stock !== null && product.stock <= 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <NavBar />

      <div className="product-detail-container">
        {/* Image */}
        <div className="product-detail-image">
          {product.image_url ? (
            <Image
              src={product.image_url.startsWith('/') ? product.image_url : `/${product.image_url}`}
              alt={product.name}
              width={800}
              height={800}
              className="w-full h-full object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#eae7e1' }}>
              <span className="text-7xl">🛍️</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-detail-info">
          <h1
            className="text-[1.8rem] md:text-[2.2rem] font-black mb-2"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--blue)' }}
          >
            {product.name}
          </h1>

          <p className="font-semibold text-[1.2rem] mb-3" style={{ color: 'var(--brown)' }}>
            {soldOut ? 'Sold Out' : `$${product.price.toFixed(2)}`}
          </p>

          {soldOut && (
            <span
              className="inline-block px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-wider rounded-full mb-4"
              style={{ background: 'var(--red-bg)', color: 'var(--red)' }}
            >
              Sold Out
            </span>
          )}

          {product.description && (
            <p className="text-[0.95rem] leading-relaxed mb-8" style={{ color: '#6b7280' }}>
              {product.description}
            </p>
          )}

          <ProductDetailActions item={product} />
        </div>
      </div>
    </div>
  );
}
