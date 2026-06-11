import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Building2,
  Users,
  Trophy,
  ShieldCheck,
  Sparkles,
  Star,
  Quote,
  Home,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useCountUp } from "../hooks/useCountUp";
import { useReveal } from "../hooks/useReveal";
import { getAchievementsPageContent } from "../lib/api-client";
import {
  ACHIEVEMENTS_PAGE_FALLBACKS,
  type AchievementsCard,
  type AchievementsPressItem,
  type AchievementsStat,
} from "../lib/achievements-page-content";

const ICON_MAP: Record<string, LucideIcon> = {
  residential: Home,
  home: Home,
  commercial: Building2,
  building: Building2,
  investment: Trophy,
  trophy: Trophy,
  management: Users,
  users: Users,
  legacy: Sparkles,
  sparkles: Sparkles,
  quality: ShieldCheck,
  shield: ShieldCheck,
  vision: Award,
  award: Award,
};

function resolveIcon(slug: string, fallback: LucideIcon): LucideIcon {
  return ICON_MAP[slug.toLowerCase()] || fallback;
}

const Stat = ({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) => {
  const ref = useCountUp(value);
  return (
    <div className="reveal text-center">
      <div
        className="text-5xl font-bold text-primary md:text-6xl"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}
      >
        <span ref={ref}>0</span>
        <span
          className="relative -top-2 ml-0.5 text-3xl font-medium md:-top-3 md:text-4xl"
          style={{ color: "hsl(var(--accent))" }}
        >
          {suffix}
        </span>
      </div>
      <div className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
};

function localizeCard(card: AchievementsCard, isAr: boolean) {
  return {
    icon: card.icon,
    title: isAr ? card.title.ar : card.title.en,
    desc: isAr ? card.description.ar : card.description.en,
  };
}

function localizePress(item: AchievementsPressItem, isAr: boolean) {
  return {
    quote: isAr ? item.quote.ar : item.quote.en,
    source: isAr ? item.source.ar : item.source.en,
  };
}

function localizeStat(stat: AchievementsStat, isAr: boolean) {
  return {
    value: stat.value,
    suffix: stat.suffix,
    label: isAr ? stat.label.ar : stat.label.en,
  };
}

const Achievements = () => {
  const { lang } = useLanguage();
  const ref = useReveal();
  const isAr = lang.startsWith("ar");
  const [content, setContent] = useState(ACHIEVEMENTS_PAGE_FALLBACKS);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const data = await getAchievementsPageContent();
        if (active) setContent(data);
      } catch {
        if (active) setContent(ACHIEVEMENTS_PAGE_FALLBACKS);
      }
    };

    void loadContent();
    return () => {
      active = false;
    };
  }, [lang]);

  const hero = useMemo(
    () => ({
      badge: isAr ? content.hero.badge.ar : content.hero.badge.en,
      title: isAr ? content.hero.title.ar : content.hero.title.en,
      subtitle: isAr ? content.hero.subtitle.ar : content.hero.subtitle.en,
    }),
    [content.hero, isAr]
  );

  const stats = useMemo(
    () => content.stats.map((stat) => localizeStat(stat, isAr)),
    [content.stats, isAr]
  );

  const snapshotCards = useMemo(
    () => content.snapshot.cards.map((card) => localizeCard(card, isAr)),
    [content.snapshot.cards, isAr]
  );

  const highlights = useMemo(
    () => content.snapshot.highlights.map((card) => localizeCard(card, isAr)),
    [content.snapshot.highlights, isAr]
  );

  const awards = useMemo(
    () => content.awards.items.map((card) => localizeCard(card, isAr)),
    [content.awards.items, isAr]
  );

  const press = useMemo(
    () => content.press.items.map((item) => localizePress(item, isAr)),
    [content.press.items, isAr]
  );

  const snapshotCardIcons = useMemo(
    () => [Home, Building2, Trophy, Users],
    []
  );

  const highlightIcons = useMemo(
    () => [Sparkles, ShieldCheck, Award],
    []
  );

  const awardIcons = useMemo(
    () => [Trophy, ShieldCheck, Award, Sparkles, Building2, Users],
    []
  );

  return (
    <div ref={ref}>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-navy py-24 text-white">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="container-fbs relative text-center">
          <span className="reveal inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
            {hero.badge}
          </span>
          <h1 className="reveal reveal-delay-1 mt-5 font-display text-5xl font-bold text-white md:text-6xl">
            {hero.title}
          </h1>
          <p className="reveal reveal-delay-2 mx-auto mt-4 max-w-2xl text-lg text-white/80">{hero.subtitle}</p>
        </div>
      </section>

      {/* COUNTERS */}
      <section className="container-fbs -mt-12 pb-16">
        <div className="rounded-2xl bg-white p-12 shadow-[0_20px_50px_-20px_rgba(2,6,23,0.25)] ring-1 ring-black/5 md:p-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats[0] && <Stat value={stats[0].value} suffix={stats[0].suffix} label={stats[0].label} />}
            <div className="hidden md:block" style={{ width: 0 }} />
            {stats[1] && <Stat value={stats[1].value} suffix={stats[1].suffix} label={stats[1].label} />}
            {stats[2] && <Stat value={stats[2].value} suffix={stats[2].suffix} label={stats[2].label} />}
            {stats[3] && <Stat value={stats[3].value} suffix={stats[3].suffix} label={stats[3].label} />}
          </div>
        </div>
      </section>

      {/* COMPANY SNAPSHOT */}
      <section className="container-fbs py-20">
        <div className="text-center">
          <span className="reveal eyebrow">{isAr ? content.snapshot.kicker.ar : content.snapshot.kicker.en}</span>
          <h2 className="reveal reveal-delay-1 mt-4 font-display text-4xl font-bold md:text-5xl">
            {isAr ? content.snapshot.title.ar : content.snapshot.title.en}
          </h2>
          <p className="reveal reveal-delay-2 mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {isAr ? content.snapshot.subtitle.ar : content.snapshot.subtitle.en}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {snapshotCards.map((c, i) => {
            const Icon = resolveIcon(content.snapshot.cards[i]?.icon || c.icon, snapshotCardIcons[i] || Home);
            return (
              <div
                key={content.snapshot.cards[i]?.id || i}
                className={`reveal reveal-delay-${(i % 4) + 1} group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:border-accent hover:shadow-elegant`}
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/5 transition-all duration-700 group-hover:scale-150 group-hover:bg-accent/10" />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-500 group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {highlights.map((h, i) => {
            const Icon = resolveIcon(content.snapshot.highlights[i]?.icon || h.icon, highlightIcons[i] || Sparkles);
            return (
              <div
                key={content.snapshot.highlights[i]?.id || i}
                className={`reveal reveal-delay-${i + 1} rounded-2xl border bg-card p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">{h.title}</div>
                    <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AWARDS */}
      <section className="bg-secondary/40 py-20">
        <div className="container-fbs">
          <div className="text-center">
            <span className="reveal eyebrow">{isAr ? content.awards.kicker.ar : content.awards.kicker.en}</span>
            <h2 className="reveal reveal-delay-1 mt-4 font-display text-4xl font-bold md:text-5xl">
              {isAr ? content.awards.title.ar : content.awards.title.en}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {awards.map((a, i) => {
              const Icon = resolveIcon(content.awards.items[i]?.icon || a.icon, awardIcons[i] || Trophy);
              return (
                <div
                  key={content.awards.items[i]?.id || i}
                  className={`reveal reveal-delay-${(i % 4) + 1} group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:border-accent hover:shadow-elegant`}
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/5 transition-all duration-700 group-hover:scale-150 group-hover:bg-accent/10" />
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-500 group-hover:bg-accent group-hover:text-accent-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold">{a.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRESS */}
      <section className="container-fbs py-20">
        <h2 className="reveal text-center font-display text-3xl font-bold md:text-4xl">
          {isAr ? content.press.title.ar : content.press.title.en}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {press.map((p, i) => (
            <div
              key={content.press.items[i]?.id || i}
              className={`reveal reveal-delay-${i + 1} relative rounded-2xl border bg-card p-8 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant`}
            >
              <Quote className="h-8 w-8 text-accent/40" />
              <p className="mt-4 text-base leading-relaxed">{p.quote}</p>
              <div className="mt-6 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <div className="mt-3 text-sm font-semibold text-muted-foreground">— {p.source}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Achievements;
