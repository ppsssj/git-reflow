import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { isAuthenticated } from '../../lib/auth';

const footerLinks = ['Privacy', 'Terms', 'Security', 'Status'];

const featureCards = [
  {
    icon: 'analytics',
    title: 'Velocity Insights',
    description:
      'Visualize code churn and contributor impact with editorial-grade reporting dashboards.',
    tone: 'violet',
  },
  {
    icon: 'verified_user',
    title: 'Enterprise Security',
    description:
      'Role-based access controls and SOC2 compliant auditing baked into the core interface.',
    tone: 'amber',
  },
  {
    icon: 'extension',
    title: 'Infinite Plugins',
    description:
      'Extend the workflow with our developer API. Build your own reflow rules and UI panels.',
    tone: 'slate',
  },
];

export function IntroPage() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [split, setSplit] = useState(50);
  const dashboardTarget = isAuthenticated() ? '/templates' : '/login';

  const updateSplit = (clientX: number) => {
    const slider = sliderRef.current;
    if (!slider) {
      return;
    }

    const rect = slider.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(0, Math.min(100, next));
    setSplit(clamped);
  };

    return (
    <div className="reflow-page">
      <AppTopNav
        active="dashboard"
        searchPlaceholder="Search..."
        actionLabel="Login"
        actionTo="/login"
      />

      <main className="intro-page">
        <section className="intro-hero">
          <div className="intro-hero__copy">
            <div className="intro-pill">
              <Icon name="sync" />
              <span>Cloud Sync Enabled</span>
            </div>
            <h1>
              Design on Web,
              <br />
              <span>Sync to GitHub.</span>
            </h1>
            <p>
              Transform your GitHub interface from our web dashboard. Every visual tweak
              syncs instantly to your browser via the Reflow Chrome Extension for a
              seamless, high-fidelity experience.
            </p>
            <div className="intro-hero__actions">
              <button className="primary-cta" type="button">
                Install Chrome Extension
              </button>
              <Link className="secondary-cta" to={dashboardTarget}>
                <Icon name="open_in_new" />
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="intro-mockups">
            <div className="mockup-card">
              <div className="mockup-card__glow" />
              <div className="mockup-window">
                <div className="mockup-window__bar">
                  <div className="window-pips">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="window-address">app.reflow.io/workspace</div>
                </div>
                <div className="mockup-window__content">
                  <div className="mockup-window__header">
                    <div className="skeleton-line" />
                    <div className="sync-pill">SYNCING</div>
                  </div>
                  <div className="mockup-window__grid">
                    <div className="surface-block surface-block--action" />
                    <div className="surface-block surface-block--accent" />
                  </div>
                </div>
              </div>
              <div className="floating-label left">
                <Icon name="cloud_done" />
                <span>Cloud Dashboard</span>
              </div>
            </div>

            <div className="sync-bridge">
              <div className="sync-bridge__orb">
                <Icon name="sync" />
              </div>
              <div className="sync-bridge__line" />
            </div>

            <div className="mockup-card mockup-card--github">
              <div className="mockup-card__glow" />
              <div className="mockup-window mockup-window--github">
                <div className="mockup-window__bar">
                  <div className="window-pips">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="window-address">github.com/reflow-io</div>
                  <div className="window-chip">
                    <Icon name="bolt" />
                  </div>
                </div>
                <div className="mockup-window__github">
                  <div className="github-strip" />
                  <div className="github-highlight">
                    <div className="github-highlight__icon">
                      <Icon name="architecture" />
                    </div>
                    <div className="github-highlight__lines">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
              <div className="floating-label right">
                <Icon name="extension" />
                <span>Chrome Extension Active</span>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-features">
          <div className="intro-section-heading">
            <h2>Built for High-Velocity Teams</h2>
            <p>No fluff. Just the precision tools you need to ship faster.</p>
          </div>

          <div className="intro-feature-grid">
            <article className="comparison-card">
              <div className="comparison-card__copy">
                <div className="feature-icon feature-icon--blue">
                  <Icon name="swap_horiz" />
                </div>
                <h3>The Precision Reflow</h3>
                <p>
                  Experience the transformation from standard Git noise to high-fidelity
                  clarity. Compare the original experience with the Reflowed interface.
                </p>
              </div>

              <div
                ref={sliderRef}
                className="comparison-slider"
                onMouseDown={(event) => updateSplit(event.clientX)}
                onMouseMove={(event) => {
                  if ((event.buttons & 1) === 1) {
                    updateSplit(event.clientX);
                  }
                }}
                onTouchMove={(event) => updateSplit(event.touches[0].clientX)}
              >
                <div className="comparison-panel comparison-panel--original">
                  <div className="comparison-tag">Original GitHub</div>
                  <div className="comparison-panel__chrome">
                    <div className="comparison-bar">
                      <div className="comparison-avatar" />
                      <div className="comparison-line is-wide" />
                      <div className="comparison-buttons">
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className="comparison-layout">
                      <div className="comparison-sidebar">
                        <div className="comparison-box" />
                        <div className="comparison-box comparison-box--tall" />
                      </div>
                      <div className="comparison-main">
                        <div className="comparison-box comparison-box--hero" />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="comparison-panel comparison-panel--reflowed"
                  style={{ clipPath: `inset(0 0 0 ${split}%)` }}
                >
                  <div className="comparison-tag comparison-tag--blue">Reflowed</div>
                  <div className="comparison-panel__clean">
                    <div className="clean-top">
                      <div className="clean-pill" />
                      <div className="clean-pill clean-pill--strong" />
                    </div>
                    <div className="clean-grid">
                      <div className="clean-card" />
                      <div className="clean-card clean-card--featured" />
                      <div className="clean-card clean-card--wide" />
                    </div>
                  </div>
                </div>

                <div className="comparison-handle" style={{ left: `${split}%` }}>
                  <div className="comparison-handle__circle">
                    <Icon name="unfold_more_double" />
                  </div>
                </div>
              </div>
            </article>

            <article className="feature-promo">
              <Icon name="bolt" />
              <h3>Zero-Latency Sync</h3>
              <p>
                Changes made in the dashboard are reflected on GitHub instantly via our
                real-time relay engine.
              </p>
              <button type="button">
                Learn More
                <Icon name="arrow_forward" />
              </button>
            </article>

            {featureCards.map((card) => (
              <article key={card.title} className="feature-tile">
                <div className={`feature-icon feature-icon--${card.tone}`}>
                  <Icon name={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="intro-cta">
          <div className="intro-cta__blur intro-cta__blur--right" />
          <div className="intro-cta__blur intro-cta__blur--left" />
          <div className="intro-cta__content">
            <h2>Ready to fix your flow?</h2>
            <p>
              Join 15,000+ developers who have reclaimed their productivity with the
              Precision Git Reflow Platform.
            </p>
            <div className="intro-cta__actions">
              <button className="primary-cta" type="button">
                Create Your Workspace
              </button>
              <button className="plain-link" type="button">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <div>
          <span>REFLOW.IO</span>
          <p>© 2024 Precision Git Reflow Platform. All rights reserved.</p>
        </div>
        <nav aria-label="Footer">
          {footerLinks.map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`}>
              {link}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
