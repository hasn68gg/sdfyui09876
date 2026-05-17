import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice, cn } from '../../lib/utils';
import api from '../../lib/api';
import type { Product } from '../../types';

export default function AdminProducts() {
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => api.get<{ products: Product[] }>(`/products?limit=100${search ? `&q=${search}` : ''}`),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/admin/products/${id}`, { isActive }),
    onSuccess: () => { toast.success(locale === 'ar' ? 'تم التحديث' : 'Updated'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const products = data?.products || [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            {locale === 'ar' ? 'المنتجات' : 'Products'}
          </h1>
          <span className="text-sm text-muted-foreground">{products.length} {locale === 'ar' ? 'منتج' : 'products'}</span>
        </div>

        <div className="relative">
          <Search className="absolute top-3 start-3 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'بحث في المنتجات...' : 'Search products...'}
            className="w-full ps-9 pe-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">{locale === 'ar' ? 'لا توجد منتجات' : 'No products'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'المنتج' : 'Product'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">{locale === 'ar' ? 'السعر' : 'Price'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">{locale === 'ar' ? 'المخزون' : 'Stock'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.thumbnail && (
                            <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{locale === 'ar' ? product.nameAr : product.nameEn}</p>
                            {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <span className="font-semibold text-primary">{formatPrice(product.discountPrice ?? product.price)}</span>
                          {product.discountPrice && <span className="text-xs text-muted-foreground line-through ms-2">{formatPrice(product.price)}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', product.stock === 0 ? 'bg-red-100 text-red-600' : product.stock < 5 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', product.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600')}>
                          {product.isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'مخفي' : 'Hidden')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleMutation.mutate({ id: product.id, isActive: !product.isActive })}
                            disabled={toggleMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-all text-muted-foreground hover:text-foreground">
                            {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => { if (confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Confirm delete?')) deleteMutation.mutate(product.id); }}
                            disabled={deleteMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
