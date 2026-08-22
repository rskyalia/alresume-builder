import Link from 'next/link';
import {
  Sparkles,
  FileSearch,
  MailPlus,
  Check,
  Zap,
  ArrowRight,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AuthRedirect } from '@/components/landing/AuthRedirect';
import type { LucideIcon } from 'lucide-react';

// ─── Feature cards data ────────────────────────────────────────────────────────

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Tailwind gradient classes for the icon tile */
  tileClass: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'AI Summary',
    description:
      'Buat ringkasan profil profesional secara otomatis berdasarkan pengalaman kerjamu.',
    tileClass: 'from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-400',
  },
  {
    icon: FileSearch,
    title: 'Analisis ATS',
    description:
      'Cek kompatibilitas resume kamu dengan sistem ATS dan dapatkan rekomendasi perbaikan.',
    tileClass: 'from-sky-500/15 to-blue-500/15 text-sky-600 dark:text-sky-400',
  },
  {
    icon: MailPlus,
    title: 'Cover Letter',
    description:
      'Generate cover letter yang dipersonalisasi untuk setiap lamaran kerja.',
    tileClass: 'from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400',
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

// ─── Logo ──────────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-md shadow-fuchsia-500/25">
      <FileText className="h-4 w-4 text-white" aria-hidden="true" />
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* Redirect authenticated users to dashboard */}
      <AuthRedirect />

      <div className="flex flex-col min-h-full bg-background text-foreground">

        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <LogoMark />
              <span className="text-lg">
                Alresume<span className="text-gradient-ai">Builder</span>
              </span>
            </Link>
            <nav className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm hover:opacity-90" asChild>
                <Link href="/register">Mulai Gratis</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main className="flex-1">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden py-24 sm:py-32">
            {/* Decorative background */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-3xl" />
              <div className="absolute right-[10%] top-1/3 h-40 w-40 rounded-full bg-sky-400/10 blur-2xl" />
              <div className="absolute left-[8%] top-1/4 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 flex flex-col items-center gap-6 text-center">
              {/* Badge pill */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Ditenagai kecerdasan buatan
              </span>

              <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                Buat Resume Profesional dengan{' '}
                <span className="text-gradient-ai">Bantuan AI</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                AlresumeBuilder membantu kamu membuat resume yang menonjol dengan
                teknologi AI — analisis ATS, ringkasan profil, dan cover letter otomatis.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-fuchsia-500/30"
                  asChild
                >
                  <Link href="/register">
                    Mulai Gratis
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Masuk</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* ── Features ─────────────────────────────────────────────────── */}
          <section className="border-y border-border/60 bg-secondary/30 py-20 sm:py-24">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="mb-3 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
                Semua yang kamu butuhkan
              </h2>
              <p className="mx-auto mb-12 max-w-md text-center text-sm text-muted-foreground">
                Tiga fitur AI yang bekerja bersama membuat lamaranmu tidak terbantahkan.
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {features.map((f) => (
                  <Card
                    key={f.title}
                    className="group relative overflow-hidden text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Hover accent line */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <CardHeader>
                      <div
                        className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.tileClass}`}
                      >
                        <f.icon className="h-7 w-7" aria-hidden="true" />
                      </div>
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
          <section className="py-20 sm:py-24">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
                Pilih plan kamu
              </h2>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
                {plans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={
                      plan.highlight
                        ? 'relative border-transparent bg-gradient-to-b from-violet-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-fuchsia-500/20'
                        : ''
                    }
                  >
                    {plan.highlight ? (
                      /* Gradient-ring card: inner surface sits on a gradient wrapper */
                      <div className="flex h-full flex-col rounded-[calc(var(--radius)-1.5px)] bg-card">
                        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-0.5 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/30">
                          <Zap className="h-3 w-3" aria-hidden="true" />
                          Paling Populer
                        </span>
                        <PlanBody plan={plan} />
                      </div>
                    ) : (
                      <PlanBody plan={plan} />
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* ── Final CTA ────────────────────────────────────────────────── */}
          <section className="px-4 pb-24">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-secondary/40 p-10 text-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-violet-500/10 via-fuchsia-500/10 to-sky-500/10"
              />
              <div className="relative space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Siap mendapatkan pekerjaan impianmu?
                </h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Bergabung sekarang dan buat resume profesional pertamamu dalam hitungan menit.
                </p>
                <Button
                  size="lg"
                  className="mt-2 gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-fuchsia-500/30"
                  asChild
                >
                  <Link href="/register">
                    Mulai Gratis Sekarang
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

        </main>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="border-t border-border/60 py-8">
          <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-2">
              <LogoMark />
              <span className="font-medium text-foreground">AlresumeBuilder</span>
            </div>
            <p>© 2025 AlresumeBuilder. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  );
}

// ─── Plan card body (shared between Gratis & Pro) ─────────────────────────────

function PlanBody({
  plan,
}: {
  plan: (typeof plans)[number];
}) {
  return (
    <>
      <CardHeader className="pt-6">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold">{plan.price}</span>
          {plan.period && (
            <span className="text-sm text-muted-foreground">{plan.period}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <span
                className={
                  plan.highlight
                    ? 'flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary/10 text-primary'
                }
              >
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={plan.variant}
          className={
            plan.highlight
              ? 'w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25 hover:opacity-90'
              : 'w-full'
          }
          asChild
        >
          <Link href={plan.href}>{plan.cta}</Link>
        </Button>
      </CardFooter>
    </>
  );
}
