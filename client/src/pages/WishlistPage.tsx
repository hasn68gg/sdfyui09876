import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ProductCard from '../components/products/ProductCard';
import { useLocale } from '../context/LocaleContext';
import { useWishlistStore } from '../lib/store';
import api from '../lib/api';
import type { Product } from '../types';

export default function WishlistPage() {
  const { locale } = useLocale();
  const { ids } = useWishlistStore();

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['wishlist-products', ids],
    queryFn: async () => {
      if (ids.length === 0) return { products: [] };
      const results = await Promise.allSettled(ids.map(id => api.get<Product>(`/products/${id}`)));
      const products = results.flatMap(r => r.status === 'fulfilled' ? [(r.value as any).product || r.value] : []);
      return { products: products.filter(Boolean) };
    },
    enabled: ids.length > 0,
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl lg:text-3xl font-black text-foreground mb-8 flex items-center gap-3">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" />
          {locale === 'ar' ? 'المفضلة' : 'Wishlist'}
          {ids.length > 0 && <span className="text-base font-normal text-muted-foreground">({ids.length})</span>}
        </h1>

        {ids.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <h3 className="text-xl font-bold">{locale === 'ar' ? 'قائمة المفضلة فارغة' : 'Wishlist is empty'}</h3>
            <Link href="/products" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all">
              {locale === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {data?.products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
