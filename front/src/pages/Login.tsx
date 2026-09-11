import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert, message, Tag, Modal, Select, Segmented } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  GoogleOutlined,
  CompassOutlined,
  GlobalOutlined,
  KeyOutlined,
  CheckCircleFilled,
  RocketOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { googleLogin } from '../services/auth.api';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types/auth';
import type { AxiosError } from 'axios';

declare global {
  interface Window {
    google?: any;
  }
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setAuth, selectedRole, setSelectedRole } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [customToken, setCustomToken] = useState<string>('');
  const [showDevModal, setShowDevModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<string>(
    () => localStorage.getItem('tripuz_lang') || i18n.language || 'uz'
  );

  // Keep track of latest selectedRole in a ref to avoid re-initializing Google GIS on role change
  const selectedRoleRef = useRef(selectedRole);
  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  // Track if Google Identity Services has already been initialized
  const isGisInitialized = useRef(false);

  // Set page title
  useEffect(() => {
    document.title = t('meta.login_title');
  }, [t]);

  // Initialize Google Identity Services (GIS) ONLY ONCE on mount
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('dummy')) return;

    const initGis = () => {
      if (window.google?.accounts?.id && !isGisInitialized.current) {
        try {
          isGisInitialized.current = true;
          window.google.accounts.id.initialize({
            client_id: clientId,
            auto_select: false,
            callback: async (response: any) => {
              if (response && response.credential) {
                await handleGoogleAuth(response.credential, selectedRoleRef.current);
              } else {
                setLoading(false);
              }
            },
          });
        } catch (err) {
          console.error('Failed to initialize Google Identity Services:', err);
          isGisInitialized.current = false;
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGis();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, []);

  /**
   * Change application language preference — also triggers i18n.changeLanguage
   */
  const handleLanguageChange = (val: string) => {
    setCurrentLang(val);
    localStorage.setItem('tripuz_lang', val);
    i18n.changeLanguage(val); // ← FIX: was missing in original
    const langLabels: Record<string, string> = {
      uz: "O'zbekcha (UZ)",
      ru: "Русский (RU)",
      en: "English (EN)",
    };
    message.info(`${t('common.language')}: ${langLabels[val] || val}`);
  };


  /**
   * Main login execution handler
   */
  const handleGoogleAuth = async (idToken: string, targetRole: UserRole = selectedRole) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await googleLogin(idToken, targetRole);
  

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, tokens } = response.data;
        const effectiveAccessToken = accessToken || tokens?.accessToken || '';
        const effectiveRefreshToken = refreshToken || tokens?.refreshToken || '';

        // Ensure user role matches or is saved correctly
        const effectiveUser = {
          ...user,
          role: user.role || targetRole,
        };

        // Save auth state to Zustand & LocalStorage
        setAuth(effectiveUser, {
          accessToken: effectiveAccessToken,
          refreshToken: effectiveRefreshToken,
        });

        message.success({
          content: t('auth.welcome_msg', { name: effectiveUser.name }),
          duration: 2.5,
        });

        // Redirect based on active role
        const redirectPath =
          targetRole === 'GUIDE' || effectiveUser.role === 'GUIDE' || effectiveUser.role === 'ADMIN'
            ? '/guide/dashboard'
            : '/home';

        setTimeout(() => {
          navigate(redirectPath);
        }, 800);
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
   * Native Google Identity Services (GIS) Sign-In Trigger with prompt
   */
  const handleRealGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId || clientId.includes('dummy')) {
      const msg = t('auth.google_not_configured');
      setErrorMessage(msg);
      message.error(t('auth.login_failed'));
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      message.error(t('auth.google_sdk_loading'));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Fallback: initialize if not already initialized
    if (!isGisInitialized.current) {
      try {
        isGisInitialized.current = true;
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: async (response: any) => {
            if (response && response.credential) {
              await handleGoogleAuth(response.credential, selectedRoleRef.current);
            } else {
              setLoading(false);
            }
          },
        });
      } catch (err) {
        console.error('Google GIS Init error:', err);
        isGisInitialized.current = false;
      }
    }

    try {
      window.google.accounts.id.prompt((notification: any) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Google GIS Error:', err);
      setLoading(false);
      message.error(t('auth.google_login_error'));
    }
  };


  /**
   * Custom token login submit
   */
  const handleCustomTokenSubmit = () => {
    if (!customToken.trim()) {
      message.warning(t('common.error_title'));
      return;
    }
    handleGoogleAuth(customToken.trim(), selectedRole);
    setShowDevModal(false);
  };

  const isGuideMode = selectedRole === 'GUIDE';

  const heroFeatures = isGuideMode
    ? [
        t('auth.feature_guide_1'),
        t('auth.feature_guide_2'),
        t('auth.feature_guide_3'),
      ]
    : [
        t('auth.feature_tourist_1'),
        t('auth.feature_tourist_2'),
        t('auth.feature_tourist_3'),
      ];

  return (
    <div className="min-h-screen bg-[#0F1419] flex flex-col justify-between relative overflow-hidden font-sans text-[#F5F5F0] selection:bg-[#C2703D] selection:text-white">
      {/* Ambient Orbs */}
      <div
        className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isGuideMode ? 'bg-amber-600/15' : 'bg-[#C2703D]/20'
        }`}
      />
      <div
        className={`absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isGuideMode ? 'bg-[#0EA5E9]/15' : 'bg-amber-600/15'
        }`}
      />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#C2703D]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
              isGuideMode
                ? 'bg-gradient-to-tr from-[#C2703D] to-amber-500 shadow-amber-900/30'
                : 'bg-gradient-to-tr from-[#C2703D] to-amber-600 shadow-amber-950/40'
            }`}
          >
            <CompassOutlined className="text-2xl text-white group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <div>
            <span className="text-2xl font-black font-serif tracking-wide text-white">
              TRIPUZ
            </span>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-3">
          <Select
            value={currentLang}
            onChange={handleLanguageChange}
            variant="borderless"
            popupClassName="dark-select-dropdown"
            className="custom-lang-select bg-[#161F28] border border-slate-800 text-slate-200 rounded-xl text-xs backdrop-blur-md px-2 py-0.5 shadow-sm hover:border-[#C2703D]/50 transition-all cursor-pointer"
            suffixIcon={<GlobalOutlined className="text-[#C2703D]" />}
            options={[
              { value: 'uz', label: <span className="flex items-center gap-1.5 text-xs">🇺🇿 UZ</span> },
              { value: 'ru', label: <span className="flex items-center gap-1.5 text-xs">🇷🇺 RU</span> },
              { value: 'en', label: <span className="flex items-center gap-1.5 text-xs">🇬🇧 EN</span> },
            ]}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Branding Section */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block pr-4">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
                isGuideMode
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-[#C2703D]/10 border-[#C2703D]/20 text-amber-200'
              }`}
            >
              {isGuideMode ? (
                <SafetyCertificateOutlined className="text-amber-400 text-sm" />
              ) : (
                <FireOutlined className="text-[#C2703D] text-sm" />
              )}
              <span>{isGuideMode ? t('auth.guide_experts_portal') : t('auth.boutique_travel')}</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-serif font-extrabold leading-[1.15] text-[#F5F5F0]">
              {isGuideMode ? (
                <>
                  {t('auth.hero_guide_title_1')} <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#C2703D]">
                    {t('auth.hero_guide_title_2')}
                  </span>
                </>
              ) : (
                <>
                  {t('auth.hero_tourist_title_1')} <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#C2703D]">
                    {t('auth.hero_tourist_title_2')}
                  </span>
                </>
              )}
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-md">
              {isGuideMode ? t('auth.hero_guide_subtitle') : t('auth.hero_tourist_subtitle')}
            </p>

            {/* Feature Checkmarks */}
            <div className="space-y-3 pt-1">
              {heroFeatures.map((text, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircleFilled className="text-[#C2703D] text-base flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — Auth Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <Card
              className="bg-[#161F28]/90 border border-slate-800 backdrop-blur-2xl shadow-2xl shadow-black/80 rounded-3xl p-3 sm:p-5 text-[#F5F5F0] overflow-hidden"
              bordered={false}
            >
              {/* Header Title */}
              <div className="text-center space-y-1 mb-6">
                <div
                  className={`inline-flex p-3.5 rounded-2xl border mb-2 transition-all duration-500 ${
                    isGuideMode
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-[#C2703D]/10 border-[#C2703D]/20 text-[#C2703D]'
                  }`}
                >
                  {isGuideMode ? <RocketOutlined className="text-2xl" /> : <UserOutlined className="text-2xl" />}
                </div>
                <h2 className="text-2xl xl:text-3xl font-serif font-bold text-white tracking-wide">{t('auth.login_title')}</h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  {t('auth.login_subtitle')}
                </p>
              </div>

              {/* ROLE SELECTION CONTROL */}
              <div className="mb-6 bg-[#0F1419] p-1.5 rounded-2xl border border-slate-800/90 shadow-inner">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5 px-2 flex items-center justify-between">
                  <span>{t('auth.select_role')}</span>
                  <Tag color="gold" className="m-0 text-[10px] border-none bg-amber-500/15 text-amber-300 font-bold">
                    {isGuideMode ? t('auth.guide_portal') : t('auth.tourist_portal')}
                  </Tag>
                </div>
                <Segmented
                  block
                  value={selectedRole}
                  onChange={(val) => setSelectedRole(val as UserRole)}
                  className="bg-[#161F28] border border-slate-800 text-slate-300 rounded-xl font-medium p-1 select-none"
                  options={[
                    {
                      label: (
                        <div className="flex items-center justify-center gap-2 py-1.5 text-xs">
                          <UserOutlined className={!isGuideMode ? 'text-[#C2703D] font-bold' : ''} />
                          <span>{t('auth.tourist_role')}</span>
                        </div>
                      ),
                      value: 'TOURIST',
                    },
                    {
                      label: (
                        <div className="flex items-center justify-center gap-2 py-1.5 text-xs">
                          <RocketOutlined className={isGuideMode ? 'text-amber-400 font-bold' : ''} />
                          <span>{t('auth.guide_role')}</span>
                        </div>
                      ),
                      value: 'GUIDE',
                    },
                  ]}
                />
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

              {/* Main Auth Actions */}
              <div className="space-y-4">
                {/* Primary Google Login Button */}
                <Button
                  type="primary"
                  size="large"
                  icon={<GoogleOutlined className="text-lg text-red-500" />}
                  loading={loading}
                  onClick={handleRealGoogleLogin}
                  className="w-full h-12 rounded-xl bg-[#F5F5F0] hover:bg-white text-slate-900 font-bold border-none shadow-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                >
                  {loading
                    ? t('auth.logging_in')
                    : t('auth.google_login_btn', { role: isGuideMode ? t('auth.guide_label') : t('auth.tourist_label') })}
                </Button>

                <div className="text-center text-[11px] text-slate-500 px-2 leading-relaxed">
                  {t('auth.terms_agree')}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-slate-500 text-xs z-10 border-t border-slate-900/60">
        {t('auth.terms_footer', { year: new Date().getFullYear() })}
      </footer>

      {/* Custom Token Modal */}
      <Modal
        title={
          <span className="text-slate-100 flex items-center gap-2">
            <KeyOutlined className="text-amber-400" /> {t('auth.dev_mode_label')} ({selectedRole})
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
          body: { background: '#0f1419', borderColor: '#1e293b' },
          header: { background: '#0f1419' },
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
            className="bg-[#161F28] border-slate-800 text-slate-200 text-xs font-mono rounded-lg focus:border-[#C2703D]"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Login;
