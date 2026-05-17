import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useCartStore } from '../lib/store';
import { formatPrice } from '../lib/utils';

export default function CartPage() {
  const { locale, isRTL } = useLocale();
  const [, navigate] = useLocation();
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/40" />
          <h2 className="text-xl font-bold">{locale === 'ar' ? 'السلة فارغة' : 'Your cart is empty'}</h2>
          <p className="text-muted-foreground">{locale === 'ar' ? 'أضف منتجات للسلة لمتابعة الشراء' : 'Add products to your cart to continue shopping'}</p>
          <Link href="/products" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all">
            {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl lg:text-3xl font-black text-foreground mb-8">{locale === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl border border-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-bold">{formatPrice(item.discountPrice ?? item.price)}</span>
                      {item.discountPrice && <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 border border-border rounded-xl overflow-hidden">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-accent transition-all"><Minus className="w-3 h-3" /></button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-accent transition-all"><Plus className="w-3 h-3" /></button>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-primary">{formatPrice((item.discountPrice ?? item.price) * item.quantity)}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 h-fit sticky top-20 space-y-4">
            <h2 className="font-bold text-foreground">{locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{locale === 'ar' ? 'عدد المنتجات' : 'Items'}</span><span>{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{locale === 'ar' ? 'الشحن' : 'Shipping'}</span><span className="text-green-600">{locale === 'ar' ? 'مجاني' : 'Free'}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="text-primary">{formatPrice(total())}</span>
              </div>
            </div>
            <button onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20">
              {locale === 'ar' ? 'إتمام الطلب' : 'Proceed to Checkout'}
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <Link href="/products" className="block text-center text-sm text-primary hover:underline">
              {locale === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
