import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { apiPost } from '../../lib/api';
import { isAuthenticated, setAuthSession, type AuthSession } from '../../lib/auth';

const footerLinks = ['Privacy Policy', 'Terms of Service', 'Security Standards', 'Platform Status'];
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

interface GoogleAuthResponse {
  ok: true;
  session: AuthSession;
}

export function LoginPage() {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [loginStatus, setLoginStatus] = useState(
    GOOGLE_CLIENT_ID ? 'Waiting for Google sign-in' : 'Google client id is not configured',
  );

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/templates', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;

    const initializeGoogleSignIn = () => {
      if (cancelled || !window.google || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setLoginStatus('Verifying Google account...');

          try {
            const result = await apiPost<GoogleAuthResponse>('/api/auth/google', {
              credential: response.credential,
            });

            setAuthSession(result.session);
            navigate('/templates');
          } catch (error) {
            setLoginStatus(error instanceof Error ? error.message : 'Google sign-in failed');
          }
        },
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
      });
      setLoginStatus('Use your Google account to continue');
    };

    if (window.google) {
      initializeGoogleSignIn();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    script.onerror = () => setLoginStatus('Failed to load Google Identity Services');
    document.head.append(script);

    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
            <div className="login-google-native" ref={googleButtonRef} />
            <p className="login-auth-status">{loginStatus}</p>

            <div className="login-divider">
              <span>Secure Access</span>
            </div>

            <label className="login-field">
              <span>Work Email</span>
              <input disabled placeholder="Google sign-in required" type="email" />
            </label>

            <button className="login-email" disabled type="button">
              Email sign-in unavailable
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
