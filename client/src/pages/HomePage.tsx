import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Star, ArrowRight, Shield, Truck, HeadphonesIcon } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ProductCard from '../components/products/ProductCard';
import { useLocale } from '../context/LocaleContext';
import api from '../lib/api';
import type { Product, Category, Banner } from '../types';

interface HomeData {
  banners: Banner[];
  featuredProducts: Product[];
  categories: Category[];
  offerProducts: Product[];
  offersProducts: Product[];
}

export default function HomePage() {
  const { locale, isRTL } = useLocale();

  const { data, isLoading } = useQuery<HomeData>({
    queryKey: ['home'],
    queryFn: () => api.get<HomeData>('/home'),
  });

  const features = [
    { icon: Shield, titleAr: 'ضمان الجودة', titleEn: 'Quality Guarantee', descAr: 'جميع المنتجات مضمونة', descEn: 'All products guaranteed' },
    { icon: Truck, titleAr: 'شحن سريع', titleEn: 'Fast Shipping', descAr: 'توصيل سريع لبابك', descEn: 'Quick delivery to your door' },
    { icon: HeadphonesIcon, titleAr: 'دعم 24/7', titleEn: '24/7 Support', descAr: 'نحن دائماً هنا لمساعدتك', descEn: 'We are always here to help' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: isRTL ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold">
                <Zap className="w-4 h-4" />
                {locale === 'ar' ? 'التكنولوجيا الأفضل' : 'Best Technology'}
              </span>
              <h1 className="text-4xl lg:text-6xl font-black text-foreground leading-tight">
                {locale === 'ar' ? (
                  <>اكتشف عالم <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">اللابتوبات</span></>
                ) : (
                  <>Discover the World of <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Laptops</span></>
                )}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                {locale === 'ar'
                  ? 'أحدث الموديلات بأفضل الأسعار. جودة مضمونة، وشحن سريع إلى باب منزلك.'
                  : 'Latest models at the best prices. Guaranteed quality, fast shipping to your door.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products" className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5">
                  <ShoppingBag className="w-5 h-5" />
                  {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                </Link>
                <Link href="/products?offers=true" className="flex items-center gap-2 px-8 py-4 bg-card border border-border text-foreground rounded-2xl font-bold text-lg hover:bg-accent transition-all hover:-translate-y-0.5">
                  {locale === 'ar' ? 'استكشف العروض' : 'Explore Offers'}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                {features.map(({ icon: Icon, titleAr, titleEn, descAr, descEn }) => (
                  <div key={titleEn} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{locale === 'ar' ? titleAr : titleEn}</p>
                      <p className="text-xs text-muted-foreground">{locale === 'ar' ? descAr : descEn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: isRTL ? -40 : 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-96 h-80 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-3xl flex items-center justify-center border border-border">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl mx-auto">
                    <ShoppingBag className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {locale === 'ar' ? '+500 منتج متاح' : '500+ Products Available'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        {data?.categories && data.categories.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl lg:text-3xl font-black text-foreground mb-8">
              {locale === 'ar' ? 'تصفح الأقسام' : 'Browse Categories'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {data.categories.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/products?category=${cat.slug}`}
                    className="flex flex-col items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                      {cat.image ? (
                        <img src={cat.image} alt={locale === 'ar' ? cat.nameAr : cat.nameEn} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-2xl">💻</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-center text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {locale === 'ar' ? cat.nameAr : cat.nameEn}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {(data?.featuredProducts && data.featuredProducts.length > 0) || isLoading ? (
          <section className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-black text-foreground">
                {locale === 'ar' ? 'منتجات مميزة' : 'Featured Products'}
              </h2>
              <Link href="/products?featured=true" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
                {locale === 'ar' ? 'عرض الكل' : 'View All'}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {data!.featuredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            )}
          </section>
        ) : null}

        {/* Special Offers */}
        {(data?.offersProducts ?? data?.offerProducts ?? []).length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-black text-foreground flex items-center gap-3">
                <span className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </span>
                {locale === 'ar' ? 'عروض خاصة' : 'Special Offers'}
              </h2>
              <Link href="/products?offers=true" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
                {locale === 'ar' ? 'عرض الكل' : 'View All'}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
              {(data?.offersProducts ?? data?.offerProducts ?? []).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
