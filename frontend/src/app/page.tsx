import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AuthRedirect } from '@/components/landing/AuthRedirect';

// ─── Feature cards data ────────────────────────────────────────────────────────

const features = [
  {
    icon: '✨',
    title: 'AI Summary',
    description:
      'Buat ringkasan profil profesional secara otomatis berdasarkan pengalaman kerjamu.',
  },
  {
    icon: '📊',
    title: 'Analisis ATS',
    description:
      'Cek kompatibilitas resume kamu dengan sistem ATS dan dapatkan rekomendasi perbaikan.',
  },
  {
    icon: '📝',
    title: 'Cover Letter',
    description:
      'Generate cover letter yang dipersonalisasi untuk setiap lamaran kerja.',
  },
];

// ─── Pricing data ─────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Gratis',
    price: 'Rp 0',
    period: '',
    highlight: false,
    perks: ['5 kredit resume', 'AI features terbatas', 'Export PDF (template ATS)'],
    cta: 'Daftar Gratis',
    href: '/register',
    variant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: 'Rp 49.000',
    period: '/bulan',
    highlight: true,
    perks: ['Resume tanpa batas', 'AI features penuh', 'Export semua template', 'Prioritas support'],
    cta: 'Coba Pro',
    href: '/register',
    variant: 'default' as const,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* Redirect authenticated users to dashboard */}
      <AuthRedirect />

      <div className="flex flex-col min-h-full bg-background text-foreground">

        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <header className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              AlresumeBuilder
            </Link>
            <nav className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Mulai Gratis</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main className="flex-1">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <section className="py-24 text-center">
            <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-6">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight max-w-2xl">
                Buat Resume Profesional dengan Bantuan AI
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                AlresumeBuilder membantu kamu membuat resume yang menonjol dengan
                teknologi AI — analisis ATS, ringkasan profil, dan cover letter otomatis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Button size="lg" asChild>
                  <Link href="/register">Mulai Gratis</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Masuk</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* ── Features ─────────────────────────────────────────────────── */}
          <section className="py-20 bg-secondary/30">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-12">
                Semua yang kamu butuhkan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {features.map((f) => (
                  <Card key={f.title} className="text-center">
                    <CardHeader>
                      <div className="text-4xl mb-2">{f.icon}</div>
                      <CardTitle className="text-lg">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">
                        {f.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* ── Pricing ──────────────────────────────────────────────────── */}
          <section className="py-20">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-12">
                Pilih plan kamu
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {plans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={plan.highlight ? 'border-primary shadow-md' : ''}
                  >
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        {plan.period && (
                          <span className="text-muted-foreground text-sm">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {plan.perks.map((perk) => (
                          <li key={perk} className="flex items-center gap-2">
                            <span className="text-primary">✓</span>
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button variant={plan.variant} className="w-full" asChild>
                        <Link href={plan.href}>{plan.cta}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>

        </main>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © 2025 AlresumeBuilder. All rights reserved.
        </footer>

      </div>
    </>
  );
}
