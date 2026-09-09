import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Divider, Alert, message, Tag, Modal, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { GoogleOutlined, SafetyCertificateOutlined, CompassOutlined, GlobalOutlined, KeyOutlined, CheckCircleFilled, RocketOutlined } from '@ant-design/icons';
import { googleLogin } from '../services/auth.api';
import { useAuthStore } from '../store/useAuthStore';
import type { AxiosError } from 'axios';

export const GuideLogin: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loading, setLoading] = useState<boolean>(false);
  const [customToken, setCustomToken] = useState<string>('');
  const [showDevModal, setShowDevModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<string>(
    () => localStorage.getItem('tripuz_lang') || i18n.language || 'uz'
  );

  // Set page title
  useEffect(() => {
    document.title = t('meta.guide_title');
  }, [t]);

  const handleLanguageChange = (val: string) => {
    setCurrentLang(val);
    localStorage.setItem('tripuz_lang', val);
    i18n.changeLanguage(val); // ← critical: actually switches the language
    const langLabels: Record<string, string> = {
      uz: "O'zbekcha (UZ)",
      ru: "Русский (RU)",
      en: "English (EN)",
    };
    message.info(`${t('common.language')}: ${langLabels[val] || val}`);
  };

  /**
   * Helper function to build a valid base64 JSON mock Google token for dev testing.
   */
  const generateDevMockToken = (email: string = 'guide@tripuz.uz', name: string = 'Samarqand Gidi - Jasur'): string => {
    const sub = email === 'guide@tripuz.uz'
      ? 'google-mock-guide-123'
      : `google-mock-guide-${email.replace(/[^a-zA-Z0-9]/g, '')}`;

    const mockPayload = {
      sub,
      email,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=128`,
      email_verified: true,
    };
    return btoa(JSON.stringify(mockPayload));
  };

  /**
   * Main login execution handler
   */
  const handleGoogleAuth = async (idToken: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await googleLogin(idToken);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, tokens } = response.data;
        const effectiveAccessToken = accessToken || tokens?.accessToken || '';
        const effectiveRefreshToken = refreshToken || tokens?.refreshToken || '';

        // Save auth data to Zustand & LocalStorage
        setAuth(user, {
          accessToken: effectiveAccessToken,
          refreshToken: effectiveRefreshToken,
        });

        message.success({
          content: t('auth.welcome_msg', { name: user.name }),
          duration: 3,
        });

        // Navigate to Guide Dashboard
        setTimeout(() => {
          navigate('/guide/dashboard');
        }, 1000);
      } else {
        throw new Error(response.message || t('auth.login_failed'));
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const msg = error.response?.data?.message || (err as Error).message || t('common.connection_error');
      setErrorMessage(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick Login for Dev/MVP testing
   */
  const handleQuickDevLogin = (email?: string, name?: string) => {
    const devToken = generateDevMockToken(email, name);
    handleGoogleAuth(devToken);
  };

  /**
   * Custom token login submit
   */
  const handleCustomTokenSubmit = () => {
    if (!customToken.trim()) {
      message.warning(t('common.error_title'));
      return;
    }
    handleGoogleAuth(customToken.trim());
    setShowDevModal(false);
  };

  const heroFeatures = [
    t('auth.feature_guide_1'),
    t('auth.feature_guide_2'),
    t('auth.feature_guide_3'),
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <CompassOutlined className="text-2xl text-white animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              TRIPUZ
            </span>
            <Tag color="cyan" className="ml-2 border-none bg-cyan-500/15 text-cyan-300 font-semibold px-2 py-0.5 rounded-full text-xs">
              {t('auth.guide_portal')}
            </Tag>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={currentLang}
            onChange={handleLanguageChange}
            variant="borderless"
            popupClassName="dark-select-dropdown"
            className="custom-lang-select bg-slate-900/80 border border-slate-800 text-slate-300 rounded-lg text-xs backdrop-blur-md"
            suffixIcon={<GlobalOutlined className="text-indigo-400" />}
            options={[
              { value: 'uz', label: <span className="flex items-center gap-1.5 text-xs">🇺🇿 UZ</span> },
              { value: 'ru', label: <span className="flex items-center gap-1.5 text-xs">🇷🇺 RU</span> },
              { value: 'en', label: <span className="flex items-center gap-1.5 text-xs">🇬🇧 EN</span> },
            ]}
          />
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column - Hero Branding & Features (Visible lg+) */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <SafetyCertificateOutlined className="text-indigo-400 text-sm" />
              <span>{t('auth.guide_experts_portal')}</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white">
              {t('auth.hero_guide_title_1')} <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400">
                {t('auth.hero_guide_title_2')}
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-md">
              {t('auth.hero_guide_subtitle')}
            </p>

            {/* Value Proposition Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
                <div className="text-indigo-400 font-bold text-xl">100+</div>
                <div className="text-slate-400 text-xs mt-1">{t('auth.stat_active_guides')}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
                <div className="text-emerald-400 font-bold text-xl">10%</div>
                <div className="text-slate-400 text-xs mt-1">{t('auth.stat_fair_commission')}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
                <div className="text-amber-400 font-bold text-xl">24/7</div>
                <div className="text-slate-400 text-xs mt-1">{t('auth.stat_auto_payment')}</div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {heroFeatures.map((text, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircleFilled className="text-emerald-400 text-base flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Glassmorphism Login Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <Card
              className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl shadow-indigo-950/50 rounded-2xl p-2 sm:p-4 text-slate-100"
              bordered={false}
            >
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
                  <RocketOutlined className="text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{t('guide.title')}</h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  {t('auth.login_subtitle')}
                </p>
              </div>

              {/* Error Alert Display */}
              {errorMessage && (
                <Alert
                  message={t('auth.login_error_title')}
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorMessage(null)}
                  className="mb-5 bg-red-950/40 border-red-800/60 text-red-200 text-xs rounded-xl"
                />
              )}

              {/* Main Google Sign-In Action */}
              <div className="space-y-4">
                <Button
                  type="default"
                  size="large"
                  icon={<GoogleOutlined className="text-lg text-red-500" />}
                  loading={loading}
                  onClick={() => handleQuickDevLogin()}
                  className="w-full h-12 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold border-none shadow-md flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? t('auth.logging_in') : t('auth.google_login_btn', { role: t('auth.guide_label') })}
                </Button>

                <div className="text-center text-xs text-slate-500 px-4">
                  {t('auth.terms_agree')}
                </div>

                <Divider className="border-slate-800 text-slate-500 text-xs my-6">
                  {t('auth.dev_mode_label')}
                </Divider>

                {/* Quick Mock Login Button for Easy Testing */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Tag color="green" className="m-0 text-[10px] uppercase font-bold">MVP Test</Tag>
                      {t('auth.dev_mode_label')}
                    </span>
                    <span className="text-slate-500 text-[11px]">{t('auth.guide_label')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      type="primary"
                      loading={loading}
                      onClick={() => handleQuickDevLogin('guide@tripuz.uz', 'Samarqand Gidi - Jasur')}
                      className="h-10 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none font-semibold shadow-lg text-xs flex items-center justify-center gap-1"
                    >
                      ⚡ Jasur Gid (Samarqand)
                    </Button>
                    <Button
                      type="default"
                      loading={loading}
                      onClick={() => handleQuickDevLogin('anvar.guide@tripuz.uz', 'Buxoro Gidi - Anvar')}
                      className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 font-semibold text-xs flex items-center justify-center gap-1"
                    >
                      ⚡ Anvar Gid (Yangi Akkaunt)
                    </Button>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowDevModal(true)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 ml-auto"
                    >
                      <KeyOutlined /> Token
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-slate-600 text-xs z-10 border-t border-slate-900/60">
        {t('auth.terms_footer', { year: new Date().getFullYear() })}
      </footer>

      {/* Modal for Custom Google ID Token Input */}
      <Modal
        title={
          <span className="text-slate-100 flex items-center gap-2">
            <KeyOutlined className="text-indigo-400" /> {t('auth.dev_mode_label')}
          </span>
        }
        open={showDevModal}
        onCancel={() => setShowDevModal(false)}
        onOk={handleCustomTokenSubmit}
        confirmLoading={loading}
        okText={t('auth.login_title')}
        cancelText={t('common.cancel')}
        className="dark-modal"
        styles={{
          body: { background: '#0f172a', borderColor: '#1e293b' },
          header: { background: '#0f172a' },
        }}
      >
        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-400">
            Backend Dev muhitida ishlayotgan bo'lsangiz, base64 encoded JSON token yoki haqiqiy Google OAuth ID tokenini kiritishingiz mumkin:
          </p>
          <Input.TextArea
            rows={4}
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            placeholder="eyJhbGciOiJSUzI1NiIs..."
            className="bg-slate-950 border-slate-800 text-slate-200 text-xs font-mono rounded-lg focus:border-indigo-500"
          />
        </div>
      </Modal>
    </div>
  );
};

export default GuideLogin;
