import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Tag,
  Skeleton,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TouristHeader } from '../components/TouristHeader';
import { useAuthStore } from '../store/useAuthStore';
import { getPublicExperienceById, createTouristBooking } from '../services/tourist.api';
import type { Experience, AvailableDate } from '../types/experience';
import { getExpTitle } from '../types/experience';

const USD_TO_UZS_RATE = 12800;

export const TouristBookingForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { experienceId } = useParams<{ experienceId: string }>();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get('slot');

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [form] = Form.useForm();
  const [numPeople, setNumPeople] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Set page title
  useEffect(() => {
    document.title = t('meta.booking_title');
  }, [t]);

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Check slot parameter
  useEffect(() => {
    if (!slotId && experienceId) {
      navigate(`/experiences/${experienceId}`);
    }
  }, [slotId, experienceId, navigate]);

  // Fetch experience details
  const {
    data: experience,
    isLoading,
    isError,
  } = useQuery<Experience | null>({
    queryKey: ['experience-booking-form', experienceId, i18n.language],
    queryFn: async () => {
      if (!experienceId) return null;
      const res = await getPublicExperienceById(experienceId);
      if (!res.success || !res.data) {
        throw new Error(res.message || t('booking.not_found_title'));
      }
      return res.data;
    },
    enabled: !!experienceId,
  });

  // Find target selected slot
  const selectedSlot: AvailableDate | undefined = experience?.availableDates?.find(
    (s) => s.id === slotId
  );

  const maxCap = selectedSlot?.maxCapacity || selectedSlot?.slots || 10;
  const currentBooked = selectedSlot?.bookedCount || 0;
  const remainingSlots = Math.max(0, maxCap - currentBooked);

  // Live Price Calculation
  const unitPrice = Number(experience?.priceUsd || experience?.price || 0);
  const basePrice = unitPrice * numPeople;
  const touristServiceFee = Math.round(basePrice * 0.10 * 100) / 100;
  const totalPrice = basePrice + touristServiceFee;

  // Auto fill form with user info
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        touristName: user.name || '',
        touristEmail: user.email || '',
        touristPhone: (user as any).phone || '',
        numPeople: 1,
      });
    }
  }, [user, form]);

  const handleSubmitBooking = async (values: any) => {
    if (!experienceId || !slotId) return;

    if (numPeople > remainingSlots) {
      setServerError(t('booking.error_only_spots', { count: remainingSlots }));
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        experienceId,
        slotId,
        numPeople,
        touristName: values.touristName,
        touristEmail: values.touristEmail,
        touristPhone: values.touristPhone || '',
      };

      const res = await createTouristBooking(payload);

      if (res.success && res.data) {
        navigate('/my-bookings');
      } else {
        throw new Error(res.message || t('booking.creating_error'));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('common.server_error');
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between">
        <TouristHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 w-full space-y-6">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  if (isError || !experience || !selectedSlot) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between">
        <TouristHeader />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold font-serif text-white">{t('booking.not_found_title')}</h2>
          <p className="text-slate-400 text-sm">
            {t('booking.not_found_subtitle')}
          </p>
          <Button
            type="primary"
            onClick={() => navigate('/experiences')}
            className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl"
          >
            {t('common.back_to_tours')}
          </Button>
        </div>
      </div>
    );
  }

  const expTitle = getExpTitle(experience, i18n.language);

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between selection:bg-[#C2703D] selection:text-white">
      {/* Top Header */}
      <TouristHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Back Button */}
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

        {/* Header Banner */}
        <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-2 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/30 text-amber-300 text-xs font-semibold">
            <SafetyCertificateOutlined /> {t('booking.secure_badge')}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-extrabold text-white m-0">
            {t('booking.page_title')}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm m-0">
            {t('booking.page_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-7 bg-[#161F28] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {serverError && (
              <Alert
                type="error"
                message={t('common.error_title')}
                description={serverError}
                showIcon
                closable
                onClose={() => setServerError(null)}
                className="bg-red-950/40 border-red-800 text-red-200 text-xs rounded-2xl"
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmitBooking}
              className="space-y-4"
            >
              <Form.Item
                name="numPeople"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.participants_label')}</span>}
                rules={[{ required: true, message: t('booking.participants_required') }]}
              >
                <InputNumber
                  min={1}
                  max={remainingSlots}
                  value={numPeople}
                  onChange={(val) => setNumPeople(Number(val) || 1)}
                  className="w-full bg-[#0F1419] border-slate-800 text-white rounded-xl text-base py-1"
                />
              </Form.Item>
              <div className="text-xs text-amber-400 font-semibold -mt-2 mb-2">
                {t('booking.remaining_slots', { count: remainingSlots })}
              </div>

              <Form.Item
                name="touristName"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.name_label')}</span>}
                rules={[{ required: true, message: t('booking.name_required') }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-500 mr-1" />}
                  placeholder="Masalan: Jasur Rahimov"
                  className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl py-2"
                />
              </Form.Item>

              <Form.Item
                name="touristEmail"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.email_label')}</span>}
                rules={[
                  { required: true, message: t('booking.email_required') },
                  { type: 'email', message: t('booking.email_invalid') },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-500 mr-1" />}
                  placeholder="name@domain.com"
                  className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl py-2"
                />
              </Form.Item>

              <Form.Item
                name="touristPhone"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{t('booking.phone_label')}</span>}
              >
                <Input
                  prefix={<PhoneOutlined className="text-slate-500 mr-1" />}
                  placeholder="+998 90 123 45 67"
                  className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl py-2"
                />
              </Form.Item>

              <div className="pt-4 border-t border-slate-800">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={submitting}
                  icon={<CheckCircleOutlined />}
                  className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-12 text-sm shadow-xl"
                >
                  {t('booking.submit_btn', { price: totalPrice.toFixed(2) })}
                </Button>
              </div>
            </Form>
          </div>

          {/* Right Column: Tour Summary Card */}
          <div className="lg:col-span-5 bg-[#161F28] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-serif font-bold text-white m-0 border-b border-slate-800 pb-4">
              {t('booking.trip_info')}
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">{t('booking.tour_name')}</span>
                <span className="text-base font-serif font-bold text-white block mt-0.5">{expTitle}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0F1419] p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.tour_datetime')}</span>
                  <span className="text-amber-400 font-bold block mt-0.5">
                    {dayjs(selectedSlot.date).format('DD.MM.YYYY HH:mm')}
                  </span>
                </div>
                <div className="bg-[#0F1419] p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.tour_duration')}</span>
                  <span className="text-slate-200 font-bold block mt-0.5">
                    {experience.durationHours || experience.duration} {t('booking.hours_unit')}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#0F1419] p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{t('booking.price_base', { unit: unitPrice, count: numPeople })}</span>
                  <span className="font-semibold text-white">${basePrice.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{t('booking.price_service_fee')}</span>
                  <span>+${touristServiceFee.toFixed(2)} USD</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
                  <span className="text-white">{t('booking.price_total')}</span>
                  <span className="text-amber-400 font-serif text-lg">${totalPrice.toFixed(2)} USD</span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  ~{Math.round(totalPrice * USD_TO_UZS_RATE).toLocaleString()} UZS
                </div>
              </div>

              <div className="p-3 bg-[#0F1419] rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <LockOutlined className="text-emerald-400 text-base flex-shrink-0" />
                <span>{t('booking.security_note')}</span>
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

export default TouristBookingForm;
