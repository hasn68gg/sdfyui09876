import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Package, Truck, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice, formatDate, cn } from '../../lib/utils';
import api from '../../lib/api';

const statusConfig: Record<string, { icon: any; ar: string; en: string; color: string; bg: string }> = {
  PENDING: { icon: Clock, ar: 'قيد الانتظار', en: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  PROCESSING: { icon: Package, ar: 'قيد المعالجة', en: 'Processing', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  SHIPPED: { icon: Truck, ar: 'تم الإرسال', en: 'Shipped', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  DELIVERED: { icon: CheckCircle, ar: 'مكتمل', en: 'Delivered', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { icon: XCircle, ar: 'ملغي', en: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
};

const allStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<{ orders: any[] }>('/orders'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const orders = (data?.orders || []).filter(o => !filter || o.status === filter);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'الطلبات' : 'Orders'}</h1>
          <span className="text-sm text-muted-foreground">{orders.length} {locale === 'ar' ? 'طلب' : 'orders'}</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', !filter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {locale === 'ar' ? 'الكل' : 'All'}
          </button>
          {allStatuses.map(s => {
            const sc = statusConfig[s];
            return (
              <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filter === s ? `${sc.bg} ${sc.color}` : 'bg-muted text-muted-foreground hover:text-foreground')}>
                {locale === 'ar' ? sc.ar : sc.en}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{locale === 'ar' ? 'لا توجد طلبات' : 'No orders'}</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const sc = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = sc.icon;
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <div className="flex items-center gap-4">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', sc.bg)}>
                        <Icon className={`w-4 h-4 ${sc.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.name || order.user?.email || order.fullName} • {formatDate(order.createdAt, locale)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary text-sm">{formatPrice(order.totalAmount)}</span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Customer info */}
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">{locale === 'ar' ? 'الاسم: ' : 'Name: '}</span><span className="font-medium">{order.fullName}</span></div>
                        <div><span className="text-muted-foreground">{locale === 'ar' ? 'الهاتف: ' : 'Phone: '}</span><span className="font-medium">{order.phone}</span></div>
                        <div className="sm:col-span-2"><span className="text-muted-foreground">{locale === 'ar' ? 'العنوان: ' : 'Address: '}</span><span className="font-medium">{order.address}</span></div>
                        {order.notes && <div className="sm:col-span-2"><span className="text-muted-foreground">{locale === 'ar' ? 'ملاحظات: ' : 'Notes: '}</span><span className="font-medium">{order.notes}</span></div>}
                        <div><span className="text-muted-foreground">{locale === 'ar' ? 'الدفع: ' : 'Payment: '}</span>
                          <span className="font-medium">{order.paidFromWallet ? (locale === 'ar' ? 'محفظة' : 'Wallet') : (locale === 'ar' ? 'عند الاستلام' : 'Cash on Delivery')}</span>
                        </div>
                      </div>

                      {/* Status change */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium">{locale === 'ar' ? 'تغيير الحالة:' : 'Change Status:'}</span>
                        {allStatuses.map(s => {
                          const ssc = statusConfig[s];
                          return (
                            <button key={s} disabled={order.status === s || statusMutation.isPending}
                              onClick={() => statusMutation.mutate({ id: order.id, status: s })}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                                order.status === s
                                  ? `${ssc.bg} ${ssc.color} border-transparent`
                                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50'
                              )}>
                              {locale === 'ar' ? ssc.ar : ssc.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
