import { useState } from 'react';
import { X, Plus, BarChart2 } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { formatPrice, cn } from '../lib/utils';
import api from '../lib/api';
import type { Product } from '../types';

export default function ComparePage() {
  const { locale } = useLocale();
  const [productIds, setProductIds] = useState<string[]>([]);

  const { data } = useQuery<{ products: Product[] }>({
    queryKey: ['compare-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return { products: [] };
      const results = await Promise.allSettled(productIds.map(id => api.get<any>(`/products/${id}`)));
      const products = results.flatMap(r => r.status === 'fulfilled' ? [r.value.product || r.value] : []);
      return { products: products.filter(Boolean) };
    },
    enabled: productIds.length > 0,
  });

  const products = data?.products || [];

  const removeProduct = (id: string) => setProductIds(prev => prev.filter(p => p !== id));

  if (productIds.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <BarChart2 className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-xl font-bold">{locale === 'ar' ? 'قارن بين المنتجات' : 'Compare Products'}</h2>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            {locale === 'ar'
              ? 'اضف منتجات من صفحة المنتجات لمقارنتها هنا'
              : 'Add products from the products page to compare them here'}
          </p>
          <Link href="/products" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all">
            {locale === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const specs = ['nameAr', 'nameEn', 'brand', 'price', 'discountPrice', 'stock', 'rating'];
  const specLabels: Record<string, { ar: string; en: string }> = {
    nameAr: { ar: 'الاسم (عربي)', en: 'Name (Arabic)' },
    nameEn: { ar: 'الاسم (إنجليزي)', en: 'Name (English)' },
    brand: { ar: 'الماركة', en: 'Brand' },
    price: { ar: 'السعر', en: 'Price' },
    discountPrice: { ar: 'سعر التخفيض', en: 'Discount Price' },
    stock: { ar: 'المخزون', en: 'Stock' },
    rating: { ar: 'التقييم', en: 'Rating' },
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10 overflow-x-auto">
        <h1 className="text-2xl lg:text-3xl font-black text-foreground mb-8 flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-primary" />
          {locale === 'ar' ? 'مقارنة المنتجات' : 'Compare Products'}
        </h1>

        <div className="min-w-max">
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `200px repeat(${products.length}, 220px)` }}>
            <div />
            {products.map(product => (
              <div key={product.id} className="bg-card border border-border rounded-2xl p-4 relative">
                <button onClick={() => removeProduct(product.id)}
                  className="absolute top-2 end-2 w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive transition-all">
                  <X className="w-3 h-3" />
                </button>
                {product.thumbnail && <img src={product.thumbnail} alt="" className="w-full h-28 object-cover rounded-xl mb-3" />}
                <p className="font-semibold text-sm line-clamp-2">{locale === 'ar' ? product.nameAr : product.nameEn}</p>
              </div>
            ))}
          </div>

          {specs.map(spec => (
            <div key={spec} className="grid gap-4 mt-2" style={{ gridTemplateColumns: `200px repeat(${products.length}, 220px)` }}>
              <div className="flex items-center px-3 py-2.5 bg-muted rounded-xl">
                <span className="text-xs font-semibold text-muted-foreground">{locale === 'ar' ? specLabels[spec]?.ar : specLabels[spec]?.en}</span>
              </div>
              {products.map(product => (
                <div key={product.id} className="flex items-center px-3 py-2.5 bg-card border border-border rounded-xl">
                  <span className="text-sm">
                    {spec === 'price' || spec === 'discountPrice'
                      ? (product as any)[spec] ? formatPrice((product as any)[spec]) : '—'
                      : String((product as any)[spec] ?? '—')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
