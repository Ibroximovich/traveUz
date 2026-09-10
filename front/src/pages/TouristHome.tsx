import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Tag,
  Avatar,
  Select,
  Empty,
  Skeleton,
  Alert,
} from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TouristHeader } from '../components/TouristHeader';
import { ExperienceImageSlider } from './GuideDashboard';
import { getPublicExperiences } from '../services/tourist.api';
import type { Experience } from '../types/experience';
import { getExpTitle, getExpDescription, formatLanguageName } from '../types/experience';

const USD_TO_UZS_RATE = 12800;

export const TouristHome: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Set page title dynamically
  useEffect(() => {
    document.title = t('meta.home_title');
  }, [t]);

  // React Query for GET /api/experiences
  const {
    data: experiences = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Experience[]>({
    queryKey: ['experiences-home', selectedCity, i18n.language],
    queryFn: async () => {
      const cityFilter = selectedCity === 'ALL' ? undefined : selectedCity;
      const res = await getPublicExperiences({ city: cityFilter });
      if (!res.success) {
        throw new Error(res.message || t('common.load_failed'));
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return (res.data as any)?.experiences || [];
    },
  });

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between selection:bg-[#C2703D] selection:text-white">
      {/* Universal Responsive Header */}
      <TouristHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-10">
        
        {/* Premium Hero Section with Registan Image & Dark Gradient Overlay */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#161F28] p-8 sm:p-12 lg:p-16">
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1600&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1419] via-[#0F1419]/90 to-[#0F1419]/60 pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/30 text-amber-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <StarOutlined /> {t('home.hero_badge')}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-[#F5F5F0] m-0 tracking-tight leading-[1.15]">
              {t('home.hero_title')}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base m-0 leading-relaxed max-w-2xl">
              {t('home.hero_subtitle')}
            </p>

            <div className="pt-4 flex items-center gap-4 flex-wrap">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/experiences')}
                icon={<ArrowRightOutlined />}
                className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl px-8 h-12 text-sm shadow-xl"
              >
                {t('nav.tours')}
              </Button>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-white m-0">
              {t('home.popular_tours')}
            </h2>
          </div>

          <div className="w-full sm:w-auto">
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              popupClassName="dark-select-dropdown"
              className="custom-lang-select bg-[#161F28] border-slate-800 text-slate-200 rounded-xl text-xs w-full sm:w-48"
              options={[
                { value: 'ALL', label: `🕌 ${t('cities.all_cities')}` },
                { value: 'Samarqand', label: `🕌 ${t('cities.Samarqand')}` },
                { value: 'Buxoro', label: `🏰 ${t('cities.Buxoro')}` },
                { value: 'Toshkent', label: `🏙️ ${t('cities.Toshkent')}` },
                { value: 'Xiva', label: `🏛️ ${t('cities.Xiva')}` },
              ]}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card key={idx} className="bg-[#161F28] border-slate-800 rounded-3xl p-4">
                <Skeleton.Image className="w-full h-52 rounded-2xl mb-4" active />
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="py-12 max-w-xl mx-auto">
            <Alert
              type="error"
              showIcon
              message={<span className="font-bold text-sm">{t('common.load_failed')}</span>}
              description={
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-300 m-0">
                    {(error as Error)?.message || t('common.connection_error')}
                  </p>
                  <Button
                    type="primary"
                    danger
                    icon={<ReloadOutlined />}
                    onClick={() => refetch()}
                    className="rounded-xl text-xs font-bold"
                  >
                    {t('common.retry')}
                  </Button>
                </div>
              }
              className="bg-red-950/40 border-red-900/60 rounded-2xl p-4"
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && experiences.length === 0 && (
          <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-12 text-center">
            <Empty
              description={
                <div className="space-y-1">
                  <span className="text-slate-300 font-bold text-base block">{t('home.coming_soon')}</span>
                  <span className="text-slate-400 text-xs">{t('home.coming_soon_subtitle')}</span>
                </div>
              }
              className="py-6"
            />
          </div>
        )}

        {/* Experiences Card Grid */}
        {!isLoading && !isError && experiences.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp) => {
              const displayPrice = exp.priceUsd || exp.price;
              const uzsEstimate = Math.round((exp.priceUzs || (displayPrice * USD_TO_UZS_RATE)));
              const title = getExpTitle(exp, i18n.language);
              const desc = getExpDescription(exp, i18n.language);

              return (
                <Card
                  key={exp.id}
                  onClick={() => navigate(`/experiences/${exp.id}`)}
                  className="bg-[#161F28] border-slate-800 rounded-3xl overflow-hidden hover:border-[#C2703D]/60 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
                >
                  {/* Image Slider with Price Badge Over Image */}
                  <ExperienceImageSlider
                    images={exp.images}
                    title={title}
                    heightClass="h-56"
                    badgeContent={
                      <Tag className="font-bold border-none bg-[#0F1419]/90 text-amber-300 backdrop-blur-md px-3 py-1 rounded-xl text-xs shadow-md">
                        🕌 {t(`cities.${exp.location || exp.city}`, exp.location || exp.city)}
                      </Tag>
                    }
                    priceBadge={
                      <div className="bg-[#0F1419]/90 border border-amber-400/30 text-white font-black text-sm px-3.5 py-1 rounded-2xl backdrop-blur-md shadow-xl">
                        <span className="text-amber-400 font-serif font-bold text-base">${displayPrice}</span>
                        <span className="text-[10px] text-slate-300 block font-normal">
                          ~{uzsEstimate.toLocaleString()} UZS
                        </span>
                      </div>
                    }
                  />

                  <div className="space-y-4 flex-1 flex flex-col justify-between p-1">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-white leading-snug line-clamp-2 m-0 group-hover:text-amber-400 transition-colors">
                        {title}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-2 mt-2 m-0 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 bg-[#0F1419] p-2.5 rounded-xl border border-slate-800 text-slate-300">
                          <ClockCircleOutlined className="text-[#C2703D]" />
                          <span>{exp.durationHours || exp.duration} {t('common.hours')}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0F1419] p-2.5 rounded-xl border border-slate-800 text-slate-300 truncate">
                          <EnvironmentOutlined className="text-amber-400 flex-shrink-0" />
                          <span className="truncate">{t(`cities.${exp.location || exp.city}`, exp.location || exp.city)}</span>
                        </div>
                      </div>

                      {/* Nearest Date Chip */}
                      {exp.availableDates && exp.availableDates.length > 0 && (
                        <div className="flex items-center gap-2 bg-[#0F1419] p-2.5 rounded-xl border border-amber-500/25 text-amber-300 text-xs">
                          <CalendarOutlined className="text-amber-400 flex-shrink-0" />
                          <span>{t('common.nearest_date')}: <strong className="text-white font-semibold">{dayjs(exp.availableDates[0].date).format('DD.MM.YYYY')}</strong></span>
                        </div>
                      )}

                      {/* Language Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                        {(Array.isArray(exp.languages) ? exp.languages : ["O'zbekcha"]).map((lang, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-[#0F1419] px-2.5 py-1 rounded-xl border border-slate-800 text-slate-300 text-[11px]">
                            🌐 {formatLanguageName(lang, t)}
                          </span>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            size={28}
                            src={(exp as any).guide?.avatarUrl || (exp as any).guide?.avatar}
                            icon={<UserOutlined />}
                            className="bg-[#C2703D] border border-amber-400/60 flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm text-slate-200 font-semibold truncate max-w-[130px]">
                            {(exp as any).guide?.name || t('common.local_guide')}
                          </span>
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          icon={<ArrowRightOutlined />}
                          className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl text-xs px-3.5 h-8 flex-shrink-0"
                        >
                          {t('common.view')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0e17] border-t border-slate-900 text-center py-6 text-slate-500 text-xs mt-12">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
};

export default TouristHome;
