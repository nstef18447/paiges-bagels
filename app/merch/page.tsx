import NavBar from '@/components/NavBar';

export default function MerchPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f4f0' }}>
      <div className="max-w-xl mx-auto px-6 pb-10">
        <NavBar />
        <div className="flex items-center justify-center py-20">
          <h1 className="text-4xl font-extrabold" style={{ color: '#004AAD' }}>
            Coming Soon...
          </h1>
        </div>
      </div>
    </div>
  );
}
