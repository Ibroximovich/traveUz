import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Tag,
  Empty,
  Skeleton,
  Alert,
  Drawer,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  TeamOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  CloseCircleOutlined,
  BarcodeOutlined,
  CompassOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TouristHeader } from '../components/TouristHeader';
import { useAuthStore } from '../store/useAuthStore';
import { getMyBookings } from '../services/tourist.api';
import type { Booking } from '../types/experience';
import { getExpTitle } from '../types/experience';

const USD_TO_UZS_RATE = 12800;

export const TouristMyBookings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [selectedBookingForSheet, setSelectedBookingForSheet] = useState<Booking | null>(null);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState<boolean>(false);

  // Set page title
  useEffect(() => {
    document.title = t('meta.my_bookings_title');
  }, [t]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // React Query fetch GET /api/bookings/my
  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: ['my-bookings', user?.id, i18n.language],
    queryFn: async () => {
      const res = await getMyBookings();
      if (!res.success) {
        throw new Error(res.message || t('booking.load_error'));
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return (res.data as any)?.bookings || [];
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Tag icon={<CheckCircleOutlined />} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold px-3 py-0.5 rounded-xl text-xs">
            {t('booking.status_confirmed')}
          </Tag>
        );
      case 'COMPLETED':
        return (
          <Tag icon={<CheckCircleOutlined />} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold px-3 py-0.5 rounded-xl text-xs">
            {t('booking.status_completed')}
          </Tag>
        );
      case 'CANCELLED':
        return (
          <Tag icon={<CloseCircleOutlined />} className="bg-red-500/20 text-red-400 border-red-500/40 font-bold px-3 py-0.5 rounded-xl text-xs">
            {t('booking.status_cancelled')}
          </Tag>
        );
      case 'PENDING':
      default:
        return (
          <Tag icon={<FieldTimeOutlined />} className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold px-3 py-0.5 rounded-xl text-xs">
            {t('booking.status_pending')}
          </Tag>
        );
    }
  };

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success(t('booking.voucher_copied', { code }));
  };

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans flex flex-col justify-between selection:bg-[#C2703D] selection:text-white">
      {/* Top Navigation & Mobile Bottom Nav */}
      <TouristHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-6 pb-28">
        
        {/* Back navigation (Desktop only) */}
        <div className="hidden sm:flex items-center justify-between">
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            className="bg-[#161F28] border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs"
          >
            {t('booking.back_home')}
          </Button>
        </div>

        {/* Page Banner Header */}
        <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-2 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/30 text-amber-300 text-xs font-semibold">
            <BarcodeOutlined /> {t('booking.personal_tickets')}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-extrabold text-white m-0">
            {t('booking.my_bookings_title')}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm m-0">
            {t('booking.my_bookings_subtitle')}
          </p>
        </div>

        {/* Loading State: Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <Card key={idx} className="bg-[#161F28] border-slate-800 rounded-3xl p-6">
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
              message={<span className="font-bold text-sm">{t('booking.load_error')}</span>}
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
        {!isLoading && !isError && bookings.length === 0 && (
          <div className="bg-[#161F28] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6">
            <Empty
              description={
                <div className="space-y-1">
                  <span className="text-white font-serif font-bold text-base sm:text-lg block">{t('booking.empty_title')}</span>
                  <span className="text-slate-400 text-xs">{t('booking.empty_subtitle')}</span>
                </div>
              }
            />
            <Button
              type="primary"
              icon={<CompassOutlined />}
              onClick={() => navigate('/experiences')}
              className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl px-6 h-11 text-xs"
            >
              {t('booking.browse_experiences')}
            </Button>
          </div>
        )}

        {/* Bookings Feed */}
        {!isLoading && !isError && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const exp = booking.experience;
              const dateVal = booking.availableDate?.date || booking.createdAt;
              const numP = booking.numPeople || booking.participantsCount || 1;
              const isPaid = booking.paymentStatus === 'PAID';

              return (
                <div
                  key={booking.id}
                  onClick={() => {
                    setSelectedBookingForSheet(booking);
                    setIsBookingSheetOpen(true);
                  }}
                  className="bg-[#161F28] border border-slate-800 rounded-3xl overflow-hidden hover:border-[#C2703D]/50 transition-all shadow-xl p-4 sm:p-6 cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    
                    {/* Thumbnail & Info */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-800 bg-[#0F1419]">
                        <img
                          src={(exp?.images && exp.images[0]) || 'https://images.unsplash.com/photo-1590076215667-873d96c8913c?auto=format&fit=crop&w=400&q=80'}
                          alt={exp?.title || 'Tour'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="font-bold border-none bg-[#0F1419] text-amber-300 px-2.5 py-0.5 rounded-lg text-xs">
                            🕌 {t(`cities.${exp?.location || exp?.city || 'Samarqand'}`, exp?.location || exp?.city || 'Samarqand')}
                          </Tag>
                          {getStatusBadge(booking.status)}
                        </div>

                        <h3 className="text-sm sm:text-lg font-serif font-bold text-white leading-snug truncate m-0">
                          {getExpTitle(exp as any, i18n.language) || 'Local Experience'}
                        </h3>

                        <div className="text-xs text-slate-300 space-y-1 pt-0.5">
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <CalendarOutlined />
                            <span>📅 {dayjs(dateVal).format('DD.MM.YYYY HH:mm')}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-300">
                            <TeamOutlined className="text-[#C2703D]" />
                            <span>👥 {numP} {t('common.person')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Voucher & Price Tag */}
                    <div className="w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0 flex items-center sm:flex-col justify-between sm:justify-start gap-2 flex-shrink-0">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block sm:inline">{t('common.total')} </span>
                        <span className="text-lg sm:text-2xl font-serif font-black text-amber-400 block sm:inline">
                          ${Number(booking.totalPrice).toFixed(2)} USD
                        </span>
                        <span className={`text-[10px] sm:text-xs block font-bold mt-0.5 ${isPaid ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {isPaid ? t('booking.payment_paid') : t('booking.payment_pending_short')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="bg-[#0F1419] px-3 py-1 rounded-xl border border-slate-800 font-mono text-xs">
                          <span className="text-amber-400 font-black tracking-wider flex items-center gap-1">
                            <BarcodeOutlined /> {booking.voucherCode}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Voucher Detail Bottom Sheet Drawer for Mobile & Desktop */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <BarcodeOutlined className="text-amber-400" />
            <span className="font-serif font-bold text-white text-base">{t('booking.ticket_details')}</span>
          </div>
        }
        placement="bottom"
        height="auto"
        onClose={() => setIsBookingSheetOpen(false)}
        open={isBookingSheetOpen}
        className="dark-drawer rounded-t-3xl"
        styles={{
          body: { background: '#0F1419', padding: '20px', color: '#fff' },
          header: { background: '#161F28', borderColor: '#1e293b' },
        }}
      >
        {selectedBookingForSheet && (
          <div className="space-y-4 max-w-xl mx-auto">
            {/* Voucher Card Top */}
            <div className="bg-[#161F28] p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase">{t('booking.ticket_code')}</span>
                {getStatusBadge(selectedBookingForSheet.status)}
              </div>

              <div className="flex items-center justify-between bg-[#0F1419] p-3 rounded-xl border border-slate-800">
                <span className="font-mono text-lg font-black text-amber-400 tracking-wider">
                  {selectedBookingForSheet.voucherCode}
                </span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyVoucher(selectedBookingForSheet.voucherCode)}
                  className="bg-[#161F28] border-slate-700 text-amber-400 hover:border-amber-400 rounded-lg text-xs"
                >
                  {t('common.copy')}
                </Button>
              </div>
            </div>

            {/* Tour Info Card */}
            <div className="bg-[#161F28] p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="font-serif font-bold text-white text-base">
                {getExpTitle(selectedBookingForSheet.experience as any, i18n.language) || selectedBookingForSheet.experience?.title}
              </div>
              <div className="text-slate-300">
                {t('booking.city_label')} <strong className="text-white">{t(`cities.${selectedBookingForSheet.experience?.location || selectedBookingForSheet.experience?.city}`, selectedBookingForSheet.experience?.location || selectedBookingForSheet.experience?.city)}</strong>
              </div>
              <div className="text-slate-300">
                {t('booking.datetime_label')} <strong className="text-amber-400">{dayjs(selectedBookingForSheet.availableDate?.date || selectedBookingForSheet.createdAt).format('DD.MM.YYYY HH:mm')}</strong>
              </div>
              <div className="text-slate-300">
                {t('booking.participants_detail')} <strong className="text-white">{selectedBookingForSheet.numPeople || selectedBookingForSheet.participantsCount || 1} {t('common.person')}</strong>
              </div>
              <div className="text-slate-300">
                {t('booking.total_label')} <strong className="text-amber-400">${Number(selectedBookingForSheet.totalPrice).toFixed(2)} USD</strong> (~{Math.round(Number(selectedBookingForSheet.totalPrice) * USD_TO_UZS_RATE).toLocaleString()} UZS)
              </div>
              <div className="text-slate-300">
                {t('booking.payment_label')} <strong className={selectedBookingForSheet.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}>{selectedBookingForSheet.paymentStatus === 'PAID' ? t('common.paid') : t('common.unpaid')}</strong>
              </div>
            </div>

            {/* Close Button */}
            <Button
              type="primary"
              block
              onClick={() => setIsBookingSheetOpen(false)}
              className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl h-11 text-xs"
            >
              {t('common.close')}
            </Button>
          </div>
        )}
      </Drawer>

      {/* Footer */}
      <footer className="w-full bg-[#0a0e17] border-t border-slate-900 text-center py-6 text-slate-500 text-xs mt-8 hidden sm:block">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
};

export default TouristMyBookings;
