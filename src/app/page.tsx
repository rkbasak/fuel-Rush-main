'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  const handleGetStarted = () => router.push('/auth/register');
  const handleOpenMap = () => router.push('/main/map');

  if (isLoggedIn === null) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.fuelDrop}>⛽</div>
      </div>
    );
  }

  if (isLoggedIn) {
    router.replace('/main/map');
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>⛽ Fuel Rush</div>
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={handleOpenMap}>Open Map</button>
          <button style={styles.navBtnPrimary} onClick={handleGetStarted}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>🇧🇩 Built for Bangladesh</div>
        <h1 style={styles.heroTitle}>
          Bangladesh&apos;s Fuel Crisis,<br />
          <span style={styles.heroHighlight}>Solved.</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Real-time fuel station intelligence. Know where fuel is available<br />
          before you drive there. Community-powered, AI-verified.
        </p>
        <div style={styles.heroCtas}>
          <button style={styles.ctaPrimary} onClick={handleGetStarted}>
            Get Started Free →
          </button>
          <button style={styles.ctaSecondary} onClick={handleOpenMap}>
            See Live Map
          </button>
        </div>
        <div style={styles.heroStats}>
          <div style={styles.heroStat}><span style={styles.heroStatNum}>30+</span><span style={styles.heroStatLabel}>Stations</span></div>
          <div style={styles.heroStatDivider} />
          <div style={styles.heroStat}><span style={styles.heroStatNum}>2min</span><span style={styles.heroStatLabel}>Response</span></div>
          <div style={styles.heroStatDivider} />
          <div style={styles.heroStat}><span style={styles.heroStatNum}>100%</span><span style={styles.heroStatLabel}>Free</span></div>
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepNum}>1</div>
            <h3 style={styles.stepTitle}>Report</h3>
            <p style={styles.stepDesc}>See a fuel station? Open the app and report its status in under 30 seconds.</p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepNum}>2</div>
            <h3 style={styles.stepTitle}>Verify</h3>
            <p style={styles.stepDesc}>The community confirms or disputes within 2 minutes. AI scores confidence.</p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepNum}>3</div>
            <h3 style={styles.stepTitle}>Save</h3>
            <p style={styles.stepDesc}>Avoid false queues, save time and fuel. AI optimizes your route automatically.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={styles.sectionDark}>
        <h2 style={styles.sectionTitle}>Everything You Need</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🗺️</div>
            <h3 style={styles.featureTitle}>Live Fuel Map</h3>
            <p style={styles.featureDesc}>Real-time station status across Dhaka. Green means available, red means empty.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🤖</div>
            <h3 style={styles.featureTitle}>AI Confidence</h3>
            <p style={styles.featureDesc}>Gemini-powered accuracy scoring. Reports decay after 2 minutes without confirmation.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📊</div>
            <h3 style={styles.featureTitle}>Ration Tracker</h3>
            <p style={styles.featureDesc}>Your daily fuel allowance tracked automatically. Motorcycle: 2L, Sedan: 10L, SUV: 20L.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🧭</div>
            <h3 style={styles.featureTitle}>Smart Routes</h3>
            <p style={styles.featureDesc}>AI-optimized multi-stop route planning. Avoids already-visited stations.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔔</div>
            <h3 style={styles.featureTitle}>Instant Alerts</h3>
            <p style={styles.featureDesc}>Push notifications when fuel arrives near you. No more waiting in line.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📱</div>
            <h3 style={styles.featureTitle}>Works Offline</h3>
            <p style={styles.featureDesc}>PWA works even with poor connectivity. Add to home screen, use anywhere.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaSectionTitle}>Stop Waiting. Start Saving.</h2>
        <p style={styles.ctaSectionSub}>Join thousands of Bangladesh drivers who never wait in fuel queues again.</p>
        <button style={styles.ctaPrimaryLg} onClick={handleGetStarted}>
          Get Started — It&apos;s Free →
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>⛽ Fuel Rush</div>
        <p style={styles.footerTagline}>Built with ❤️ for Bangladesh 🇧🇩</p>
        <p style={styles.footerCopy}>© 2026 Fuel Rush. Open source.</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#0D0D0D', color: '#fff', fontFamily: "'Inter', sans-serif" },
  loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0D0D' },
  fuelDrop: { fontSize: '48px', animation: 'pulse 2s infinite' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1E1E2E' },
  navLogo: { fontSize: '20px', fontWeight: 700, color: '#FF6B35' },
  navLinks: { display: 'flex', gap: '12px' },
  navBtn: { background: 'transparent', border: '1px solid #333', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  navBtnPrimary: { background: '#FF6B35', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
  hero: { padding: '80px 40px 60px', textAlign: 'center', background: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A2E 100%)' },
  heroBadge: { display: 'inline-block', background: 'rgba(255,107,53,0.15)', color: '#FF6B35', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '24px', border: '1px solid rgba(255,107,53,0.3)' },
  heroTitle: { fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', color: '#fff' },
  heroHighlight: { color: '#FF6B35' },
  heroSubtitle: { fontSize: 'clamp(16px, 2vw, 20px)', color: '#A0A0A0', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 },
  heroCtas: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' },
  ctaPrimary: { background: '#FF6B35', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' },
  ctaSecondary: { background: 'transparent', color: '#fff', border: '1px solid #444', padding: '14px 32px', borderRadius: '12px', fontSize: '16px', cursor: 'pointer' },
  heroStats: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginTop: '40px' },
  heroStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  heroStatNum: { fontSize: '28px', fontWeight: 800, color: '#FF6B35' },
  heroStatLabel: { fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' },
  heroStatDivider: { width: '1px', height: '40px', background: '#333' },
  section: { padding: '80px 40px', backgroundColor: '#0D0D0D' },
  sectionDark: { padding: '80px 40px', backgroundColor: '#1A1A2E' },
  sectionTitle: { fontSize: '36px', fontWeight: 800, textAlign: 'center', marginBottom: '48px', color: '#fff' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' },
  stepCard: { background: '#1E1E2E', border: '1px solid #333', borderRadius: '16px', padding: '32px 24px', textAlign: 'center' },
  stepNum: { width: '48px', height: '48px', background: '#FF6B35', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, margin: '0 auto 16px' },
  stepTitle: { fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#fff' },
  stepDesc: { fontSize: '14px', color: '#888', lineHeight: 1.6 },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' },
  featureCard: { background: '#0D0D0D', border: '1px solid #333', borderRadius: '16px', padding: '28px 24px' },
  featureIcon: { fontSize: '36px', marginBottom: '16px' },
  featureTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#fff' },
  featureDesc: { fontSize: '14px', color: '#888', lineHeight: 1.6 },
  ctaSection: { padding: '80px 40px', textAlign: 'center', background: 'linear-gradient(180deg, #1A1A2E 0%, #0D0D0D 100%)' },
  ctaSectionTitle: { fontSize: '36px', fontWeight: 800, marginBottom: '16px', color: '#fff' },
  ctaSectionSub: { fontSize: '16px', color: '#888', marginBottom: '32px' },
  ctaPrimaryLg: { background: '#FF6B35', color: '#fff', border: 'none', padding: '18px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 700, cursor: 'pointer' },
  footer: { padding: '40px', textAlign: 'center', borderTop: '1px solid #1E1E2E', backgroundColor: '#0D0D0D' },
  footerLogo: { fontSize: '18px', fontWeight: 700, color: '#FF6B35', marginBottom: '8px' },
  footerTagline: { fontSize: '14px', color: '#888', marginBottom: '4px' },
  footerCopy: { fontSize: '12px', color: '#555' },
};
