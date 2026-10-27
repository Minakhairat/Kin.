import React, { useState, useEffect } from 'react';
import {
  Tag,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Save,
  Check
} from 'lucide-react';
import { Language, PackageCMSItem, PromotionItem } from '../../types';
import { PODCAST_PACKAGES, REELS_PACKAGES } from '../../data/content';
import {
  subscribePackagesCMS,
  savePackageCMS,
  subscribePromotions,
  savePromotion,
  deletePromotion,
} from '../../services/pricingCmsService';

interface AdminPricingCmsTabProps {
  lang: Language;
}

export const AdminPricingCmsTab: React.FC<AdminPricingCmsTabProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [cmsPackages, setCmsPackages] = useState<PackageCMSItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'packages' | 'promotions'>('packages');

  // New Promotion Form state
  const [promoTitleAr, setPromoTitleAr] = useState('');
  const [promoTitleEn, setPromoTitleEn] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [bannerTextAr, setBannerTextAr] = useState('');
  const [applicableCategory, setApplicableCategory] = useState<'all' | 'podcasts' | 'reels'>('all');
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Package Price editing state
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newOriginalPrice, setNewOriginalPrice] = useState<number>(0);
  const [pkgSaveSuccess, setPkgSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubPkg = subscribePackagesCMS(setCmsPackages);
    const unsubPromo = subscribePromotions(setPromotions);
    return () => {
      unsubPkg();
      unsubPromo();
    };
  }, []);

  const allStaticPackages = [...PODCAST_PACKAGES, ...REELS_PACKAGES];

  const handleUpdatePrice = async (pkgId: string) => {
    const staticPkg = allStaticPackages.find((p) => p.id === pkgId);
    if (!staticPkg) return;

    try {
      const payload: PackageCMSItem = {
        id: pkgId,
        category: staticPkg.category,
        nameAr: staticPkg.name,
        nameEn: staticPkg.name,
        priceEGP: newPrice,
        originalPriceEGP: newOriginalPrice > 0 ? newOriginalPrice : undefined,
        isActive: true,
      };

      await savePackageCMS(payload);
      setEditingPkgId(null);
      setPkgSaveSuccess(isAr ? `تم تحديث سعر باقة ${staticPkg.name} بنجاح!` : `Updated ${staticPkg.name} rate!`);
      setTimeout(() => setPkgSaveSuccess(null), 3000);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitleAr.trim() || discountPercent <= 0) return;

    setIsSavingPromo(true);
    try {
      await savePromotion({
        titleAr: promoTitleAr.trim(),
        titleEn: promoTitleEn.trim(),
        code: promoCode.trim().toUpperCase() || undefined,
        discountPercent: Number(discountPercent),
        startDate,
        endDate,
        bannerTextAr: bannerTextAr.trim() || undefined,
        applicableCategory,
        isActive: true,
      });

      setPromoTitleAr('');
      setPromoTitleEn('');
      setPromoCode('');
      setBannerTextAr('');
      setPromoSuccess(isAr ? 'تم إطلاق العرض الترويجي وتفعيله في الموقع!' : 'Promotion launched successfully!');
      setTimeout(() => setPromoSuccess(null), 3000);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsSavingPromo(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm(isAr ? 'حذف هذا العرض؟' : 'Delete this promotion?')) return;
    try {
      await deletePromotion(id);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 font-brand">
            <Tag className="w-5 h-5 text-[#C82626]" />
            <span>{isAr ? 'إدارة الأسعار والعروض الترويجية المحددة' : 'Dynamic Pricing & Promotions CMS'}</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isAr
              ? 'تعديل أسعار باقات البودكاست والريلز مباشرة، وإنشاء عروض تخفيض لفترات زمنية محددة تظهر لزوار الموقع.'
              : 'Modify live package rates and schedule limited-time discount campaigns.'}
          </p>
        </div>

        {/* Sub-tabs switcher */}
        <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('packages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'packages'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'أسعار الباقات' : 'Package Rates'}
          </button>
          <button
            onClick={() => setActiveSubTab('promotions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'promotions'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {isAr ? `العروض المؤقتة (${promotions.length})` : `Limited Deals (${promotions.length})`}
          </button>
        </div>
      </div>

      {pkgSaveSuccess && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{pkgSaveSuccess}</span>
        </div>
      )}

      {/* --- SUBTAB 1: PACKAGES PRICING CMS --- */}
      {activeSubTab === 'packages' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-bold uppercase">
                  <th className="py-3 text-start">{isAr ? 'الباقة' : 'Package'}</th>
                  <th className="py-3 text-start">{isAr ? 'القسم' : 'Category'}</th>
                  <th className="py-3 text-start">{isAr ? 'السعر الافتراضي' : 'Default Rate'}</th>
                  <th className="py-3 text-start">{isAr ? 'السعر النشط في الموقع' : 'Active Rate (EGP)'}</th>
                  <th className="py-3 text-end">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {allStaticPackages.map((pkg) => {
                  const cmsMatch = cmsPackages.find((p) => p.id === pkg.id);
                  const isEditing = editingPkgId === pkg.id;
                  const activePrice = cmsMatch ? cmsMatch.priceEGP : pkg.price;

                  return (
                    <tr key={pkg.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40">
                      <td className="py-3.5">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white block">
                          {pkg.name}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {isAr ? pkg.deliverablesAr : pkg.deliverablesEn}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold">
                          {pkg.category === 'podcasts' ? (isAr ? 'بودكاست' : 'Podcast') : (isAr ? 'ريلز' : 'Reels')}
                        </span>
                      </td>

                      <td className="py-3.5 font-mono text-neutral-500">
                        {pkg.price.toLocaleString()} EGP
                      </td>

                      <td className="py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(Number(e.target.value))}
                              className="w-24 px-2 py-1 rounded bg-white dark:bg-neutral-900 border border-[#C82626] font-mono font-bold text-sm"
                            />
                            <span className="text-neutral-400">EGP</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                              {activePrice.toLocaleString()} EGP
                            </span>
                            {cmsMatch && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">
                                {isAr ? 'معدل ديناميكياً' : 'CMS'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 text-end">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdatePrice(pkg.id)}
                              className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-1 shadow cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>{isAr ? 'حفظ' : 'Save'}</span>
                            </button>
                            <button
                              onClick={() => setEditingPkgId(null)}
                              className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                            >
                              {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPkgId(pkg.id);
                              setNewPrice(activePrice);
                              setNewOriginalPrice(cmsMatch?.originalPriceEGP || pkg.price);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isAr ? 'تعديل السعر' : 'Edit Price'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: PROMOTIONS & DEALS --- */}
      {activeSubTab === 'promotions' && (
        <div className="space-y-8">
          
          {/* Create Promotion Form */}
          <form onSubmit={handleCreatePromo} className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C82626]" />
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-brand">
                {isAr ? 'إطلاق عرض تخفيض جديد لفترة محددة' : 'Launch New Limited-Time Promotion'}
              </h4>
            </div>

            {promoSuccess && (
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{promoSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'عنوان العرض (عربي) *' : 'Offer Title (Arabic) *'}
                </label>
                <input
                  type="text"
                  required
                  value={promoTitleAr}
                  onChange={(e) => setPromoTitleAr(e.target.value)}
                  placeholder={isAr ? 'مثال: عرض صيف 2026' : 'e.g. Summer Promo'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'نسبة الخصم (%) *' : 'Discount Percent (%) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'كود الكوبون (اختياري)' : 'Coupon Code (Optional)'}
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="KIN2026"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'يطبق على:' : 'Applies to:'}
                </label>
                <select
                  value={applicableCategory}
                  onChange={(e) => setApplicableCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-semibold"
                >
                  <option value="all">{isAr ? 'جميع الباقات' : 'All Packages'}</option>
                  <option value="podcasts">{isAr ? 'باقات البودكاست فقط' : 'Podcasts Only'}</option>
                  <option value="reels">{isAr ? 'باقات الريلز فقط' : 'Reels Only'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'تاريخ البداية:' : 'Start Date:'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'تاريخ النهاية:' : 'End Date:'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'رسالة الشريط الإعلاني أعلى الموقع:' : 'Top Banner Message:'}
                </label>
                <input
                  type="text"
                  value={bannerTextAr}
                  onChange={(e) => setBannerTextAr(e.target.value)}
                  placeholder={isAr ? 'احجز جلستك الآن واستمتع بخصم خاص لفترة محدودة' : 'Book your session now and enjoy our limited offer'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPromo}
                className="px-5 py-2.5 rounded-xl bg-[#C82626] hover:bg-[#a81e1e] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'تفعيل وإطلاق العرض' : 'Launch Promotion'}</span>
              </button>
            </div>
          </form>

          {/* Active Promotions List */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-3">
              {isAr ? 'العروض المسجلة في الاستوديو' : 'Existing Promotions'}
            </h4>

            {promotions.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-900/30 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                {isAr ? 'لا توجد عروض ترويجية نشطة حالياً. قم بإضافة عرض جديد من الأعلى.' : 'No promotions active. Create one above.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promotions.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {pr.titleAr}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[11px] font-bold">
                          {pr.discountPercent}% OFF
                        </span>
                        {pr.code && (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                            {pr.code}
                          </span>
                        )}
                      </div>

                      {pr.bannerTextAr && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {pr.bannerTextAr}
                        </p>
                      )}

                      <div className="text-[11px] text-neutral-400 flex items-center gap-2 pt-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{pr.startDate} → {pr.endDate}</span>
                        <span>•</span>
                        <span>{pr.applicableCategory}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePromo(pr.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
