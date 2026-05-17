import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';

export default function AdminPaymentMethods() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nameAr: '', nameEn: '', accountNumber: '', accountName: '', instructions: '', isActive: true });

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods-admin'],
    queryFn: () => api.get<{ paymentMethods: any[] }>('/admin/payment-methods'),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/admin/payment-methods', form),
    onSuccess: () => { toast.success(locale === 'ar' ? 'تمت الإضافة' : 'Added'); qc.invalidateQueries({ queryKey: ['payment-methods-admin'] }); setShowForm(false); },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/admin/payment-methods/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods-admin'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/payment-methods/${id}`),
    onSuccess: () => { toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries({ queryKey: ['payment-methods-admin'] }); },
  });

  const methods = data?.paymentMethods || [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            {locale === 'ar' ? 'إضافة طريقة دفع' : 'Add Payment Method'}
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-bold">{locale === 'ar' ? 'طريقة دفع جديدة' : 'New Payment Method'}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[{ k: 'nameAr', label: locale === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)' }, { k: 'nameEn', label: locale === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)' }, { k: 'accountNumber', label: locale === 'ar' ? 'رقم الحساب' : 'Account Number' }, { k: 'accountName', label: locale === 'ar' ? 'اسم الحساب' : 'Account Name' }].map(({ k, label }) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <input value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'تعليمات الدفع' : 'Payment Instructions'}</label>
              <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => addMutation.mutate()} disabled={!form.nameAr || addMutation.isPending}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
                {addMutation.isPending ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ' : 'Save')}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-all">
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? [...Array(2)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />) :
            methods.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                {locale === 'ar' ? 'لا توجد طرق دفع' : 'No payment methods'}
              </div>
            ) : methods.map((method: any) => (
              <div key={method.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{locale === 'ar' ? method.nameAr : method.nameEn}</p>
                  {method.accountNumber && <p className="text-xs text-muted-foreground">{method.accountNumber}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${method.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {method.isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'مخفي' : 'Hidden')}
                  </span>
                  <button onClick={() => toggleMutation.mutate({ id: method.id, isActive: !method.isActive })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-all text-muted-foreground">
                    {method.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { if (confirm(locale === 'ar' ? 'تأكيد الحذف؟' : 'Confirm?')) deleteMutation.mutate(method.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </AdminLayout>
  );
}
