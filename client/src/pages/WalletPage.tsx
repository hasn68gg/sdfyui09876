import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Link } from 'wouter';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate, cn } from '../lib/utils';
import api from '../lib/api';

export default function WalletPage() {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get<any>('/wallet'),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Link href="/auth/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const balance = data?.wallet?.balance ?? 0;
  const transactions = data?.transactions ?? [];
  const topupRequests = data?.topupRequests ?? [];
  const walletEnabled = data?.walletEnabled ?? false;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl lg:text-3xl font-black text-foreground mb-8 flex items-center gap-3">
          <Wallet className="w-7 h-7 text-primary" />
          {locale === 'ar' ? 'المحفظة' : 'Wallet'}
        </h1>

        {!walletEnabled && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl p-4 mb-6 text-amber-700 dark:text-amber-400 text-sm font-medium">
            {locale === 'ar' ? '⚠️ المحفظة معطّلة حالياً من قبل الإدارة' : '⚠️ Wallet is currently disabled by admin'}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl p-6 text-white space-y-2">
            <p className="text-blue-100 text-sm">{locale === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</p>
            <p className="text-3xl font-black">{formatPrice(balance)}</p>
            {walletEnabled && (
              <p className="text-blue-100 text-xs">{locale === 'ar' ? 'يمكن استخدامه في الشراء' : 'Available for purchases'}</p>
            )}
          </div>
          <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-3">{locale === 'ar' ? 'شحن المحفظة' : 'Top Up Wallet'}</h3>
            <p className="text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'لشحن المحفظة، تواصل معنا عبر الدعم الفني أو زر طلبات الشحن.'
                : 'To top up your wallet, contact us via support or check topup requests.'}
            </p>
            <Link href="/support" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
              {locale === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
            </Link>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-foreground">{locale === 'ar' ? 'سجل المعاملات' : 'Transaction History'}</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {locale === 'ar' ? 'لا توجد معاملات بعد' : 'No transactions yet'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx: any) => {
                const isPositive = tx.wallet_transactions?.amount > 0;
                return (
                  <div key={tx.wallet_transactions?.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20')}>
                        {isPositive ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.wallet_transactions?.description || (tx.wallet_transactions?.type === 'TOPUP' ? (locale === 'ar' ? 'شحن' : 'Top-up') : (locale === 'ar' ? 'شراء' : 'Purchase'))}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.wallet_transactions?.createdAt, locale)}</p>
                      </div>
                    </div>
                    <span className={cn('font-bold', isPositive ? 'text-green-600' : 'text-red-600')}>
                      {isPositive ? '+' : ''}{formatPrice(tx.wallet_transactions?.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
