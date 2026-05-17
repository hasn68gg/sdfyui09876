import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, Wallet, Banknote, Tag, Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../lib/store';
import { formatPrice } from '../lib/utils';
import api from '../lib/api';

export default function CheckoutPage() {
  const { locale, isRTL } = useLocale();
  const { isAuthenticated, token } = useAuth();
  const [, navigate] = useLocation();
  const { items, total, clearCart } = useCartStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [shippingBranch, setShippingBranch] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [notes, setNotes] = useState('');
  const [orderId, setOrderId] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: walletData } = useQuery<{ wallet: { balance: number } | null; walletEnabled: boolean }>({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet'),
    enabled: isAuthenticated,
  });

  const cartTotal = total();
  const walletBalance = walletData?.wallet?.balance ?? 0;
  const walletEnabled = walletData?.walletEnabled ?? false;

  const mutation = useMutation({
    mutationFn: () => api.post<{ order: { id: string } }>('/orders', {
      fullName, phone, address,
      shippingBranch: shippingBranch || undefined,
      useWallet,
      couponCode: couponCode.trim() || undefined,
      notes: notes.trim() || undefined,
      lang: locale,
      items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
    }),
    onSuccess: (data) => {
      setOrderId(data.order.id);
      setSuccess(true);
      clearCart();
      toast.success(locale === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order placed successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message || (locale === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (items.length === 0) { toast.error(locale === 'ar' ? 'السلة فارغة' : 'Cart is empty'); return; }
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast.error(locale === 'ar' ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (useWallet && walletBalance < cartTotal) {
      toast.error(locale === 'ar'
        ? `لا يوجد رصيد كافٍ. الرصيد الحالي: ${formatPrice(walletBalance)}`
        : `Insufficient balance. Current: ${formatPrice(walletBalance)}`);
      return;
    }
    mutation.mutate();
  };

  if (success) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md space-y-6">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'تم تأكيد طلبك!' : 'Order Confirmed!'}</h2>
            <p className="text-muted-foreground">
              {locale === 'ar' ? 'رقم الطلب:' : 'Order number:'}
              {' '}<span className="font-bold text-foreground">#{orderId.slice(-8).toUpperCase()}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {locale === 'ar' ? 'سيتم التواصل معك قريباً لتأكيد التوصيل' : 'We will contact you soon to confirm delivery'}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/orders')} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                {locale === 'ar' ? 'طلباتي' : 'My Orders'}
              </button>
              <button onClick={() => navigate('/')} className="border border-border text-foreground px-6 py-3 rounded-xl font-semibold hover:bg-accent transition-colors">
                {locale === 'ar' ? 'الرئيسية' : 'Home'}
              </button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/40" />
          <h2 className="text-xl font-bold">{locale === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</h2>
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
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-2xl lg:text-3xl font-black text-foreground">{locale === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'}</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Shipping Info */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-foreground text-lg">{locale === 'ar' ? 'بيانات التوصيل' : 'Delivery Information'}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{locale === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} required
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{locale === 'ar' ? 'رقم الهاتف *' : 'Phone *'}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} required
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'العنوان الكامل *' : 'Full Address *'}</label>
                <input value={address} onChange={e => setAddress(e.target.value)} required
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'الفرع / المنطقة' : 'Branch / Area'}</label>
                <input value={shippingBranch} onChange={e => setShippingBranch(e.target.value)}
                  placeholder={locale === 'ar' ? 'اختياري' : 'Optional'}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{locale === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder={locale === 'ar' ? 'أي تعليمات خاصة للتوصيل...' : 'Any special delivery instructions...'}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />{locale === 'ar' ? 'كوبون الخصم' : 'Discount Coupon'}</h2>
              <div className="flex gap-3">
                <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={locale === 'ar' ? 'أدخل كوبون الخصم' : 'Enter coupon code'}
                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tracking-widest" />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-foreground">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</h2>
              <div className="space-y-3">
                <button type="button" onClick={() => setUseWallet(false)}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl transition-all ${!useWallet ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!useWallet ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-sm">{locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'ادفع عند وصول الطلب' : 'Pay when order arrives'}</p>
                  </div>
                  <div className={`ms-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${!useWallet ? 'border-primary' : 'border-border'}`}>
                    {!useWallet && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                </button>

                {walletEnabled && (
                  <button type="button" onClick={() => setUseWallet(true)}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl transition-all ${useWallet ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${useWallet ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <p className="font-semibold text-sm">{locale === 'ar' ? 'الدفع من المحفظة' : 'Pay from Wallet'}</p>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'ar' ? `الرصيد: ${formatPrice(walletBalance)}` : `Balance: ${formatPrice(walletBalance)}`}
                      </p>
                    </div>
                    <div className={`ms-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${useWallet ? 'border-primary' : 'border-border'}`}>
                      {useWallet && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                  </button>
                )}

                {useWallet && walletBalance < cartTotal && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                    ⚠️ {locale === 'ar'
                      ? `لا يوجد رصيد كافٍ. تحتاج ${formatPrice(cartTotal)} والرصيد الحالي ${formatPrice(walletBalance)}`
                      : `Insufficient balance. Need ${formatPrice(cartTotal)}, current balance ${formatPrice(walletBalance)}`}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={mutation.isPending || (useWallet && walletBalance < cartTotal)}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3">
              {mutation.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" />{locale === 'ar' ? 'جاري تأكيد الطلب...' : 'Placing order...'}</>
              ) : (
                <><CheckCircle className="w-5 h-5" />{locale === 'ar' ? 'تأكيد الطلب' : 'Place Order'}</>
              )}
            </button>
          </form>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
              <h2 className="font-bold text-foreground mb-4">{locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatPrice((item.discountPrice ?? item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{locale === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span className="text-green-600">{locale === 'ar' ? 'مجاني' : 'Free'}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
