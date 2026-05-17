import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import api from '../../lib/api';

export default function AdminBanners() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titleAr: '', titleEn: '', image: '', link: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.get<{ banners: any[] }>('/admin/banners'),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/admin/banners', { ...form, isActive: true, sortOrder: 0 }),
    onSuccess: () => { toast.success(locale === 'ar' ? 'تم الإضافة' : 'Added'); qc.invalidateQueries({ queryKey: ['admin-banners'] }); setShowForm(false); setForm({ titleAr: '', titleEn: '', image: '', link: '' }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/admin/banners/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => { toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries({ queryKey: ['admin-banners'] }); },
  });

  const banners = data?.banners || [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Image className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'البانرات' : 'Banners'}
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            {locale === 'ar' ? 'إضافة بانر' : 'Add Banner'}
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-bold">{locale === 'ar' ? 'بانر جديد' : 'New Banner'}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
                <input value={form.titleAr} onChange={e => setForm(p => ({ ...p, titleAr: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title (English)</label>
                <input value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'رابط الصورة' : 'Image URL'}</label>
              <input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} required
                placeholder="https://..." className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{locale === 'ar' ? 'رابط البانر (اختياري)' : 'Banner Link (optional)'}</label>
              <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                placeholder="/products" className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            {form.image && <img src={form.image} alt="preview" className="w-full h-32 object-cover rounded-xl border border-border" onError={e => (e.currentTarget.style.display = 'none')} />}
            <div className="flex gap-3">
              <button onClick={() => addMutation.mutate()} disabled={!form.image || addMutation.isPending}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
                {addMutation.isPending ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ' : 'Save')}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-all">
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {isLoading ? [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />) :
            banners.map(banner => (
              <div key={banner.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="relative aspect-video">
                  <img src={banner.image} alt={locale === 'ar' ? banner.titleAr : banner.titleEn} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-end p-3">
                    <p className="text-white font-semibold text-sm">{locale === 'ar' ? banner.titleAr : banner.titleEn}</p>
                  </div>
                  <div className={`absolute top-2 end-2 px-2 py-1 rounded-full text-xs font-bold ${banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {banner.isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'مخفي' : 'Hidden')}
                  </div>
                </div>
                <div className="flex gap-2 p-3">
                  <button onClick={() => toggleMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-xs hover:bg-accent transition-all">
                    {banner.isActive ? <><EyeOff className="w-3 h-3" />{locale === 'ar' ? 'إخفاء' : 'Hide'}</> : <><Eye className="w-3 h-3" />{locale === 'ar' ? 'إظهار' : 'Show'}</>}
                  </button>
                  <button onClick={() => { if (confirm(locale === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) deleteMutation.mutate(banner.id); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </AdminLayout>
  );
}
