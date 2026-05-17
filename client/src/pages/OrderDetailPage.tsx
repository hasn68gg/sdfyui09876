import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate, cn } from '../lib/utils';
import api from '../lib/api';
import type { Order } from '../types';

const statusConfig: Record<string, { icon: any; color: string; ar: string; en: string }> = {
  PENDING: { icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', ar: 'قيد الانتظار', en: 'Pending' },
  PROCESSING: { icon: Package, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', ar: 'قيد المعالجة', en: 'Processing' },
  SHIPPED: { icon: Truck, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', ar: 'تم الإرسال', en: 'Shipped' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', ar: 'مكتمل', en: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', ar: 'ملغي', en: 'Cancelled' },
  OUT_OF_STOCK: { icon: AlertCircle, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', ar: 'نفدت الكمية', en: 'Out of Stock' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<{ order: Order & { items: any[] } }>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`),
    enabled: isAuthenticated && !!id,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">{locale === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first'}</p>
          <button onClick={() => navigate('/auth/login')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const order = data?.order;
  const status = order ? (statusConfig[order.status] ?? statusConfig.PENDING) : null;
  const StatusIcon = status?.icon ?? Clock;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <button onClick={() => navigate('/orders')}
          className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          {locale === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}
        </button>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : error || !order ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{locale === 'ar' ? 'الطلب غير موجود' : 'Order not found'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-foreground mb-1">
                  {locale === 'ar' ? 'طلب رقم' : 'Order'} #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <span className={cn('flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full', status?.color)}>
                <StatusIcon className="w-4 h-4" />
                {locale === 'ar' ? status?.ar : status?.en}
              </span>
            </div>

            {/* Items */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {locale === 'ar' ? 'المنتجات' : 'Items'}
              </h2>
              <div className="space-y-3">
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                    {item.product?.thumbnail && (
                      <img src={item.product.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-1">
                        {locale === 'ar' ? (item.product?.nameAr || item.productNameAr) : (item.product?.nameEn || item.productNameEn)}
                      </p>
                      <p className="text-xs text-muted-foreground">{locale === 'ar' ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}</p>
                    </div>
                    <p className="font-bold text-primary flex-shrink-0">{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping */}
            {order.shippingAddress && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {locale === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}
                </h2>
                <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
              </div>
            )}

            {/* Payment summary */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                {locale === 'ar' ? 'ملخص الدفع' : 'Payment Summary'}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</span>
                  <span>{order.paymentMethod === 'WALLET' ? (locale === 'ar' ? 'المحفظة' : 'Wallet') : (locale === 'ar' ? 'عند الاستلام' : 'Cash on Delivery')}</span>
                </div>
                {(order as any).discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{locale === 'ar' ? 'الخصم' : 'Discount'}</span>
                    <span>- {formatPrice((order as any).discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base pt-2 border-t border-border">
                  <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
