import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tag,
  Skeleton,
  Avatar,
  message,
} from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  LinkOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TouristHeader } from '../components/TouristHeader';
import { getPublicExperienceById } from '../services/tourist.api';
import type { Experience, AvailableDate } from '../types/experience';
import { getExpTitle, getExpDescription, getExpMeetingPoint } from '../types/experience';

const USD_TO_UZS_RATE = 12800;

export const TouristExperienceDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableDate | null>(null);

  // React Query for GET /api/experiences/:id
  const {
    data: experience,
    isLoading,
    isError,
  } = useQuery<Experience | null>({
    queryKey: ['experience-detail', id, i18n.language],
    queryFn: async () => {
      if (!id) return null;
      const res = await getPublicExperienceById(id);
      if (!res.success || !res.data) {
        throw new Error(res.message || t('experience.not_found'));
      }
      return res.data;
    },
    enabled: !!id,
  });

  // Set page title dynamically
  useEffect(() => {
    if (experience) {
      document.title = `${getExpTitle(experience, i18n.language)} — Tripuz`;
    } else {
      document.title = t('meta.detail_title');
    }
  }, [experience, i18n.language, t]);

  // Set default main image when experience loads
  useEffect(() => {
    if (experience && experience.images && experience.images.length > 0) {
      setSelectedImage(experience.images[0]);
    }
  }, [experience]);

  const handleBookNow = () => {
    if (!selectedSlot) {
      message.warning(t('experience.select_date_warning'));
      return;
    }

    const maxCap = selectedSlot.maxCapacity || selectedSlot.slots || 10;
    const booked = selectedSlot.bookedCount || 0;
    const remaining = Math.max(0, maxCap - booked);

    if (remaining <= 0) {
      message.error(t('experience.date_full_error'));
      return;
    }

    if (!experience) return;
    navigate(`/booking/${experience.id}?slot=${selectedSlot.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between">
        <TouristHeader />
        <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
          <Skeleton.Button active style={{ width: 120, height: 36 }} />
          <Skeleton.Image className="w-full h-96 rounded-3xl" active />
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (isError || !experience) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between">
        <TouristHeader />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold font-serif text-white">{t('experience.not_found')}</h2>
          <p className="text-slate-400 text-sm">
            {t('experience.not_found_subtitle')}
          </p>
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/experiences')}
            className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl"
          >
            {t('common.back_to_catalog')}
          </Button>
        </div>
      </div>
    );
  }

  const priceUsd = experience.priceUsd || experience.price || 0;
  const priceUzs = experience.priceUzs || Math.round(priceUsd * USD_TO_UZS_RATE);
  const images = experience.images && experience.images.length > 0
    ? experience.images
    : ['https://images.unsplash.com/photo-1590076215667-873d96c8913c?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between selection:bg-[#C2703D] selection:text-white">
      {/* Top Header */}
      <TouristHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Back Button & City Tag */}
        <div className="flex items-center justify-between">
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="bg-[#161F28] border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs"
          >
            {t('common.back')}
          </Button>
          <Tag className="bg-[#161F28] border-slate-800 text-amber-400 font-bold px-3 py-1 rounded-xl text-xs">
            🕌 {t(`cities.${experience.location || experience.city}`, experience.location || experience.city)}
          </Tag>
        </div>

        {/* Main Content Grid: Image Gallery Left, Booking Card Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Gallery & Full Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main Featured Image Display */}
            <div className="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#161F28]">
              <img
                src={selectedImage || images[0]}
                alt={experience.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-4 right-4 bg-[#0F1419]/90 border border-amber-400/30 text-[#F5F5F0] font-serif font-black text-lg px-4 py-1.5 rounded-2xl backdrop-blur-md shadow-xl">
                <span className="text-amber-400">${priceUsd}</span>
                <span className="text-xs text-slate-300 font-sans block font-normal">
                  ~{priceUzs.toLocaleString()} UZS
                </span>
              </div>
            </div>

            {/* Image Thumbnails Carousel Row */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                      (selectedImage || images[0]) === imgUrl
                        ? 'border-[#C2703D] scale-105 shadow-lg'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Metadata */}
            <div className="space-y-4 pt-2">
              <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-white leading-tight">
                {getExpTitle(experience, i18n.language)}
              </h1>

              {/* Key Highlights Chips */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-2 bg-[#161F28] px-3.5 py-2 rounded-2xl border border-slate-800 text-slate-200">
                  <ClockCircleOutlined className="text-[#C2703D]" />
                  <span>{t('common.duration')}: {experience.durationHours || experience.duration} {t('common.hours')}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#161F28] px-3.5 py-2 rounded-2xl border border-slate-800 text-slate-200">
                  <EnvironmentOutlined className="text-amber-400" />
                  <span>{t('common.city')}: {t(`cities.${experience.location || experience.city}`, experience.location || experience.city)}</span>
                </div>
                {(Array.isArray(experience.languages) ? experience.languages : ["O'zbekcha"]).map((lang, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-[#161F28] px-3.5 py-2 rounded-2xl border border-slate-800 text-slate-200">
                    <span>🌐 {lang}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 space-y-3">
                <h3 className="text-lg font-serif font-bold text-white m-0">{t('experience.about')}</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line m-0">
                  {getExpDescription(experience, i18n.language)}
                </p>
              </div>

              {/* Meeting Point Details */}
              <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 space-y-3">
                <h3 className="text-lg font-serif font-bold text-white m-0 flex items-center gap-2">
                  <EnvironmentOutlined className="text-emerald-400" /> {t('experience.meeting_point')}
                </h3>
                <p className="text-slate-300 text-sm m-0">
                  {getExpMeetingPoint(experience, i18n.language)}
                </p>

                {experience.meetingPointMapUrl && (
                  <div className="pt-2">
                    <a
                      href={experience.meetingPointMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#0F1419] px-4 py-2 rounded-xl border border-slate-800 text-[#0EA5E9] hover:text-cyan-300 text-xs font-semibold"
                    >
                      <LinkOutlined /> {t('experience.view_on_map')}
                    </a>
                  </div>
                )}
              </div>

              {/* Guide Information */}
              {(experience as any).guide && (
                <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 flex items-center gap-4">
                  <Avatar
                    size={56}
                    src={(experience as any).guide.avatarUrl || (experience as any).guide.avatar}
                    icon={<UserOutlined />}
                    className="bg-[#C2703D] border-2 border-amber-400 flex-shrink-0"
                  />
                  <div>
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('experience.certified_guide')}</div>
                    <div className="text-lg font-serif font-bold text-white">{(experience as any).guide.name}</div>
                    <div className="text-xs text-slate-400">{(experience as any).guide.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Available Dates & Instant Booking Widget */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('experience.price_per_person')}</div>
                <div className="text-3xl font-serif font-black text-amber-400 mt-1">${priceUsd} USD</div>
                <div className="text-xs text-slate-400 mt-0.5">~{priceUzs.toLocaleString()} UZS</div>
              </div>

              {/* Available Slot Picker */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
                  <CalendarOutlined className="text-amber-400" /> {t('experience.choose_date')}
                </label>

                {experience.availableDates && experience.availableDates.length > 0 ? (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {experience.availableDates.map((slot) => {
                      const maxCap = slot.maxCapacity || slot.slots || 10;
                      const booked = slot.bookedCount || 0;
                      const remaining = Math.max(0, maxCap - booked);
                      const isFull = remaining === 0;
                      const isSelected = selectedSlot?.id === slot.id;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            if (!isFull) setSelectedSlot(slot);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isFull
                              ? 'bg-[#0F1419]/50 border-slate-800/50 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[#C2703D]/20 border-[#C2703D] shadow-md'
                              : 'bg-[#0F1419] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm">
                              {dayjs(slot.date).format('DD MMMM YYYY (HH:mm)')}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <TeamOutlined /> {t('experience.capacity_label', { count: maxCap })}
                            </div>
                          </div>

                          <div>
                            {isFull ? (
                              <Tag color="red" className="m-0 font-bold rounded-lg text-[10px]">
                                {t('experience.fully_booked')}
                              </Tag>
                            ) : (
                              <Tag
                                color={isSelected ? 'gold' : 'green'}
                                className="m-0 font-bold rounded-lg text-xs"
                              >
                                {t('experience.spots_left', { count: remaining })}
                              </Tag>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0F1419] border border-slate-800 rounded-2xl text-center text-slate-400 text-xs italic">
                    {t('experience.no_dates_available')}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="primary"
                  size="large"
                  block
                  disabled={!selectedSlot}
                  icon={<CheckCircleOutlined />}
                  onClick={handleBookNow}
                  className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-12 text-sm shadow-xl"
                >
                  {t('experience.book_now_cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0e17] border-t border-slate-900 text-center py-6 text-slate-500 text-xs mt-12">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
};

export default TouristExperienceDetail;
