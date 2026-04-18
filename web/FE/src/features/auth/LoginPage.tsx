import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { isAuthenticated, setAuthenticated } from '../../lib/auth';

const footerLinks = ['Privacy Policy', 'Terms of Service', 'Security Standards', 'Platform Status'];

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/templates', { replace: true });
    }
  }, [navigate]);

  const handleLogin = () => {
    setAuthenticated(true);
    navigate('/templates');
  };

  return (
    <div className="login-screen">
      <div className="login-code-bg" aria-hidden="true">
        <div className="login-code-bg__block">
          {[
            '01  import { ReflowEngine } from "@git-reflow/core";',
            '02  const config = await ReflowEngine.syncTemplates();',
            '03  export default function Deploy() {',
            '04      return config.deploy({',
            '05          strategy: "precision-canvas",',
            '06          analytics: true',
            '07      });',
            '08  }',
            '12  // Optimizing git workflow...',
            '13  const extension = Reflow.getExtension("vscode-reflow");',
            '14  extension.sync();',
          ].map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>

      <main className="login-layout">
        <section className="login-panel">
          <div className="login-brand">
            <div className="login-brand__mark">
              <Icon name="alt_route" />
            </div>
            <span>git-reflow</span>
          </div>

          <div className="login-copy">
            <h1>
              Continue your
              <br />
              Precision Journey.
            </h1>
            <p>Experience the ultimate git refactoring environment.</p>
          </div>

          <div className="login-card">
            <button className="login-google" type="button" onClick={handleLogin}>
              <span className="google-mark">G</span>
              <span>Continue with Google</span>
            </button>

            <div className="login-divider">
              <span>Secure Access</span>
            </div>

            <label className="login-field">
              <span>Work Email</span>
              <input placeholder="name@company.com" type="email" />
            </label>

            <button className="login-email" type="button" onClick={handleLogin}>
              Sign in with Email
            </button>

            <div className="login-trust">
              <div>
                <div className="login-trust__title login-trust__title--blue">
                  <Icon name="terminal" />
                  <span>Templates</span>
                </div>
                <p>Sync your refactoring templates across teams instantly.</p>
              </div>
              <div>
                <div className="login-trust__title login-trust__title--purple">
                  <Icon name="sync_alt" />
                  <span>Extension Sync</span>
                </div>
                <p>Your VS Code configurations follow you everywhere.</p>
              </div>
            </div>
          </div>

          <nav className="login-links" aria-label="Login footer links">
            {footerLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}>
                {link}
              </a>
            ))}
          </nav>
        </section>

        <section className="login-visual" aria-hidden="true">
          <div className="login-visual__rings">
            <div />
            <div />
            <div />
          </div>
          <div className="login-visual__card">
            <div className="login-visual__bar">
              <span />
              <span />
              <span />
            </div>
            <div className="login-visual__content">
              <div className="login-visual__line is-long" />
              <div className="login-visual__line is-medium" />
              <div className="login-visual__tiles">
                <div />
                <div />
                <div />
              </div>
              <div className="login-visual__line is-long" />
              <div className="login-visual__line is-short" />
            </div>
            <div className="login-visual__badge">
              <div className="login-visual__person">
                <Icon name="person" />
              </div>
              <div className="login-visual__sync">SYNC ACTIVE</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <div>© 2024 Precision Git Reflow Platform. All rights reserved.</div>
        <div className="login-footer__status">
          <span>INFRASTRUCTURE STATUS: OPTIMAL</span>
          <span className="login-footer__dot" />
        </div>
      </footer>
    </div>
  );
}
