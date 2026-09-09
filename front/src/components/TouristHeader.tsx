import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button, Tag, Select, Avatar, Modal, Drawer, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CompassOutlined,
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  BookOutlined,
  DashboardOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';

interface TouristHeaderProps {
  currentLang?: string;
  onLanguageChange?: (lang: string) => void;
}

export const TouristHeader: React.FC<TouristHeaderProps> = ({
  currentLang: externalLang,
  onLanguageChange,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState<boolean>(false);
  const [currentLang, setCurrentLang] = useState<string>(
    () => externalLang || i18n.language || localStorage.getItem('tripuz_lang') || 'uz'
  );

  const handleLangSelect = (val: string) => {
    setCurrentLang(val);
    localStorage.setItem('tripuz_lang', val);
    i18n.changeLanguage(val);
    if (onLanguageChange) {
      onLanguageChange(val);
    } else {
      const langLabels: Record<string, string> = {
        uz: "O'zbekcha",
        ru: "Русский",
        en: "English",
      };
      message.info(`${t('common.language')}: ${langLabels[val] || val}`);
    }
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    setProfileDrawerOpen(false);
    Modal.confirm({
      title: t('nav.logout_confirm_title'),
      content: t('nav.logout_confirm_content'),
      okText: t('nav.logout_ok'),
      okType: 'danger',
      cancelText: t('nav.logout_cancel'),
      centered: true,
      className: 'dark-modal',
      onOk: () => {
        logout();
        message.info(t('nav.logout_success'));
        navigate('/');
      },
    });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#161F28]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Logo & Brand Name */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C2703D] to-amber-500 flex items-center justify-center shadow-lg shadow-amber-950/40 group-hover:scale-105 transition-transform duration-300">
              <CompassOutlined className="text-2xl text-white group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black font-serif tracking-wide text-white">
                TRIPUZ
              </span>
              <Tag color="gold" className="ml-2 border-none bg-amber-500/10 text-amber-300 font-medium px-2 py-0.5 rounded-full text-[11px] hidden sm:inline-block border border-amber-500/20">
                {t('nav.boutique_tours')}
              </Tag>
            </div>
          </div>

          {/* Center/Right Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-xs font-semibold transition-colors ${
                isActive('/') ? 'text-[#C2703D] font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/experiences"
              className={`text-xs font-semibold transition-colors ${
                isActive('/experiences') ? 'text-[#C2703D] font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('nav.tours')}
            </Link>

            {user && (
              <Link
                to="/my-bookings"
                className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  isActive('/my-bookings') ? 'text-amber-400 font-extrabold' : 'text-amber-400/90 hover:text-amber-300'
                }`}
              >
                <BookOutlined /> {t('nav.my_bookings')}
              </Link>
            )}
          </div>

          {/* Right Desktop Controls & User Avatar */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector */}
            <Select
              value={currentLang}
              onChange={handleLangSelect}
              variant="borderless"
              popupClassName="dark-select-dropdown"
              className="custom-lang-select bg-[#0F1419] border border-slate-800 text-slate-200 rounded-xl text-xs backdrop-blur-md px-1"
              suffixIcon={<GlobalOutlined className="text-[#C2703D]" />}
              options={[
                { value: 'uz', label: <span className="text-xs">🇺🇿 UZ</span> },
                { value: 'en', label: <span className="text-xs">🇬🇧 EN</span> },
                { value: 'ru', label: <span className="text-xs">🇷🇺 RU</span> },
              ]}
            />

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2">
                  <Avatar src={user.avatar} icon={<UserOutlined />} className="bg-[#C2703D] border border-amber-400/40" />
                  <div className="text-xs text-left">
                    <div className="font-bold text-white leading-tight">{user.name}</div>
                    <div className="text-slate-400 text-[11px] truncate max-w-[110px]">{user.email}</div>
                  </div>
                </div>

                {user.role === 'GUIDE' && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<DashboardOutlined />}
                    onClick={() => navigate('/guide/dashboard')}
                    className="bg-[#C2703D] hover:bg-[#A85B2D] border-none text-xs rounded-xl font-bold"
                  >
                    {t('nav.guide_dashboard')}
                  </Button>
                )}

                <Button
                  type="default"
                  danger
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className="rounded-xl border-slate-800 bg-[#0F1419] text-slate-300 hover:text-red-400 text-xs font-medium"
                >
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl text-xs px-5 h-9"
              >
                {t('nav.login')}
              </Button>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <Select
              value={currentLang}
              onChange={handleLangSelect}
              variant="borderless"
              popupClassName="dark-select-dropdown"
              className="custom-lang-select bg-[#0F1419] border border-slate-800 text-slate-200 rounded-xl text-xs px-1"
              suffixIcon={<GlobalOutlined className="text-[#C2703D]" />}
              options={[
                { value: 'uz', label: <span className="text-xs">🇺🇿 UZ</span> },
                { value: 'en', label: <span className="text-xs">🇬🇧 EN</span> },
                { value: 'ru', label: <span className="text-xs">🇷🇺 RU</span> },
              ]}
            />
            {user && (
              <Avatar
                size={34}
                src={user.avatar}
                icon={<UserOutlined />}
                onClick={() => setProfileDrawerOpen(true)}
                className="bg-gradient-to-tr from-[#D97706] to-[#C2703D] border border-amber-400/60 cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Mobile Drawer Navigation Menu */}
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C2703D] flex items-center justify-center">
                <CompassOutlined className="text-white text-lg" />
              </div>
              <span className="font-serif font-bold text-white text-lg">TRIPUZ</span>
            </div>
          }
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          className="dark-drawer"
          styles={{
            body: { background: '#0F1419', padding: '20px' },
            header: { background: '#161F28', borderColor: '#1e293b' },
          }}
        >
          <div className="flex flex-col justify-between h-full space-y-6">
            <div className="space-y-4">
              {user && (
                <div className="p-4 rounded-2xl bg-[#161F28] border border-slate-800 flex items-center gap-3">
                  <Avatar size={44} src={user.avatar} icon={<UserOutlined />} className="bg-[#C2703D]" />
                  <div className="text-xs">
                    <div className="font-bold text-white text-sm">{user.name}</div>
                    <div className="text-slate-400 text-xs truncate max-w-[180px]">{user.email}</div>
                    <Tag color="gold" className="m-0 text-[10px] mt-1 border-none bg-amber-500/15 text-amber-300">
                      {user.role}
                    </Tag>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Link
                  to="/"
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/') ? 'bg-[#C2703D]/20 text-[#C2703D] border border-[#C2703D]/30' : 'text-slate-200 hover:bg-[#161F28]'
                  }`}
                >
                  <HomeOutlined /> {t('nav.home')}
                </Link>
                <Link
                  to="/experiences"
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/experiences') ? 'bg-[#C2703D]/20 text-[#C2703D] border border-[#C2703D]/30' : 'text-slate-200 hover:bg-[#161F28]'
                  }`}
                >
                  <CompassOutlined /> {t('nav.tours')}
                </Link>

                {user && (
                  <Link
                    to="/my-bookings"
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/my-bookings') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-amber-400 hover:bg-[#161F28]'
                    }`}
                  >
                    <BookOutlined /> {t('nav.my_bookings')}
                  </Link>
                )}

                {user?.role === 'GUIDE' && (
                  <Button
                    block
                    type="primary"
                    icon={<DashboardOutlined />}
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate('/guide/dashboard');
                    }}
                    className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-11 text-xs mt-2"
                  >
                    {t('nav.guide_portal_btn')}
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              {user ? (
                <Button
                  block
                  danger
                  type="default"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className="bg-[#161F28] border-slate-800 text-slate-200 hover:text-red-400 rounded-xl h-11 font-medium"
                >
                  {t('nav.logout')}
                </Button>
              ) : (
                <Button
                  block
                  type="primary"
                  icon={<LoginOutlined />}
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/login');
                  }}
                  className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-11 text-sm"
                >
                  {t('nav.login')}
                </Button>
              )}
            </div>
          </div>
        </Drawer>

        {/* Tourist Profile Bottom Sheet Drawer */}
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <UserOutlined className="text-[#C2703D]" />
              <span className="font-serif font-bold text-white text-base">{t('nav.profile_title')}</span>
            </div>
          }
          placement="bottom"
          height="auto"
          onClose={() => setProfileDrawerOpen(false)}
          open={profileDrawerOpen}
          className="dark-drawer rounded-t-3xl"
          styles={{
            body: { background: '#0F1419', padding: '20px', color: '#fff' },
            header: { background: '#161F28', borderColor: '#1e293b' },
          }}
        >
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-[#161F28] p-4 rounded-2xl border border-slate-800">
                <Avatar
                  size={56}
                  src={user.avatar}
                  icon={<UserOutlined />}
                  className="bg-gradient-to-tr from-[#D97706] to-[#C2703D] border-2 border-amber-400 flex-shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base truncate m-0">{user.name}</h3>
                    <Tag color="gold" className="m-0 text-[10px] border-none bg-amber-500/20 text-amber-300">
                      {user.role}
                    </Tag>
                  </div>
                  <div className="text-xs text-slate-400 truncate">✉️ {user.email}</div>
                  {user.phone && <div className="text-xs text-slate-400 truncate">📞 {user.phone}</div>}
                </div>
              </div>

              {user.role === 'GUIDE' && (
                <Button
                  block
                  type="primary"
                  icon={<DashboardOutlined />}
                  onClick={() => {
                    setProfileDrawerOpen(false);
                    navigate('/guide/dashboard');
                  }}
                  className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-11 text-xs"
                >
                  {t('nav.guide_portal_btn')} 🧭
                </Button>
              )}

              <Button
                block
                danger
                type="default"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="bg-[#161F28] border-slate-800 text-slate-300 hover:text-red-400 rounded-xl h-11 font-semibold text-xs"
              >
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 space-y-4">
              <p className="text-slate-400 text-xs">{t('nav.profile_login_hint')}</p>
              <Button
                type="primary"
                block
                icon={<LoginOutlined />}
                onClick={() => {
                  setProfileDrawerOpen(false);
                  navigate('/login');
                }}
                className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-11 text-xs"
              >
                {t('nav.login')}
              </Button>
            </div>
          )}
        </Drawer>
      </header>

      {/* Instagram Native App Style Mobile Bottom Navigation Bar (< 768px / md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161F28]/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isActive('/') ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <HomeOutlined className="text-lg" />
          <span className="text-[10px]">{t('nav.mobile_home')}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/experiences')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isActive('/experiences') ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <CompassOutlined className="text-lg" />
          <span className="text-[10px]">{t('nav.mobile_tours')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (user) {
              navigate('/my-bookings');
            } else {
              navigate('/login');
            }
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isActive('/my-bookings') ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <BookOutlined className="text-lg" />
          <span className="text-[10px]">{t('nav.mobile_bookings')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (user) {
              setProfileDrawerOpen(true);
            } else {
              navigate('/login');
            }
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            profileDrawerOpen ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
          }`}
        >
          <UserOutlined className="text-lg" />
          <span className="text-[10px]">{t('nav.mobile_profile')}</span>
        </button>
      </div>
    </>
  );
};

export default TouristHeader;
