import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Avatar,
  Tag,
  Row,
  Col,
  Select,
  Modal,
  Drawer,
  Form,
  Input,
  InputNumber,
  DatePicker,
  TimePicker,
  Tabs,
  Popconfirm,
  message,
  Empty,
  Badge,
  Upload,
  Switch,
  Tooltip,
  Spin,
} from 'antd';
import {
  HomeOutlined,
  LogoutOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
  DollarOutlined,
  PlusOutlined,
  CompassOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  BookOutlined,
  EditOutlined,
  UploadOutlined,
  PhoneOutlined,
  SendOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  CopyOutlined,
  LinkOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadFileStatus } from 'antd/es/upload/interface';
import { useAuthStore } from '../store/useAuthStore';
import {
  getGuideStats,
  getGuideExperiences,
  createExperience,
  updateExperience,
  toggleExperienceStatus,
  deleteExperience,
  uploadExperienceImages,
  addAvailableDate,
  deleteAvailableDate,
  getGuideBookings,
  updateBookingStatus,
  getGuideProfile,
  updateGuideProfile,
} from '../services/guide.api';
import type { Experience, Booking, GuideStats, GuideProfile } from '../types/experience';
import dayjs from 'dayjs';

const USD_TO_UZS_RATE = 12800;

/**
 * Interactive Experience Image Slider with manual Left/Right arrows
 */
export const ExperienceImageSlider: React.FC<{
  images?: string[];
  title: string;
  heightClass?: string;
  badgeContent?: React.ReactNode;
  priceBadge?: React.ReactNode;
}> = ({ images, title, heightClass = 'h-48', badgeContent, priceBadge }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const imgList =
    images && images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1590076215667-873d96c8913c?auto=format&fit=crop&w=800&q=80'];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + imgList.length) % imgList.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % imgList.length);
  };

  return (
    <div className={`relative ${heightClass} -mx-6 -mt-6 mb-4 overflow-hidden bg-slate-950 group select-none`}>
      <img
        src={imgList[currentIndex]}
        alt={`${title} - ${currentIndex + 1}`}
        className="w-full h-full object-cover brightness-90 transition-all duration-300"
      />

      {/* Left Navigation Arrow */}
      {imgList.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Oldingi rasm"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <LeftOutlined className="text-xs text-white" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {imgList.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Keyingi rasm"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <RightOutlined className="text-xs text-white" />
        </button>
      )}

      {/* Top Left Badges */}
      {badgeContent && (
        <div className="absolute top-3 left-3 flex gap-2 z-10 pointer-events-none">
          {badgeContent}
        </div>
      )}

      {/* Top Right Counter Badge */}
      {imgList.length > 1 && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <Tag className="font-bold border-none bg-slate-900/90 text-amber-300 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[11px] shadow-md m-0">
            📷 {currentIndex + 1}/{imgList.length}
          </Tag>
        </div>
      )}

      {/* Bottom Right Price Badge */}
      {priceBadge && (
        <div className="absolute bottom-3 right-3 text-right z-10 pointer-events-none">
          {priceBadge}
        </div>
      )}
    </div>
  );
};

/**
 * Check if an avatar URL is a real custom-uploaded image by the guide.
 * Auto-generated placeholders (ui-avatars, gravatar, etc.) AND automatic Google profile pictures
 * (lh3.googleusercontent.com) are treated as "no custom avatar uploaded".
 */
function isRealAvatar(url?: string | null, isCustomUploaded?: boolean): boolean {
  if (isCustomUploaded === true) return true;
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const cleanUrl = url.trim().toLowerCase();
  
  // Known placeholder hosts and automatic profile picture hosts (including Google avatars)
  const nonCustomPatterns = [
    'ui-avatars.com',
    'gravatar.com',
    'avatars.dicebear.com',
    'googleusercontent.com',
    'google.com',
    'placeholder',
    'default-avatar',
  ];
  if (nonCustomPatterns.some((pattern) => cleanUrl.includes(pattern))) {
    return false;
  }
  
  return true;
}

export const GuideDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();

  const [currentLang, setCurrentLang] = useState<string>(
    () => i18n.language || localStorage.getItem('tripuz_lang') || 'uz'
  );

  const [stats, setStats] = useState<GuideStats>({
    totalExperiences: 0,
    totalBookings: 0,
    totalRevenueUsd: 0,
    pendingBookings: 0,
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('ALL');

  // Mobile UI UX States & Active Tab Management
  const [activeTabKey, setActiveTabKey] = useState<'tours' | 'bookings' | 'profile' | 'stats'>('tours');
  const [selectedBookingForSheet, setSelectedBookingForSheet] = useState<Booking | null>(null);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState<boolean>(false);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState<boolean>(false);
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);

  // Modals & Language Tabs state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [formLangTab, setFormLangTab] = useState<'uz' | 'en' | 'ru'>('uz');
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);
  const [selectedExpIdForSlot, setSelectedExpIdForSlot] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Avatar & Profile instant feedback states
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [justSavedProfile, setJustSavedProfile] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // File Upload State
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);

  // Currency calculator in modal
  const [modalPriceUsd, setModalPriceUsd] = useState<number>(25);

  const [createForm] = Form.useForm();
  const [slotForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  /**
   * Language Switcher
   */
  const handleLanguageChange = (val: string) => {
    setCurrentLang(val);
    localStorage.setItem('tripuz_lang', val);
    i18n.changeLanguage(val);
    const langLabels: Record<string, string> = {
      uz: "O'zbekcha (UZ)",
      ru: "Русский (RU)",
      en: "English (EN)",
    };
    message.info(`Til: ${langLabels[val] || val}`);
  };

  /**
   * Fetch All Guide Data
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, expRes, bookRes, profRes] = await Promise.all([
        getGuideStats(),
        getGuideExperiences(),
        getGuideBookings(),
        getGuideProfile(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (expRes.success && expRes.data) {
        setExperiences(expRes.data);
      }
      if (bookRes.success && bookRes.data) {
        setBookings(bookRes.data);
      }
      if (profRes.success && profRes.data) {
        setProfile(profRes.data);
        profileForm.setFieldsValue({
          name: profRes.data.name,
          phone: profRes.data.phone,
          telegramHandle: profRes.data.telegramHandle,
          avatar: profRes.data.avatar,
        });
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete reset of all local user-specific state upon logout or user change.
   */
  const resetUserState = () => {
    setUploadedAvatarUrl(null);
    setProfile(null);
    setExperiences([]);
    setBookings([]);
    setStats({
      totalExperiences: 0,
      totalBookings: 0,
      totalRevenueUsd: 0,
      pendingBookings: 0,
    });
    setEditingExp(null);
    setFileList([]);
    setIsEditingProfile(false);
    setJustSavedProfile(false);
    createForm.resetFields();
    slotForm.resetFields();
    profileForm.resetFields();
  };

  useEffect(() => {
    resetUserState();
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  // Sync profile form values whenever profile, user, or activeTabKey changes
  useEffect(() => {
    const p = profile || user;
    if (p) {
      profileForm.setFieldsValue({
        name: p.name || '',
        phone: p.phone || '',
        telegramHandle: (p as any).telegramHandle || '',
        avatar: p.avatar || '',
      });
    }
  }, [profile, user, activeTabKey]);

  /**
   * Open Modal for Creating or Editing Experience
   */
  const handleOpenModal = (exp?: Experience) => {
    setFormLangTab('uz');
    if (exp) {
      setEditingExp(exp);
      setModalPriceUsd(exp.priceUsd || exp.price || 25);
      createForm.setFieldsValue({
        title: exp.title,
        title_uz: (exp as any).title_uz || exp.title,
        title_en: (exp as any).title_en || '',
        title_ru: (exp as any).title_ru || '',
        city: exp.city,
        priceUsd: exp.priceUsd || exp.price || 25,
        durationHours: exp.durationHours || 3,
        meetingPoint: exp.meetingPoint,
        meetingPointText_uz: (exp as any).meetingPointText_uz || (exp as any).meetingPointText || exp.meetingPoint,
        meetingPointText_en: (exp as any).meetingPointText_en || '',
        meetingPointText_ru: (exp as any).meetingPointText_ru || '',
        meetingPointMapUrl: exp.meetingPointMapUrl || '',
        languages: exp.languages || ["O'zbekcha"],
        description: exp.description,
        description_uz: (exp as any).description_uz || exp.description,
        description_en: (exp as any).description_en || '',
        description_ru: (exp as any).description_ru || '',
      });
      // Setup file list for uploaded images preview
      if (exp.images && exp.images.length > 0) {
        setFileList(
          exp.images.map((url, idx) => ({
            uid: `existing-${idx}`,
            name: `rasm-${idx + 1}.jpg`,
            status: 'done' as UploadFileStatus,
            url,
          }))
        );
      } else {
        setFileList([]);
      }
    } else {
      setEditingExp(null);
      setUploadedAvatarUrl(null);
      setModalPriceUsd(25);
      createForm.resetFields();
      createForm.setFieldsValue({
        city: 'Samarqand',
        priceUsd: 25,
        durationHours: 3,
        languages: ["O'zbekcha", 'Inglizcha'],
      });
      setFileList([]);
    }
    setIsCreateModalOpen(true);
  };

  /**
   * Handle Duplicate Experience (Nusxa Olish)
   */
  const handleDuplicateExperience = (exp: Experience) => {
    setEditingExp(null);
    setModalPriceUsd(exp.priceUsd || exp.price || 25);
    createForm.setFieldsValue({
      title: `${exp.title} (Nusxa)`,
      city: exp.city,
      priceUsd: exp.priceUsd || exp.price || 25,
      durationHours: exp.durationHours || 3,
      meetingPoint: exp.meetingPoint,
      meetingPointMapUrl: exp.meetingPointMapUrl || '',
      languages: exp.languages || ["O'zbekcha"],
      description: exp.description,
    });
    if (exp.images && exp.images.length > 0) {
      setFileList(
        exp.images.map((url, idx) => ({
          uid: `dup-${idx}-${Date.now()}`,
          name: `rasm-${idx + 1}.jpg`,
          status: 'done' as UploadFileStatus,
          url,
        }))
      );
    } else {
      setFileList([]);
    }
    setIsCreateModalOpen(true);
    message.info(t('guide.duplicate_success'));
  };

  /**
   * Upload Handler for Images
   */
  const handleCustomUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploadingImages(true);
    try {
      const res = await uploadExperienceImages([file as File]);
      const urls = res.data?.urls || (res as any).urls;
      if (res.success && urls && urls.length > 0) {
        const uploadedUrl = urls[0];
        const newFile: UploadFile = {
          uid: (file as File).name + Date.now(),
          name: (file as File).name,
          status: 'done',
          url: uploadedUrl,
        };
        setFileList((prev) => [...prev, newFile]);
        onSuccess(res, file);
        message.success(t('guide.upload_success'));
      } else {
        throw new Error(res.message || t('guide.upload_error'));
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || t('guide.upload_error');
      onError(err);
      message.error(errMsg);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (file: UploadFile) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  /**
   * Handle Submission of Create/Edit Tour
   */
  const handleSubmitTour = async (values: any) => {
    const imageUrls = fileList.map((f) => f.url || f.response?.urls?.[0]).filter(Boolean) as string[];

    if (imageUrls.length === 0) {
      message.error(t('guide.image_required'));
      return;
    }

    setSubmitting(true);
    try {
      const priceUsd = Number(values.priceUsd);
      const priceUzs = Math.round(priceUsd * USD_TO_UZS_RATE);
      const durationHours = Number(values.durationHours);

      const mainTitle = values.title_uz || values.title || '';
      const mainDesc = values.description_uz || values.description || '';
      const mainMp = values.meetingPointText_uz || values.meetingPoint || '';

      const dto = {
        title: mainTitle,
        title_uz: mainTitle,
        title_en: values.title_en || mainTitle,
        title_ru: values.title_ru || mainTitle,
        description: mainDesc,
        description_uz: mainDesc,
        description_en: values.description_en || mainDesc,
        description_ru: values.description_ru || mainDesc,
        city: values.city || 'Samarqand',
        priceUsd,
        priceUzs,
        price: priceUsd,
        durationHours,
        duration: `${durationHours} soat`,
        meetingPoint: mainMp,
        meetingPointText: mainMp,
        meetingPointText_uz: mainMp,
        meetingPointText_en: values.meetingPointText_en || mainMp,
        meetingPointText_ru: values.meetingPointText_ru || mainMp,
        meetingPointMapUrl: values.meetingPointMapUrl || '',
        languages: values.languages || ["O'zbekcha"],
        images: imageUrls,
      };

      if (editingExp) {
        const res = await updateExperience(editingExp.id, dto);
        if (res.success) {
          message.success(t('guide.tour_updated'));
          setIsCreateModalOpen(false);
          fetchData();
        }
      } else {
        const res = await createExperience(dto);
        if (res.success) {
          message.success(t('guide.tour_created'));
          setIsCreateModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      const serverErrors = err.response?.data?.errors;
      let errorMsg = t('guide.save_error');
      if (serverErrors && typeof serverErrors === 'object') {
        const messages = Object.values(serverErrors).flat();
        if (messages.length > 0) {
          errorMsg = messages.join('; ');
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle Tour Active Status
   */
  const handleToggleStatus = async (exp: Experience) => {
    try {
      const res = await toggleExperienceStatus(exp.id);
      if (res.success) {
        message.success(t('guide.status_changed', { status: !exp.isActive ? t('guide.status.active') : t('guide.status.inactive') }));
        fetchData();
      }
    } catch {
      message.error(t('guide.status_error'));
    }
  };

  /**
   * Delete Experience with Confirmation Modal
   */
  const handleDeleteExperience = (exp: Experience) => {
    Modal.confirm({
      title: t('guide.delete_confirm_title'),
      content: t('guide.delete_confirm_content', { title: exp.title }),
      okText: t('guide.delete_ok'),
      okType: 'danger',
      cancelText: t('guide.delete_cancel'),
      centered: true,
      className: 'dark-modal',
      onOk: async () => {
        try {
          const res = await deleteExperience(exp.id);
          if (res.success) {
            message.success(t('guide.delete_success'));
            fetchData();
          } else {
            message.error(res.message || t('guide.delete_error'));
          }
        } catch (err: any) {
          const errMsg = err.response?.data?.message || err.message || t('guide.delete_error');
          message.error(errMsg);
        }
      },
    });
  };

  /**
   * Handle Add Available Slot
   */
  const handleAddSlot = async (values: any) => {
    setSubmitting(true);
    try {
      const dateStr = values.date.format('YYYY-MM-DD');
      const timeStr = values.time ? values.time.format('HH:mm') : '10:00';
      const fullDate = `${dateStr}T${timeStr}:00.000Z`;

      const maxCap = Number(values.maxCapacity || values.slots || 10);

      const res = await addAvailableDate(values.experienceId, {
        date: fullDate,
        slots: maxCap,
        maxCapacity: maxCap,
      } as any);

      if (res.success) {
        message.success(t('guide.slot_added'));
        setIsSlotModalOpen(false);
        slotForm.resetFields();
        fetchData();
      }
    } catch (err: any) {
      message.error(err.message || t('guide.slot_add_error'));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle Delete Slot
   */
  const handleDeleteSlot = async (dateId: string) => {
    try {
      const res = await deleteAvailableDate(dateId);
      if (res.success) {
        message.success(t('guide.slot_deleted'));
        fetchData();
      }
    } catch {
      message.error(t('guide.slot_delete_error'));
    }
  };

  /**
   * Handle Update Booking Status
   */
  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await updateBookingStatus(bookingId, status);
      if (res.success) {
        message.success(t('guide.booking_status_updated', { status }));
        fetchData();
      }
    } catch (err: any) {
      message.error(err.message || t('guide.booking_status_error'));
    }
  };

  /**
   * Update Profile
   */
  const handleUpdateProfileSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await updateGuideProfile(values);
      if (res.success && res.data) {
        setProfile(res.data);
        if (user) {
          updateUser({ ...user, name: res.data.name, avatar: res.data.avatar || null });
        }
        setIsEditingProfile(false);
        message.success(t('guide.profile_saved'));
      }
    } catch (err: any) {
      message.error(err.message || t('guide.profile_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: t('guide.logout_confirm_title'),
      content: t('guide.logout_confirm_content'),
      okText: t('guide.logout_ok'),
      okType: 'danger',
      cancelText: t('guide.logout_cancel'),
      centered: true,
      className: 'dark-modal',
      onOk: () => {
        resetUserState();
        logout();
        message.info(t('guide.logout_success'));
        navigate('/login');
      },
    });
  };

  // Filter Bookings by status
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus === 'ALL') return true;
    return b.status === bookingFilterStatus;
  });

  return (
    <div className="min-h-screen bg-[#0F1419] text-[#F5F5F0] font-sans selection:bg-[#C2703D] selection:text-white">
      
      {/* ==================================================== */}
      {/* MOBILE NATIVE APP LAYOUT (< 768px / sm:hidden) */}
      {/* ==================================================== */}
      <div className="sm:hidden min-h-screen pb-24 bg-[#0F1419]">
        
        {/* 1. Mobile Minimalist Sticky Header */}
        <div className="sticky top-0 z-30 bg-[#161F28]/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              size={38}
              src={uploadedAvatarUrl || profile?.avatar || user?.avatar}
              icon={<UserOutlined />}
              className="bg-gradient-to-tr from-[#D97706] to-[#C2703D] border border-amber-400/60 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="font-serif font-bold text-white text-sm leading-tight truncate">
                {activeTabKey === 'stats' && t('guide.mobile_tab_stats')}
                {activeTabKey === 'tours' && t('guide.mobile_tab_tours')}
                {activeTabKey === 'bookings' && t('guide.mobile_tab_bookings')}
                {activeTabKey === 'profile' && t('guide.mobile_tab_profile')}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {profile?.name || user?.name}
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/40 text-amber-300 font-bold text-[10px]">
            ✓ GUIDE
          </span>
        </div>

        {/* 2. Mobile Native Active Tab Views */}
        <div className="px-4 py-3">
          
          {/* TAB 1: ASOSIY / STATISTIKA (Borderless Clean Metrics) */}
          {activeTabKey === 'stats' && (
            <div className="space-y-4 pt-1">
              <div className="bg-[#161F28] p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{t('guide.welcome')}</div>
                <div className="text-base font-serif font-bold text-white">{profile?.name || user?.name}</div>
                <p className="text-xs text-slate-400 m-0 leading-relaxed">
                  {t('guide.dashboard_hint')}
                </p>
              </div>

              {/* Flat Borderless Metrics */}
              <div className="bg-[#161F28] rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">{t('guide.stats.total_tours')}</span>
                    <span className="text-2xl font-serif font-extrabold text-white mt-0.5 block">{stats.totalExperiences}</span>
                  </div>
                  <Tag color="emerald" className="m-0 font-bold text-xs">{experiences.filter((e) => e.isActive).length} {t('guide.stats.active_label')}</Tag>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">{t('guide.stats.total_bookings')}</span>
                    <span className="text-2xl font-serif font-extrabold text-white mt-0.5 block">{stats.totalBookings}</span>
                  </div>
                  <Tag color="indigo" className="m-0 font-bold text-xs">{stats.totalBookings} {t('guide.stats.count_label')}</Tag>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">{t('guide.stats.total_revenue')}</span>
                    <span className="text-2xl font-serif font-extrabold text-amber-400 mt-0.5 block">${stats.totalRevenueUsd} USD</span>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">~{(stats.totalRevenueUsd * USD_TO_UZS_RATE).toLocaleString()} UZS</span>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">{t('guide.stats.pending_bookings')}</span>
                    <span className="text-2xl font-serif font-extrabold text-amber-300 mt-0.5 block">{stats.pendingBookings}</span>
                  </div>
                  {stats.pendingBookings > 0 && <Tag color="gold" className="m-0 font-bold text-xs animate-pulse">{t('guide.stats.review_pending')}</Tag>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TURLARIM */}
          {activeTabKey === 'tours' && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>{t('guide.tours_count')} <strong className="text-white">{experiences.length} {t('guide.stats.count_label')}</strong></span>
              </div>

              {experiences.length === 0 ? (
                <Empty description={<span className="text-slate-400">{t('guide.empty_tours')}</span>} className="py-8" />
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp) => {
                    const isExpanded = expandedCardIds[exp.id] ?? false;
                    return (
                      <div key={exp.id} className="bg-[#161F28] border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3 shadow-lg">
                        <ExperienceImageSlider
                          images={exp.images}
                          title={exp.title}
                          heightClass="h-44"
                          badgeContent={
                            <>
                              <Tag className="font-bold border-none bg-[#0F1419]/90 text-amber-300 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-xs">
                                🕌 {t(`cities.${exp.city}`, exp.city)}
                              </Tag>
                              <Tag color={exp.isActive ? 'gold' : 'default'} className="font-bold rounded-lg text-xs px-2 py-0.5">
                                {exp.isActive ? t('guide.status.active') : t('guide.status.inactive')}
                              </Tag>
                            </>
                          }
                          priceBadge={
                            <div className="bg-[#161F28]/95 border border-slate-800 text-white font-black text-xs px-3 py-1 rounded-xl">
                              <span className="text-amber-400 font-bold">${exp.priceUsd || exp.price}</span>
                            </div>
                          }
                        />

                        <div>
                          <h3 className="text-base font-serif font-bold text-white m-0 leading-snug">{exp.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>⏱️ {exp.durationHours || exp.duration} soat</span>
                            <span>•</span>
                            <span className="truncate">📍 {exp.meetingPointText || exp.meetingPoint}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedCardIds((prev) => ({ ...prev, [exp.id]: !prev[exp.id] }))}
                          className="w-full py-2 bg-[#0F1419] text-amber-400 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? t('guide.actions.collapse') : t('guide.actions.expand')}
                        </button>

                        {isExpanded && (
                          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                            <p className="text-slate-300 leading-relaxed m-0">{exp.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Switch checked={exp.isActive} onChange={() => handleToggleStatus(exp)} size="small" />
                              <span className="text-slate-400 font-medium">{exp.isActive ? t('guide.status.active') : t('guide.status.inactive')}</span>
                            </div>
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <Button size="small" icon={<CopyOutlined />} onClick={() => handleDuplicateExperience(exp)} className="bg-[#0F1419] border-slate-800 text-amber-400 text-xs">{t('guide.actions.copy_btn')}</Button>
                              <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(exp)} className="bg-[#0F1419] border-slate-800 text-slate-200 text-xs">{t('guide.actions.edit_btn')}</Button>
                              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteExperience(exp)} className="bg-[#0F1419] border-red-900/60 text-red-400 text-xs">{t('guide.actions.delete_btn')}</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BUYURTMALAR (Instagram Feed / Clean List Item View) */}
          {activeTabKey === 'bookings' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-400 font-bold uppercase">Buyurtmalar</span>
                <Select
                  value={bookingFilterStatus}
                  onChange={setBookingFilterStatus}
                  popupClassName="dark-select-dropdown"
                  className="custom-lang-select bg-[#161F28] border-slate-800 rounded-xl text-xs w-36"
                  options={[
                    { value: 'ALL', label: t('common.all') },
                    { value: 'PENDING', label: t('booking.status_pending') },
                    { value: 'CONFIRMED', label: t('booking.status_confirmed') },
                    { value: 'COMPLETED', label: t('booking.status_completed') },
                    { value: 'CANCELLED', label: t('booking.status_cancelled') },
                  ]}
                />
              </div>

              {filteredBookings.length === 0 ? (
                <Empty description={<span className="text-slate-400">{t('guide.empty_bookings')}</span>} className="py-8" />
              ) : (
                <div className="bg-[#161F28] rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
                  {filteredBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBookingForSheet(b);
                        setIsBookingSheetOpen(true);
                      }}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#1E2936]/60 transition-colors cursor-pointer active:bg-[#1E2936]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar
                          size={40}
                          src={b.user?.avatar}
                          icon={<UserOutlined />}
                          className="bg-amber-600 border border-amber-400 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-xs sm:text-sm truncate">{b.user?.name || 'Turist'}</div>
                          <div className="text-[11px] text-amber-400 truncate">{b.experience?.title}</div>
                          <div className="text-[10px] text-slate-400">
                            👥 {b.participantsCount} kishi • 📅 {b.availableDate?.date ? dayjs(b.availableDate.date).format('DD.MM HH:mm') : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        <div className="text-xs font-bold font-serif text-amber-400">${Number(b.totalPrice).toLocaleString()}</div>
                        <Tag
                          className="m-0 text-[10px] font-bold rounded-full px-2 border-none"
                          color={
                            b.status === 'CONFIRMED' ? 'green' : b.status === 'PENDING' ? 'gold' : b.status === 'COMPLETED' ? 'blue' : 'red'
                          }
                        >
                          {b.status === 'CONFIRMED' ? t('booking.status_confirmed') : b.status === 'PENDING' ? t('booking.status_pending') : b.status === 'COMPLETED' ? t('booking.status_completed') : t('booking.status_cancelled')}
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFIL (Full Profile Settings Form) */}
          {activeTabKey === 'profile' && (
            <div className="space-y-4 pt-1 pb-4">
              {/* Profile Card Overview */}
              <div className="bg-[#161F28] p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-center gap-4">
                  <Avatar
                    size={64}
                    src={uploadedAvatarUrl || profileForm.getFieldValue('avatar') || profile?.avatar || user?.avatar}
                    icon={<UserOutlined />}
                    className="bg-gradient-to-tr from-[#D97706] to-[#C2703D] border-2 border-amber-400 flex-shrink-0 shadow-md"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-white text-base truncate m-0">{profile?.name || user?.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/40 text-amber-300 font-bold text-[10px]">
                        ✓ GUIDE
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">✉️ {profile?.email || user?.email}</div>
                    {(profile?.phone || user?.phone) && (
                      <div className="text-xs text-slate-400 truncate">📞 {profile?.phone || user?.phone}</div>
                    )}
                    {(profile?.telegramHandle || (user as any)?.telegramHandle) && (
                      <div className="text-xs text-amber-400 truncate">💬 {profile?.telegramHandle || (user as any)?.telegramHandle}</div>
                    )}
                    <div className="text-xs text-amber-300 font-semibold pt-0.5">{t('guide.profile.commission_rate')} {profile?.commissionRate || 10}%</div>
                  </div>
                </div>

                {/* Platform Summary Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                  <div className="bg-[#0F1419] p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t('guide.tabs.my_tours')}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{Math.max(stats.totalExperiences, experiences.length)}</div>
                  </div>
                  <div className="bg-[#0F1419] p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t('guide.tabs.bookings')}</div>
                    <div className="text-sm font-bold text-indigo-400 mt-0.5">{Math.max(stats.totalBookings, bookings.length)}</div>
                  </div>
                  <div className="bg-[#0F1419] p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Tushum</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">${stats.totalRevenueUsd}</div>
                  </div>
                </div>

                {!isEditingProfile && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <Button
                      type="primary"
                      htmlType="button"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditingProfile(true)}
                      block
                      className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl text-xs py-2.5 shadow-md cursor-pointer"
                    >
                      {t('guide.profile.edit_profile')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Edit Form Card (Only visible when isEditingProfile is true) */}
              {isEditingProfile && (
                <div className="bg-[#161F28] p-4 rounded-2xl border border border-amber-500/30 space-y-4 shadow-xl transition-all">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                      <EditOutlined className="text-amber-400" /> {t('guide.profile.edit_profile')}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      htmlType="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      {t('guide.profile.cancel_btn')}
                    </Button>
                  </div>

                  <Form
                    form={profileForm}
                    layout="vertical"
                    initialValues={{
                      name: profile?.name || user?.name || '',
                      phone: profile?.phone || user?.phone || '',
                      telegramHandle: profile?.telegramHandle || (user as any)?.telegramHandle || '',
                      avatar: profile?.avatar || user?.avatar || '',
                    }}
                    onFinish={handleUpdateProfileSubmit}
                    className="space-y-3"
                  >
                    <Form.Item
                      name="name"
                      label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.name')} *</span>}
                      rules={[{ required: true, message: t('guide.profile.name_required') }]}
                      className="m-0"
                    >
                      <Input
                        prefix={<UserOutlined className="text-slate-500 mr-1" />}
                        placeholder={t('guide.profile.name_placeholder')}
                        className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl text-xs py-2"
                      />
                    </Form.Item>

                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <Form.Item
                        name="phone"
                        label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.phone')}</span>}
                        className="m-0"
                      >
                        <Input
                          prefix={<PhoneOutlined className="text-slate-500 mr-1" />}
                          placeholder="+998 90 123 45 67"
                          className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl text-xs py-2"
                        />
                      </Form.Item>

                      <Form.Item
                        name="telegramHandle"
                        label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.telegram')}</span>}
                        className="m-0"
                      >
                        <Input
                          prefix={<SendOutlined className="text-slate-500 mr-1" />}
                          placeholder="@jasur_guide"
                          className="bg-[#0F1419] border-slate-800 text-slate-200 rounded-xl text-xs py-2"
                        />
                      </Form.Item>
                    </div>

                    {/* Avatar Upload */}
                    <Form.Item
                      name="avatar"
                      label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.avatar')}</span>}
                      className="m-0 pt-2"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 bg-[#0F1419] p-3 rounded-xl border border-slate-800">
                          {uploadedAvatarUrl && (
                            <Avatar size={40} src={uploadedAvatarUrl} className="border border-amber-400 flex-shrink-0" />
                          )}
                          <Upload
                            customRequest={async (options) => {
                              const { file, onSuccess, onError } = options;
                              try {
                                const res = await uploadExperienceImages([file as File]);
                                const urls = res.data?.urls || (res as any).urls;
                                if (res.success && urls && urls.length > 0) {
                                  const avatarUrl = urls[0];
                                  setUploadedAvatarUrl(avatarUrl);
                                  profileForm.setFieldsValue({ avatar: avatarUrl });
                                  onSuccess?.(res, file);
                                  message.success(t('guide.profile.avatar_uploaded'));
                                } else {
                                  throw new Error(res.message || t('guide.profile.upload_error'));
                                }
                              } catch (err: any) {
                                onError?.(err);
                                message.error(t('guide.profile.avatar_upload_failed'));
                              }
                            }}
                            showUploadList={false}
                            accept="image/*"
                          >
                            <Button
                              htmlType="button"
                              icon={<UploadOutlined />}
                              size="small"
                              className="bg-[#161F28] border-slate-700 text-slate-200 hover:border-[#C2703D] rounded-lg text-xs"
                            >
                              {t('guide.profile.select_new_avatar')}
                            </Button>
                          </Upload>
                          <span className="text-[11px] text-slate-400">{t('guide.profile.avatar_hint')}</span>
                        </div>
                      </div>
                    </Form.Item>

                    <div className="pt-2">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        icon={<CheckOutlined />}
                        block
                        className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl text-xs py-2.5 shadow-lg transition-all cursor-pointer"
                      >
                        {t('guide.profile.save_profile_btn')}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {/* Settings Card */}
              <div className="bg-[#161F28] p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                <div className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <GlobalOutlined className="text-amber-400" /> Tizim Sozlamalari
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300 font-semibold">Ilova Tili:</span>
                  <Select
                    value={currentLang}
                    onChange={handleLanguageChange}
                    variant="borderless"
                    popupClassName="dark-select-dropdown"
                    className="custom-lang-select bg-[#0F1419] border border-slate-800 text-slate-200 rounded-xl text-xs px-2"
                    suffixIcon={<GlobalOutlined className="text-[#C2703D]" />}
                    options={[
                      { value: 'uz', label: <span className="text-xs">🇺🇿 O'zbekcha</span> },
                      { value: 'ru', label: <span className="text-xs">🇷🇺 Русский</span> },
                      { value: 'en', label: <span className="text-xs">🇬🇧 English</span> },
                    ]}
                  />
                </div>

                <div className="pt-1">
                  <Button
                    type="default"
                    block
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    className="bg-[#0F1419] border-slate-800 text-slate-300 hover:text-red-400 hover:border-red-900 rounded-xl text-xs font-semibold py-2 cursor-pointer"
                  >
                    Tizimdan Chiqish
                  </Button>
                </div>
              </div>
            </div>
          )}


        </div>

        {/* Mobile Bottom Navigation Bar (Instagram / Telegram App Style) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161F28]/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl">
          <button
            type="button"
            onClick={() => setActiveTabKey('stats')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTabKey === 'stats' ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
            }`}
          >
            <HomeOutlined className="text-lg" />
            <span className="text-[10px]">Asosiy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabKey('tours')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTabKey === 'tours' ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
            }`}
          >
            <CompassOutlined className="text-lg" />
            <span className="text-[10px]">Turlarim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabKey('bookings')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTabKey === 'bookings' ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
            }`}
          >
            <BookOutlined className="text-lg" />
            <span className="text-[10px]">Buyurtmalar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabKey('profile')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTabKey === 'profile' ? 'text-[#C2703D] font-bold scale-105' : 'text-slate-400'
            }`}
          >
            <UserOutlined className="text-lg" />
            <span className="text-[10px]">Profil</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* DESKTOP LAYOUT (> 768px / hidden sm:block) */}
      {/* ==================================================== */}
      <div className="hidden sm:block max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        
        {/* Top Silk Road Navigation Header (2-Row Structured Header) */}
        <div className="sticky top-0 z-30 bg-[#161F28]/95 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
          
          {/* Top Row: Primary User Identity & Badge */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <Avatar
                  size={52}
                  src={profile?.avatar || user?.avatar}
                  icon={<UserOutlined />}
                  className="bg-gradient-to-tr from-[#D97706] to-[#C2703D] border-2 border-amber-400/60 shadow-lg shadow-amber-950/40"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-[#161F28] rounded-full shadow-sm"></span>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-serif font-bold text-white m-0 tracking-tight truncate max-w-[220px] sm:max-w-xs">
                    {profile?.name || user?.name || 'Gid Kabineti'}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/40 text-amber-300 font-bold text-[11px] tracking-wider uppercase">
                    <CheckOutlined className="text-amber-400 text-[10px]" />
                    <span>GUIDE</span>
                  </span>
                </div>

                <p className="text-xs text-slate-400 m-0 truncate flex items-center gap-2">
                  <span className="truncate">{profile?.email || user?.email}</span>
                  {profile?.phone && <span className="text-slate-500 font-normal hidden sm:inline">• {profile.phone}</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Subtle Horizontal Divider Line */}
          <div className="border-t border-slate-800/80"></div>

          {/* Bottom Row: Settings Controls (Language & Neutral Logout) */}
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Til:</span>
              <Select
                value={currentLang}
                onChange={handleLanguageChange}
                variant="borderless"
                popupClassName="dark-select-dropdown"
                className="custom-lang-select bg-[#0F1419] border border-slate-800 text-slate-200 rounded-xl text-xs backdrop-blur-md px-2 py-0.5"
                suffixIcon={<GlobalOutlined className="text-[#C2703D]" />}
                options={[
                  { value: 'uz', label: <span className="flex items-center gap-1.5 text-xs font-semibold">🇺🇿 O'zbekcha</span> },
                  { value: 'ru', label: <span className="flex items-center gap-1.5 text-xs font-semibold">🇷🇺 Русский</span> },
                  { value: 'en', label: <span className="flex items-center gap-1.5 text-xs font-semibold">🇬🇧 English</span> },
                ]}
              />
            </div>

            <Button
              type="default"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="bg-[#0F1419] border-slate-800 text-slate-300 hover:text-red-400 hover:border-red-900/60 rounded-xl text-xs font-semibold transition-all px-4"
            >
              {t('nav.logout')}
            </Button>
          </div>
        </div>

        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-[#161F28] via-[#1A2430] to-[#0F1419] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#C2703D]/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 p-2 sm:p-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C2703D]/15 border border-[#C2703D]/30 text-amber-300 text-xs font-semibold">
                <StarOutlined /> Premium Boutique Travel Marketplace
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white m-0 tracking-tight">
                {t('guide.title')}
              </h2>
              <p className="text-slate-400 text-sm max-w-xl m-0 leading-relaxed">
                {t('guide.subtitle')}
              </p>
            </div>
            <div className="hidden sm:flex flex-wrap gap-3">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => handleOpenModal()}
                className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl text-sm shadow-xl shadow-black/40 px-5"
              >
                {t('guide.actions.add_tour')}
              </Button>
              <Button
                type="default"
                icon={<CalendarOutlined className="text-amber-400" />}
                size="large"
                onClick={() => setIsSlotModalOpen(true)}
                className="bg-[#0F1419] border-slate-800 text-slate-200 hover:border-[#C2703D] rounded-xl text-sm px-4"
              >
                {t('guide.actions.add_slot')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Collapsible Header for Statistics */}
        <div className="flex items-center justify-between bg-[#161F28] px-4 py-3 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-slate-300 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            📊 {t('guide.stats.total_tours')} &amp; Metrics
          </span>
          <button
            type="button"
            onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
            className="text-amber-400 hover:text-amber-300 text-xs font-semibold cursor-pointer flex items-center gap-1 bg-[#0F1419] px-3 py-1 rounded-xl border border-slate-800"
          >
            {isStatsCollapsed ? "🔽" : "🔼"}
          </button>
        </div>

        {/* 4 Statistics Cards */}
        {!isStatsCollapsed && (
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={12} lg={6}>
              <div className="bg-[#161F28] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg hover:border-[#C2703D]/50 transition-all group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">{t('guide.stats.total_tours')}</span>
                    <span className="text-2xl sm:text-3xl font-serif font-extrabold text-white mt-1 block">{Math.max(stats.totalExperiences, experiences.length)}</span>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C2703D]/15 border border-[#C2703D]/30 flex items-center justify-center text-[#C2703D] text-lg sm:text-2xl flex-shrink-0">
                    <CompassOutlined />
                  </div>
                </div>
                <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-400 hidden sm:inline">{t('guide.status.active')}</span>
                  <span className="text-emerald-400 font-semibold">{experiences.filter(e => e.isActive).length}</span>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} lg={6}>
              <div className="bg-[#161F28] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg hover:border-indigo-500/50 transition-all group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">{t('guide.stats.total_bookings')}</span>
                    <span className="text-2xl sm:text-3xl font-serif font-extrabold text-white mt-1 block">{Math.max(stats.totalBookings, bookings.length)}</span>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg sm:text-2xl flex-shrink-0">
                    <BookOutlined />
                  </div>
                </div>
                <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-400 hidden sm:inline">{t('guide.tabs.bookings')}</span>
                  <span className="text-indigo-400 font-semibold">{bookings.length}</span>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} lg={6}>
              <div className="bg-[#161F28] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg hover:border-amber-500/50 transition-all group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">{t('guide.stats.monthly_revenue')}</span>
                    <span className="text-2xl sm:text-3xl font-serif font-extrabold text-amber-400 mt-1 block">${stats.totalRevenueUsd}</span>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg sm:text-2xl flex-shrink-0">
                    <DollarOutlined />
                  </div>
                </div>
                <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-400 hidden sm:inline">UZS</span>
                  <span className="text-amber-400 font-semibold truncate">~{(stats.totalRevenueUsd * USD_TO_UZS_RATE).toLocaleString()} UZS</span>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} lg={6}>
              <div className="bg-[#161F28] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg hover:border-amber-400/50 transition-all group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block">{t('guide.stats.pending_bookings')}</span>
                    <span className="text-2xl sm:text-3xl font-serif font-extrabold text-amber-300 mt-1 block">{bookings.filter(b => b.status === 'PENDING').length}</span>
                  </div>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 text-lg sm:text-2xl flex-shrink-0">
                    <ClockCircleOutlined />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        )}

        {/* Main Dashboard Tabs Container */}
        <Card className="bg-[#161F28] border border-slate-800 rounded-3xl p-0 overflow-hidden shadow-2xl">
          <Spin spinning={loading}>
            <Tabs
              activeKey={activeTabKey}
              onChange={(k) => setActiveTabKey(k as any)}
              className="custom-dashboard-tabs px-4 sm:px-6 pt-3"
              items={[
                {
                  key: 'tours',
                  label: (
                    <span className="flex items-center gap-2 text-sm font-semibold py-1">
                      <CompassOutlined className="text-[#C2703D]" /> {t('guide.tabs.my_tours')} ({experiences.length})
                    </span>
                  ),
                  children: (
                    <div className="py-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold font-serif text-white m-0">{t('guide.tabs.my_tours')}</h3>
                          <p className="text-xs text-slate-400 m-0 mt-1">{t('guide.subtitle')}</p>
                        </div>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleOpenModal()}
                          className="hidden sm:inline-flex bg-[#C2703D] hover:bg-[#A85B2D] border-none rounded-xl text-xs font-bold"
                        >
                          {t('guide.actions.add_tour')}
                        </Button>
                      </div>

                      {experiences.length === 0 ? (
                        <Empty
                          description={<span className="text-slate-400">Hali hech qanday sayohat yaratilmagan</span>}
                          className="py-12"
                        >
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModal()}
                            className="bg-[#C2703D] border-none rounded-xl"
                          >
                            Birinchi Sayohatni Yarating
                          </Button>
                        </Empty>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {experiences.map((exp) => {
                            const isExpanded = expandedCardIds[exp.id] ?? false;

                            return (
                              <div
                                key={exp.id}
                                className={`bg-[#0F1419] border border-slate-800 rounded-3xl overflow-hidden hover:border-[#C2703D]/50 transition-all duration-300 shadow-xl flex flex-col justify-between p-4 sm:p-6 space-y-4 ${
                                  !exp.isActive ? 'opacity-75 grayscale-[0.2]' : ''
                                }`}
                              >
                                {/* Full Width Top Cover Image Slider */}
                                <ExperienceImageSlider
                                  images={exp.images}
                                  title={exp.title}
                                  heightClass="h-44 sm:h-52"
                                  badgeContent={
                                    <>
                                      <Tag className="font-bold border-none bg-[#0F1419]/90 text-amber-300 backdrop-blur-md px-3 py-1 rounded-xl text-xs shadow-md">
                                        🕌 {t(`cities.${exp.city}`, exp.city)}
                                      </Tag>
                                      <Tag color={exp.isActive ? 'gold' : 'default'} className="font-bold rounded-xl text-xs px-2.5 py-0.5">
                                        {exp.isActive ? t('guide.status.active') : t('guide.status.inactive')}
                                      </Tag>
                                    </>
                                  }
                                  priceBadge={
                                    <div className="bg-[#161F28]/95 border border-slate-800 text-white font-black text-sm px-3.5 py-1.5 rounded-2xl backdrop-blur-md shadow-xl">
                                      <span className="text-amber-400 text-base font-serif font-bold">${exp.priceUsd || exp.price}</span>
                                      <span className="text-[10px] text-slate-400 block font-normal">
                                        ~{((exp.priceUsd || exp.price) * USD_TO_UZS_RATE).toLocaleString()} UZS
                                      </span>
                                    </div>
                                  }
                                />

                                {/* Title & Compact Meta Header */}
                                <div className="space-y-2">
                                  <h3 className="text-lg sm:text-xl font-bold font-serif text-white leading-snug line-clamp-1 m-0">
                                    {exp.title}
                                  </h3>
                                  
                                  {/* Compact meta row for mobile default view */}
                                  <div className="flex items-center gap-2 text-xs text-slate-300">
                                    <span className="bg-[#161F28] px-2.5 py-1 rounded-lg border border-slate-800">
                                      ⏱️ {exp.durationHours || exp.duration} soat
                                    </span>
                                    <span className="bg-[#161F28] px-2.5 py-1 rounded-lg border border-slate-800 truncate max-w-[180px]">
                                      📍 {exp.meetingPointText || exp.meetingPoint}
                                    </span>
                                  </div>
                                </div>

                                {/* Mobile Accordion Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedCardIds((prev) => ({ ...prev, [exp.id]: !prev[exp.id] }))
                                  }
                                  className="sm:hidden w-full py-2 bg-[#161F28] hover:bg-[#1E2936] text-amber-400 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  {isExpanded ? "Qisqartirish 🔼" : "Batafsil ko'rish & boshqarish 🔽"}
                                </button>

                                {/* Collapsible Detailed Body (Expanded on click on mobile, always visible on desktop) */}
                                <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden sm:block'}`}>
                                  <p className="text-slate-400 text-xs line-clamp-3 m-0 leading-relaxed pt-1">
                                    {exp.description}
                                  </p>

                                  {/* Language Chips */}
                                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                    {(Array.isArray(exp.languages) ? exp.languages : ["O'zbekcha"]).map((lang, idx) => (
                                      <span key={idx} className="inline-flex items-center gap-1 bg-[#161F28] px-2.5 py-1 rounded-xl border border-slate-800 text-slate-300 text-xs">
                                        🌐 {lang}
                                      </span>
                                    ))}
                                  </div>

                                  {exp.meetingPointMapUrl && (
                                    <div className="text-xs">
                                      <a
                                        href={exp.meetingPointMapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[#0EA5E9] hover:text-cyan-300 underline font-medium"
                                      >
                                        <LinkOutlined /> Xaritada ko'rish 🗺️
                                      </a>
                                    </div>
                                  )}

                                  {/* Available Date Slots Section */}
                                  <div className="pt-3 border-t border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                                        <CalendarOutlined className="text-amber-400" /> Bo'sh Sanalar:
                                      </span>
                                      <Button
                                        type="link"
                                        size="small"
                                        onClick={() => {
                                          setSelectedExpIdForSlot(exp.id);
                                          slotForm.setFieldsValue({ experienceId: exp.id, maxCapacity: 10 });
                                          setIsSlotModalOpen(true);
                                        }}
                                        className="text-xs text-amber-400 p-0 font-medium hover:underline"
                                      >
                                        + Sana biriktirish
                                      </Button>
                                    </div>

                                    {exp.availableDates && exp.availableDates.length > 0 ? (
                                      <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto pr-1">
                                        {exp.availableDates.map((slot) => {
                                          const maxCap = (slot as any).maxCapacity || slot.slots || 10;
                                          const booked = (slot as any).bookedCount || 0;
                                          const remaining = Math.max(0, maxCap - booked);
                                          const isFull = remaining === 0;

                                          return (
                                            <Tag
                                              key={slot.id}
                                              className={`bg-[#161F28] border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-xl flex items-center gap-2 ${
                                                isFull ? 'opacity-60' : ''
                                              }`}
                                            >
                                              <span>{dayjs(slot.date).format('DD.MM.YYYY HH:mm')}</span>
                                              <Badge
                                                count={isFull ? "To'lgan" : `${remaining}/${maxCap} joy`}
                                                style={{ backgroundColor: isFull ? '#ef4444' : '#10b981' }}
                                              />
                                              <Popconfirm
                                                title="Sana o'chirilsinmi?"
                                                onConfirm={() => handleDeleteSlot(slot.id)}
                                                okText="Ha"
                                                cancelText="Yo'q"
                                              >
                                                <DeleteOutlined className="text-red-400 hover:text-red-300 cursor-pointer ml-1 text-xs" />
                                              </Popconfirm>
                                            </Tag>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 text-xs italic block">Bo'sh kunlar hali kiritilmagan</span>
                                    )}
                                  </div>

                                  {/* Card Action Buttons Bar */}
                                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={exp.isActive}
                                        onChange={() => handleToggleStatus(exp)}
                                        size="small"
                                      />
                                      <span className="text-xs text-slate-400 font-medium">
                                        {exp.isActive ? t('guide.status.active') : t('guide.status.inactive')}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Button
                                        type="default"
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={() => handleDuplicateExperience(exp)}
                                        className="bg-[#161F28] border-slate-800 text-amber-400 hover:border-amber-400 rounded-lg text-xs px-2 sm:px-3"
                                      >
                                        Nusxa
                                      </Button>
                                      <Button
                                        type="default"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => handleOpenModal(exp)}
                                        className="bg-[#161F28] border-slate-800 text-slate-200 hover:border-[#C2703D] rounded-lg text-xs px-2 sm:px-3"
                                      >
                                        Tahrirlash
                                      </Button>
                                      <Button
                                        type="default"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteExperience(exp)}
                                        className="bg-[#161F28] border-red-900/60 text-red-400 hover:border-red-500 rounded-lg text-xs px-2 sm:px-3"
                                      >
                                        O'chirish
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'bookings',
                  label: (
                    <span className="flex items-center gap-2 text-sm font-semibold py-1">
                      <BookOutlined className="text-indigo-400" /> {t('guide.tabs.bookings')} ({bookings.length})
                    </span>
                  ),
                  children: (
                    <div className="py-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold font-serif text-white m-0">{t('guide.tabs.bookings')}</h3>
                          <p className="text-xs text-slate-400 m-0 mt-1">{t('guide.subtitle')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Filter:</span>
                          <Select
                            value={bookingFilterStatus}
                            onChange={setBookingFilterStatus}
                            popupClassName="dark-select-dropdown"
                            className="custom-lang-select bg-[#0F1419] border-slate-800 rounded-xl text-xs w-40"
                            options={[
                              { value: 'ALL', label: t('common.all') },
                              { value: 'PENDING', label: t('booking.status_pending') },
                              { value: 'CONFIRMED', label: t('booking.status_confirmed') },
                              { value: 'COMPLETED', label: t('booking.status_completed') },
                              { value: 'CANCELLED', label: t('booking.status_cancelled') },
                            ]}
                          />
                        </div>
                      </div>

                      {filteredBookings.length === 0 ? (
                        <Empty description={<span className="text-slate-400">Buyurtmalar topilmadi</span>} className="py-12" />
                      ) : (
                        <div className="space-y-3">
                          {filteredBookings.map((b) => (
                            <div key={b.id} className="bg-[#0F1419] border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <Avatar
                                    size={48}
                                    src={b.user?.avatar}
                                    icon={<UserOutlined />}
                                    className="bg-amber-600 border border-amber-400 mt-1 flex-shrink-0"
                                  />
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-white text-base">{b.user?.name || 'Turist'}</span>
                                      <Tag className="bg-[#161F28] border-slate-800 text-slate-300 text-xs">
                                        Voucher: {b.voucherCode}
                                      </Tag>
                                    </div>
                                    <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap">
                                      <span className="text-amber-400 font-semibold">📍 {b.experience?.title}</span>
                                      <span>• 📅 {b.availableDate?.date ? dayjs(b.availableDate.date).format('DD.MM.YYYY HH:mm') : 'Sana belgilanmagan'}</span>
                                      <span>• 👥 {b.participantsCount} kishi</span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-3">
                                      <span>✉️ {b.user?.email}</span>
                                      {b.user?.phone && <span>📞 {b.user.phone}</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                                  <div className="text-right">
                                    <div className="text-lg font-black font-serif text-amber-400">
                                      ${Number(b.totalPrice).toLocaleString()} USD
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      ~{(Number(b.totalPrice) * USD_TO_UZS_RATE).toLocaleString()} UZS
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-400 font-semibold">{t('common.status')}:</span>
                                    <Select
                                      value={b.status}
                                      onChange={(status) => handleUpdateBookingStatus(b.id, status)}
                                      popupClassName="dark-select-dropdown"
                                      className="custom-lang-select bg-[#161F28] border-slate-700 rounded-lg text-xs w-36"
                                      options={[
                                        { value: 'PENDING', label: t('booking.status_pending') },
                                        { value: 'CONFIRMED', label: t('booking.status_confirmed') },
                                        { value: 'COMPLETED', label: t('booking.status_completed') },
                                        { value: 'CANCELLED', label: t('booking.status_cancelled') },
                                      ]}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'profile',
                  label: (
                    <span className="flex items-center gap-2 text-sm font-semibold py-1">
                      <UserOutlined className="text-amber-400" /> {t('guide.tabs.profile')}
                    </span>
                  ),
                  children: (
                    <div className="py-6 max-w-2xl">
                      <h3 className="text-xl font-bold font-serif text-white m-0 mb-4">{t('guide.profile.personal_info')}</h3>

                      {/* Commission Banner */}
                      <div className="bg-[#0F1419] border border-slate-800 p-5 rounded-2xl mb-6 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('guide.profile.your_commission_rate')}</div>
                          <div className="text-3xl font-black font-serif text-amber-400 mt-1">{profile?.commissionRate || 10}%</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{t('guide.profile.commission_desc')}</div>
                        </div>
                        <Tooltip title={t('guide.profile.commission_admin_only')}>
                          <Tag icon={<InfoCircleOutlined />} color="warning" className="rounded-lg text-xs py-1 px-2.5">
                            {t('guide.profile.read_only_admin')}
                          </Tag>
                        </Tooltip>
                      </div>

                      {/* Profile Card & Form (Always open and directly editable) */}
                      <div className="bg-[#161F28] p-5 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl transition-all">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <span className="text-sm font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                            <EditOutlined className="text-amber-400" /> {t('guide.profile.edit_profile')}
                          </span>
                        </div>

                        <Form
                          form={profileForm}
                          layout="vertical"
                          onFinish={handleUpdateProfileSubmit}
                          className="space-y-4"
                        >
                          <Form.Item
                            name="name"
                            label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.name')} *</span>}
                            rules={[{ required: true, message: t('guide.profile.name_required') }]}
                          >
                            <Input
                              prefix={<UserOutlined className="text-slate-500 mr-1" />}
                              placeholder={t('guide.profile.name_placeholder')}
                              className="bg-[#0F1419] border-slate-800 text-white rounded-xl focus:border-[#C2703D]"
                            />
                          </Form.Item>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="phone"
                                label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.phone')}</span>}
                              >
                                <Input
                                  prefix={<PhoneOutlined className="text-slate-500 mr-1" />}
                                  placeholder="+998 90 123 45 67"
                                  className="bg-[#0F1419] border-slate-800 text-white rounded-xl focus:border-[#C2703D]"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="telegramHandle"
                                label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.telegram')}</span>}
                              >
                                <Input
                                  prefix={<SendOutlined className="text-slate-500 mr-1" />}
                                  placeholder="@jasur_guide"
                                  className="bg-[#0F1419] border-slate-800 text-white rounded-xl focus:border-[#C2703D]"
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          {/* Avatar Upload */}
                          <Form.Item
                            name="avatar"
                            label={<span className="text-slate-300 text-xs font-semibold">{t('guide.profile.avatar')}</span>}
                          >
                            <div className="flex items-center gap-4 bg-[#0F1419] p-4 rounded-2xl border border-slate-800">
                              <Avatar
                                size={64}
                                src={uploadedAvatarUrl || profileForm.getFieldValue('avatar') || profile?.avatar || user?.avatar}
                                icon={<UserOutlined />}
                                className="bg-[#C2703D] border-2 border-amber-400 flex-shrink-0 shadow-md"
                              />
                              <div className="space-y-1.5 flex-1">
                                <Upload
                                  customRequest={async (options) => {
                                    const { file, onSuccess, onError } = options;
                                    try {
                                      const res = await uploadExperienceImages([file as File]);
                                      const urls = res.data?.urls || (res as any).urls;
                                      if (res.success && urls && urls.length > 0) {
                                        const avatarUrl = urls[0];
                                        setUploadedAvatarUrl(avatarUrl);
                                        profileForm.setFieldsValue({ avatar: avatarUrl });
                                        setProfile((prev) => (prev ? { ...prev, avatar: avatarUrl, avatarUrl: avatarUrl } : ({ avatar: avatarUrl, avatarUrl } as any)));
                                        if (user) updateUser({ ...user, avatar: avatarUrl });
                                        onSuccess?.(res, file);
                                        message.success(t('guide.profile.avatar_uploaded'));
                                      } else {
                                        throw new Error(res.message || t('guide.profile.upload_error'));
                                      }
                                    } catch (err: any) {
                                      onError?.(err);
                                      message.error(t('guide.profile.avatar_upload_failed'));
                                    }
                                  }}
                                  showUploadList={false}
                                  accept="image/*"
                                >
                                  <Button
                                    htmlType="button"
                                    icon={<UploadOutlined />}
                                    className="bg-[#161F28] border-slate-700 text-slate-200 hover:border-[#C2703D] rounded-lg text-xs"
                                  >
                                    {t('guide.profile.select_new_avatar')}
                                  </Button>
                                </Upload>
                                <div className="text-[11px] text-slate-400">
                                  {t('guide.profile.avatar_hint')}
                                </div>
                              </div>
                            </div>
                          </Form.Item>

                          <div className="pt-2 flex items-center gap-3">
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={submitting}
                              icon={<CheckOutlined />}
                              className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl px-6 h-10 transition-all cursor-pointer flex items-center gap-2"
                            >
                              {t('guide.profile.save_profile_btn')}
                            </Button>
                          </div>
                        </Form>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Spin>
        </Card>
      </div>

      {/* MODAL 1: YANGI / TAHRIRLASH EKSKURSIYA MODALI */}
      <Modal
        title={
          <span className="text-white flex items-center gap-2 text-xl font-bold font-serif">
            {editingExp ? (
              <>
                <EditOutlined className="text-amber-400" /> Ekskursiyani Tahrirlash
              </>
            ) : (
              <>
                <PlusOutlined className="text-[#C2703D]" /> Yangi Ekskursiya Qo'shish
              </>
            )}
          </span>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={720}
        style={{ top: 12, maxWidth: 'calc(100vw - 16px)', margin: '0 auto' }}
        className="dark-modal p-0 sm:p-4"
        styles={{
          body: { background: '#0F1419', padding: '16px sm:24px' },
          header: { background: '#0F1419' },
        }}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleSubmitTour}
          onValuesChange={(changed) => {
            if (changed.priceUsd !== undefined) {
              setModalPriceUsd(Number(changed.priceUsd) || 0);
            }
          }}
          className="space-y-4 pt-2"
        >
          {/* ===== PROFIL RASM YUKLASH (faqat yangi tur qo'shishda va haqiqiy custom avatar yo'q bo'lsa) ===== */}
          {!editingExp && !isRealAvatar(
            uploadedAvatarUrl || profile?.avatar || profile?.avatarUrl || user?.avatar,
            Boolean(uploadedAvatarUrl) || profile?.isCustomAvatarUploaded || user?.isCustomAvatarUploaded
          ) && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 space-y-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">📸</span>
                <div>
                  <div className="text-amber-300 text-xs font-bold uppercase tracking-wider">
                    {t('guide.profile.avatar')} — <span className="text-red-400">*</span> {t('guide.form.avatar_required_hint', 'Tur e\'lon qilishdan oldin profil rasmingizni yuklang')}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {t('guide.profile.avatar_hint')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar
                  size={48}
                  src={uploadedAvatarUrl || profile?.avatar || user?.avatar}
                  icon={<UserOutlined />}
                  className="bg-[#C2703D] border-2 border-amber-400 flex-shrink-0"
                />
                <Upload
                  customRequest={async (options) => {
                    const { file, onSuccess, onError } = options;
                    try {
                      const res = await uploadExperienceImages([file as File]);
                      const urls = res.data?.urls || (res as any).urls;
                      if (res.success && urls && urls.length > 0) {
                        const avatarUrl = urls[0];
                        setUploadedAvatarUrl(avatarUrl);
                        setProfile((prev) => (prev ? { ...prev, avatar: avatarUrl, avatarUrl: avatarUrl } : ({ avatar: avatarUrl, avatarUrl } as any)));
                        if (user) updateUser({ ...user, avatar: avatarUrl });
                        // Save avatar directly to guide profile backend
                        try {
                          await updateGuideProfile({ avatar: avatarUrl });
                        } catch {
                          // Avatar stored locally even if profile save fails
                        }
                        onSuccess?.(res, file);
                        message.success(t('guide.profile.avatar_uploaded'));
                      } else {
                        throw new Error(res.message || t('guide.profile.upload_error'));
                      }
                    } catch (err: any) {
                      onError?.(err);
                      message.error(t('guide.profile.avatar_upload_failed'));
                    }
                  }}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button
                    htmlType="button"
                    icon={<UploadOutlined />}
                    className="bg-[#161F28] border-amber-500/50 text-amber-300 hover:border-amber-400 rounded-xl text-xs font-semibold"
                  >
                    {t('guide.profile.select_new_avatar')}
                  </Button>
                </Upload>
                {(uploadedAvatarUrl) && (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <CheckOutlined /> {t('guide.profile.avatar_uploaded')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Multilingual Tabs Switcher */}

          <div className="flex items-center justify-between bg-[#161F28] p-2.5 rounded-xl border border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <GlobalOutlined className="text-amber-400" /> Tur Ma'lumotlari Tili
            </span>
            <div className="flex items-center gap-1 bg-[#0F1419] p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setFormLangTab('uz')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  formLangTab === 'uz' ? 'bg-[#C2703D] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇺🇿 UZ *
              </button>
              <button
                type="button"
                onClick={() => setFormLangTab('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  formLangTab === 'en' ? 'bg-[#C2703D] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                onClick={() => setFormLangTab('ru')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  formLangTab === 'ru' ? 'bg-[#C2703D] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇷🇺 RU
              </button>
            </div>
          </div>

          {/* Tour Title (UZ / EN / RU) */}
          {formLangTab === 'uz' && (
            <Form.Item
              name="title_uz"
              label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Tur Sarlavhasi (O'zbekcha) *</span>}
              rules={[{ required: true, min: 3, message: 'Tur sarlavhasi kamida 3 ta belgi bo\'lishi shart' }]}
            >
              <Input
                placeholder="Masalan: Samarqand Registon va Qadimiy Afrosiyob Sayohati"
                className="bg-[#161F28] border-slate-800 text-slate-200 text-sm rounded-xl py-2"
              />
            </Form.Item>
          )}

          {formLangTab === 'en' && (
            <Form.Item
              name="title_en"
              label={
                <span className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-between w-full">
                  <span>Tour Title (English)</span>
                  <span className="text-slate-400 font-normal lowercase text-[11px]">* bo'sh qolsa o'zbekchasi ko'rinadi</span>
                </span>
              }
            >
              <Input
                placeholder="Example: Samarkand Registan & Ancient Afrasiyab Tour"
                className="bg-[#161F28] border-slate-800 text-slate-200 text-sm rounded-xl py-2"
              />
            </Form.Item>
          )}

          {formLangTab === 'ru' && (
            <Form.Item
              name="title_ru"
              label={
                <span className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-between w-full">
                  <span>Название тура (Русский)</span>
                  <span className="text-slate-400 font-normal lowercase text-[11px]">* bo'sh qolsa o'zbekchasi ko'rinadi</span>
                </span>
              }
            >
              <Input
                placeholder="Пример: Тур по Самарканду: Регистан и древний Афрасиаб"
                className="bg-[#161F28] border-slate-800 text-slate-200 text-sm rounded-xl py-2"
              />
            </Form.Item>
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="city"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Shahar *</span>}
                rules={[{ required: true, message: 'Shaharni tanlang' }]}
              >
                <Select
                  popupClassName="dark-select-dropdown"
                  className="custom-lang-select bg-[#161F28] border-slate-800 rounded-xl text-xs"
                  options={[
                    { value: 'Samarqand', label: `🕌 ${t('cities.Samarqand')}` },
                    { value: 'Buxoro', label: `🏰 ${t('cities.Buxoro')}` },
                    { value: 'Toshkent', label: `🏙️ ${t('cities.Toshkent')}` },
                    { value: 'Xiva', label: `🏛️ ${t('cities.Xiva')}` },
                    { value: 'Shahrisabz', label: `⛰️ ${t('cities.Shahrisabz')}` },
                  ]}
                />
              </Form.Item>
            </Col>
            
            {/* Price (USD) with UZS auto-calculation */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="priceUsd"
                label={
                  <span className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-between w-full">
                    <span>Narxi (USD / kishi) *</span>
                  </span>
                }
                rules={[{ required: true, message: 'Narxni kiriting (0 dan katta)' }]}
              >
                <InputNumber
                  min={1}
                  step={1}
                  prefix={<DollarOutlined className="text-amber-400 mr-1" />}
                  addonAfter="USD"
                  className="w-full bg-[#161F28] border-slate-800 text-slate-200 rounded-xl"
                />
              </Form.Item>
              <div className="text-[11px] text-amber-400 font-semibold -mt-3 mb-2">
                💵 Ekivalent so'mda: ~{(modalPriceUsd * USD_TO_UZS_RATE).toLocaleString()} UZS
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Duration Hours */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="durationHours"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Davomiyligi (soat) *</span>}
                rules={[{ required: true, message: 'Davomiylikni kiriting' }]}
              >
                <InputNumber
                  min={0.5}
                  max={48}
                  step={0.5}
                  addonAfter="soat"
                  prefix={<ClockCircleOutlined className="text-[#C2703D] mr-1" />}
                  className="w-full bg-[#161F28] border-slate-800 text-slate-200 rounded-xl"
                />
              </Form.Item>
            </Col>

            {/* Meeting Point Text (UZ / EN / RU) */}
            <Col xs={24} sm={12}>
              {formLangTab === 'uz' && (
                <Form.Item
                  name="meetingPointText_uz"
                  label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Uchrashuv Joyi Tavsifi (O'zbekcha) *</span>}
                  rules={[{ required: true, min: 2, message: 'Uchrashuv joyi kamida 2 ta belgi bo\'lishi shart' }]}
                >
                  <Input
                    prefix={<EnvironmentOutlined className="text-emerald-400 mr-1" />}
                    placeholder="Masalan: Registon maydoni markaziy kassa oldi"
                    className="bg-[#161F28] border-slate-800 text-slate-200 text-xs rounded-xl py-2"
                  />
                </Form.Item>
              )}

              {formLangTab === 'en' && (
                <Form.Item
                  name="meetingPointText_en"
                  label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Meeting Point Description (English)</span>}
                >
                  <Input
                    prefix={<EnvironmentOutlined className="text-emerald-400 mr-1" />}
                    placeholder="Example: In front of main ticket office at Registan Square"
                    className="bg-[#161F28] border-slate-800 text-slate-200 text-xs rounded-xl py-2"
                  />
                </Form.Item>
              )}

              {formLangTab === 'ru' && (
                <Form.Item
                  name="meetingPointText_ru"
                  label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Описание места встречи (Русский)</span>}
                >
                  <Input
                    prefix={<EnvironmentOutlined className="text-emerald-400 mr-1" />}
                    placeholder="Пример: Перед центральной кассой на площади Регистан"
                    className="bg-[#161F28] border-slate-800 text-slate-200 text-xs rounded-xl py-2"
                  />
                </Form.Item>
              )}
            </Col>
          </Row>

          {/* Meeting Point Map URL */}
          <Form.Item
            name="meetingPointMapUrl"
            label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Xarita Havolasi (Yandex / Google Maps)</span>}
            rules={[
              {
                validator: (_, value) => {
                  if (!value || value.trim() === '') {
                    return Promise.resolve();
                  }
                  const val = value.trim();
                  const urlPattern = /^(https?:\/\/)?([\w.-]+)+[\w\-_~:/?#[\]@!$&'()*+,;=.]+/i;
                  const isHttp = /^https?:\/\//i.test(val);
                  if (!isHttp || !urlPattern.test(val)) {
                    return Promise.reject(
                      new Error("Iltimos, haqiqiy xarita havolasini kiriting (masalan: https://maps.google.com/...)")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              prefix={<LinkOutlined className="text-[#0EA5E9] mr-1" />}
              placeholder="https://yandex.uz/maps/... yoki https://maps.google.com/..."
              className="bg-[#161F28] border-slate-800 text-slate-200 text-xs rounded-xl py-2"
            />
          </Form.Item>

          {/* Languages */}
          <Form.Item
            name="languages"
            label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Ekskursiya Tillari *</span>}
            rules={[{ required: true, message: 'Kamida 1 ta til tanlang' }]}
          >
            <Select
              mode="multiple"
              placeholder="Tillarni tanlang"
              popupClassName="dark-select-dropdown"
              className="custom-lang-select bg-[#161F28] border-slate-800 rounded-xl text-xs"
              options={[
                { value: "O'zbekcha", label: "🇺🇿 O'zbekcha" },
                { value: 'Ruscha', label: '🇷🇺 Ruscha' },
                { value: 'Inglizcha', label: '🇬🇧 Inglizcha' },
                { value: 'Nemischa', label: '🇩🇪 Nemischa' },
                { value: 'Fransuzcha', label: '🇫🇷 Fransuzcha' },
                { value: 'Ispancha', label: '🇪🇸 Ispancha' },
              ]}
            />
          </Form.Item>

          {/* Description (UZ / EN / RU) */}
          {formLangTab === 'uz' && (
            <Form.Item
              name="description_uz"
              label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Batafsil Tavsif (O'zbekcha) *</span>}
              rules={[{ required: true, min: 3, message: 'Tavsif kamida 3 ta belgi bo\'lishi shart' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Ekskursiya dasturi, ko'riladigan diqqatga sazovor joylar..."
                className="bg-[#161F28] border-slate-800 text-slate-200 text-xs rounded-xl p-3"
              />
            </Form.Item>
          )}

          {formLangTab === 'en' && (
            <Form.Item
              name="description_en"
              label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Detailed Description (English)</span>}
            >
              <Input.TextArea
                rows={3}
                placeholder="Tour itinerary, sightseeings..."
                className="bg-[#161F28] border-slate-800 text-slate-200 text-xs rounded-xl p-3"
              />
            </Form.Item>
          )}

          {formLangTab === 'ru' && (
            <Form.Item
              name="description_ru"
              label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Подробное описание (Русский)</span>}
            >
              <Input.TextArea
                rows={3}
                placeholder="Программа экскурсии, достопримечательности..."
                className="bg-[#161F28] border-slate-800 text-slate-200 text-xs rounded-xl p-3"
              />
            </Form.Item>
          )}

          {/* Image Upload Component */}
          <Form.Item
            label={
              <span className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-between w-full">
                <span>Ekskursiya Rasmlari (1 - 5 ta rasm) *</span>
                <span className="text-slate-400 font-normal">{fileList.length}/5 rasm yuklandi</span>
              </span>
            }
          >
            <Upload.Dragger
              customRequest={handleCustomUpload}
              fileList={fileList}
              onRemove={handleRemoveImage}
              listType="picture-card"
              multiple
              maxCount={5}
              accept="image/*"
              className="bg-[#161F28] border-dashed border-slate-700 hover:border-[#C2703D] p-4 rounded-xl transition-colors"
            >
              <p className="ant-upload-drag-icon text-center mb-1">
                <UploadOutlined className="text-2xl text-amber-400" />
              </p>
              <p className="text-xs font-bold text-white m-0">Rasmlarni shu yerga sudrab tashlang yoki bosing</p>
              <p className="text-[11px] text-slate-400 m-0">JPG, PNG, WEBP (Max 5MB)</p>
            </Upload.Dragger>
          </Form.Item>

          {/* Modal Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button onClick={() => setIsCreateModalOpen(false)} className="rounded-xl border-slate-800 text-slate-300">
              Bekor qilish
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting || uploadingImages}
              className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl px-6"
            >
              {editingExp ? 'Tahrirni Saqlash' : 'Turni E\'lon Qilish'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL 2: BO'SH SANA VA SLOT QO'SHISH */}
      <Modal
        title={
          <span className="text-white flex items-center gap-2 text-xl font-bold font-serif">
            <CalendarOutlined className="text-amber-400" /> Bo'sh Sana va Vaqt Biriktirish
          </span>
        }
        open={isSlotModalOpen}
        onCancel={() => setIsSlotModalOpen(false)}
        footer={null}
        style={{ top: 12, maxWidth: 'calc(100vw - 16px)', margin: '0 auto' }}
        className="dark-modal"
        styles={{
          body: { background: '#0F1419', padding: '16px sm:24px' },
          header: { background: '#0F1419' },
        }}
      >
        <Form
          form={slotForm}
          layout="vertical"
          onFinish={handleAddSlot}
          initialValues={{
            experienceId: selectedExpIdForSlot || (experiences[0]?.id || ''),
            slots: 10,
            date: dayjs().add(1, 'day'),
            time: dayjs('10:00', 'HH:mm'),
          }}
          className="space-y-4 pt-2"
        >
          <Form.Item
            name="experienceId"
            label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Qaysi Ekskursiya Uchun? *</span>}
            rules={[{ required: true, message: 'Turni tanlang' }]}
          >
            <Select
              popupClassName="dark-select-dropdown"
              className="custom-lang-select bg-[#161F28] border-slate-800 rounded-xl text-xs"
              options={experiences.map((e) => ({
                value: e.id,
                label: `${e.city}: ${e.title}`,
              }))}
            />
          </Form.Item>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="date"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Sana *</span>}
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full bg-[#161F28] border-slate-800 text-slate-200 rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="time"
                label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Boshlanish Vaqti *</span>}
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" className="w-full bg-[#161F28] border-slate-800 text-slate-200 rounded-xl" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="maxCapacity"
            label={<span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Nechta Kishi Sig'adi? (Max Capacity) *</span>}
            rules={[{ required: true, message: 'Sig\'im miqdorini kiriting' }]}
          >
            <InputNumber min={1} max={100} className="w-full bg-[#161F28] border-slate-800 text-slate-200 rounded-xl" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button onClick={() => setIsSlotModalOpen(false)} className="rounded-xl border-slate-800 text-slate-300">
              Bekor qilish
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="bg-[#C2703D] hover:bg-[#A85B2D] border-none font-bold rounded-xl px-6"
            >
              Sanani Qo'shish
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Mobile Booking Details Bottom Sheet Drawer */}
      <Drawer
        title={
          <span className="text-white font-serif font-bold text-base flex items-center gap-2">
            📋 Buyurtma Tafsilotlari
          </span>
        }
        placement="bottom"
        onClose={() => setIsBookingSheetOpen(false)}
        open={isBookingSheetOpen}
        height="auto"
        className="dark-drawer"
        styles={{
          content: { background: '#0F1419', borderRadius: '24px 24px 0 0', borderTop: '1px solid rgba(217, 119, 6, 0.3)' },
          header: { background: '#0F1419', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
          body: { background: '#0F1419', padding: '20px' },
        }}
      >
        {selectedBookingForSheet && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[#161F28] p-3.5 rounded-2xl border border-slate-800">
              <Avatar
                size={44}
                src={selectedBookingForSheet.user?.avatar}
                icon={<UserOutlined />}
                className="bg-amber-600 border border-amber-400 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-base">{selectedBookingForSheet.user?.name || 'Turist'}</div>
                <div className="text-xs text-slate-400">{selectedBookingForSheet.user?.email}</div>
                {selectedBookingForSheet.user?.phone && (
                  <div className="text-xs text-amber-400 font-semibold mt-0.5">📞 {selectedBookingForSheet.user.phone}</div>
                )}
              </div>
            </div>

            <div className="bg-[#161F28] p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Ekskursiya:</span>
                <span className="font-bold text-amber-400 text-right truncate max-w-[200px]">{selectedBookingForSheet.experience?.title}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Voucher Kodu:</span>
                <Tag className="bg-[#0F1419] border-slate-800 text-slate-200 font-mono font-bold m-0">
                  {selectedBookingForSheet.voucherCode}
                </Tag>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Sana & Vaqt:</span>
                <span>{selectedBookingForSheet.availableDate?.date ? dayjs(selectedBookingForSheet.availableDate.date).format('DD.MM.YYYY HH:mm') : 'Noma\'lum'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Ishtirokchilar:</span>
                <span className="font-bold text-white">{selectedBookingForSheet.participantsCount} kishi</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-slate-800 text-sm">
                <span className="text-slate-400">Jami Summa:</span>
                <span className="font-black text-amber-400 font-serif">${Number(selectedBookingForSheet.totalPrice).toLocaleString()} USD</span>
              </div>
            </div>

            {/* Status Selector in Bottom Sheet */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Holatni O'zgartirish:</label>
              <Select
                value={selectedBookingForSheet.status}
                onChange={(status) => {
                  handleUpdateBookingStatus(selectedBookingForSheet.id, status);
                  setSelectedBookingForSheet((prev) => (prev ? { ...prev, status } : null));
                }}
                popupClassName="dark-select-dropdown"
                className="custom-lang-select bg-[#161F28] border-slate-700 rounded-xl text-xs w-full h-10"
                options={[
                  { value: 'PENDING', label: t('booking.status_pending') },
                  { value: 'CONFIRMED', label: t('booking.status_confirmed') },
                  { value: 'COMPLETED', label: t('booking.status_completed') },
                  { value: 'CANCELLED', label: t('booking.status_cancelled') },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-5 z-50 sm:hidden">
        {isFabOpen && (
          <div className="flex flex-col items-end gap-3 mb-3">
            <button
              type="button"
              onClick={() => {
                setIsFabOpen(false);
                handleOpenModal();
              }}
              className="flex items-center gap-2 bg-[#C2703D] text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold border border-amber-400/40 active:scale-95 transition-all cursor-pointer"
            >
              <PlusOutlined /> Yangi Ekskursiya
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFabOpen(false);
                setIsSlotModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#161F28] text-amber-400 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <CalendarOutlined /> Bo'sh Sana Qo'shish
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsFabOpen(!isFabOpen)}
          aria-label="Tezkor amallar"
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl transition-all duration-300 border-2 cursor-pointer ${
            isFabOpen
              ? 'bg-slate-800 border-slate-600 rotate-45'
              : 'bg-[#C2703D] border-amber-400/60 shadow-amber-950/50 hover:scale-105 active:scale-95'
          }`}
        >
          <PlusOutlined />
        </button>
      </div>
    </div>
  );
};

export default GuideDashboard;
