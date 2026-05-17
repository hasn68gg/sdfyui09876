import { Link } from 'wouter';
import { useLocale } from '../context/LocaleContext';

export default function NotFound() {
  const { locale } = useLocale();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-8xl font-black text-primary/20">404</h1>
        <h2 className="text-2xl font-bold text-foreground">
          {locale === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h2>
        <p className="text-muted-foreground">
          {locale === 'ar' ? 'عذراً، الصفحة التي تبحث عنها غير موجودة.' : 'Sorry, the page you are looking for does not exist.'}
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all">
          {locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    </div>
  );
}
