import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice, formatDate, cn } from '../../lib/utils';
import api from '../../lib/api';

export default function AdminWallet() {
  const { locale } = useLocale();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wallet'],
    queryFn: () => api.get<{ topups: any[] }>('/admin/wallet'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      api.put(`/admin/wallet/${id}`, { status, adminNote }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم التحديث' : 'Updated');
      qc.invalidateQueries({ queryKey: ['admin-wallet'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const topups = data?.topups || [];

  const statusConfig: Record<string, { icon: any; ar: string; en: string; color: string; bg: string }> = {
    PENDING: { icon: Clock, ar: 'قيد الانتظار', en: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    APPROVED: { icon: CheckCircle, ar: 'مقبول', en: 'Approved', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    REJECTED: { icon: XCircle, ar: 'مرفوض', en: 'Rejected', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          {locale === 'ar' ? 'طلبات شحن المحفظة' : 'Wallet Topup Requests'}
        </h1>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : topups.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {locale === 'ar' ? 'لا توجد طلبات شحن' : 'No topup requests'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topups.map((topup: any) => {
                const st = topup.wallet_topup_requests?.status || 'PENDING';
                const sc = statusConfig[st] || statusConfig.PENDING;
                const Icon = sc.icon;
                return (
                  <div key={topup.wallet_topup_requests?.id} className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', sc.bg)}>
                          <Icon className={`w-5 h-5 ${sc.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{topup.users?.name || topup.users?.email}</p>
                          <p className="text-xs text-muted-foreground">{topup.users?.email} • {formatDate(topup.wallet_topup_requests?.createdAt, locale)}</p>
                          {topup.wallet_topup_requests?.transactionRef && (
                            <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'مرجع: ' : 'Ref: '}{topup.wallet_topup_requests.transactionRef}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-primary">{formatPrice(topup.wallet_topup_requests?.amount || 0)}</span>
                        {st === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => updateMutation.mutate({ id: topup.wallet_topup_requests.id, status: 'APPROVED' })}
                              disabled={updateMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-semibold hover:bg-green-100 transition-all">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {locale === 'ar' ? 'قبول' : 'Approve'}
                            </button>
                            <button onClick={() => updateMutation.mutate({ id: topup.wallet_topup_requests.id, status: 'REJECTED' })}
                              disabled={updateMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-all">
                              <XCircle className="w-3.5 h-3.5" />
                              {locale === 'ar' ? 'رفض' : 'Reject'}
                            </button>
                          </div>
                        )}
                        {st !== 'PENDING' && (
                          <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', sc.bg, sc.color)}>
                            {locale === 'ar' ? sc.ar : sc.en}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
