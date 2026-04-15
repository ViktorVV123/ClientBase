import React, { useState, useEffect, useRef } from 'react';
import { fetchProfile, updateProfile, uploadLogo, deleteLogo } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import * as styles from './BrandingSettings.module.scss';

interface BrandingSettingsProps { isPro: boolean; onUpgrade?: () => void; }

const BASIC_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const PRO_GRADIENTS = [
    { id: 'sunset',    value: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { id: 'ocean',     value: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { id: 'aurora',    value: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
    { id: 'emerald',   value: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { id: 'fire',      value: 'linear-gradient(135deg, #f12711, #f5af19)' },
    { id: 'midnight',  value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
    { id: 'candy',     value: 'linear-gradient(135deg, #fc5c7d, #6a82fb)' },
    { id: 'forest',    value: 'linear-gradient(135deg, #134e5e, #71b280)' },
    { id: 'royal',     value: 'linear-gradient(135deg, #141e30, #243b55)' },
    { id: 'neon',      value: 'linear-gradient(135deg, #b721ff, #21d4fd)' },
];

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ isPro, onUpgrade }) => {
    const { t, locale } = useI18n();
    const [companyName, setCompanyName] = useState('');
    const [brandColor, setBrandColor] = useState('#6366f1');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isGradient = brandColor.startsWith('linear-gradient');

    useEffect(() => { if (isPro) loadBranding(); }, [isPro]);

    const loadBranding = async () => {
        try { const profile = await fetchProfile(); if (profile) { setCompanyName(profile.company_name || ''); setBrandColor(profile.brand_color || '#6366f1'); setLogoUrl(profile.logo_url || null); } }
        catch (err) { console.error(err); }
    };
    const handleSave = async () => {
        setSaving(true);
        try { await updateProfile({ company_name: companyName, brand_color: brandColor }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
        catch (err) { console.error(err); } finally { setSaving(false); }
    };
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return; setUploading(true);
        try { setLogoUrl(await uploadLogo(file)); } catch (err) { console.error(err); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    const handleDeleteLogo = async () => { try { await deleteLogo(); setLogoUrl(null); } catch (err) { console.error(err); } };

    const l = {
        title: locale === 'ru' ? '🎨 Брендинг портала' : '🎨 Portal Branding',
        subtitlePro: locale === 'ru' ? 'Настройте внешний вид портала для ваших клиентов' : 'Customize the look of your client portal',
        subtitleFree: locale === 'ru' ? 'Ваш портал будет выглядеть как собственный продукт — с логотипом, градиентами и названием' : 'Your portal will look like your own product — with logo, gradients and company name',
        logo: locale === 'ru' ? 'Логотип' : 'Logo',
        uploadLogo: locale === 'ru' ? '📁 Загрузить логотип' : '📁 Upload Logo',
        uploading: locale === 'ru' ? '⏳ Загрузка...' : '⏳ Uploading...',
        logoHint: locale === 'ru' ? 'PNG, JPG или SVG, до 2 МБ' : 'PNG, JPG or SVG, up to 2 MB',
        replace: locale === 'ru' ? 'Заменить' : 'Replace',
        remove: locale === 'ru' ? 'Удалить' : 'Remove',
        brandColor: locale === 'ru' ? 'Цвет бренда' : 'Brand Color',
        customColor: locale === 'ru' ? 'Свой цвет' : 'Custom color',
        preview: locale === 'ru' ? 'Предпросмотр шапки портала:' : 'Portal header preview:',
        lockTitle: locale === 'ru' ? 'Доступно на Pro' : 'Available on Pro',
        lockText: locale === 'ru' ? 'Логотип, фирменные градиенты и название компании — клиенты увидят ваш бренд, а не ClientBase' : 'Logo, gradients and company name — clients see your brand, not ClientBase',
        unlock: locale === 'ru' ? '⭐ Разблокировать за 4 $/мес' : '⭐ Unlock for $4/mo',
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>{l.title}{!isPro && <span className={styles.proBadge}>PRO</span>}</div>
                <div className={styles.subtitle}>{isPro ? l.subtitlePro : l.subtitleFree}</div>
            </div>
            <div className={styles.contentArea}>
                {!isPro && (
                    <div className={styles.lockOverlay}>
                        <div className={styles.lockCard}>
                            <div className={styles.lockIcon}>🔒</div>
                            <div className={styles.lockTitle}>{l.lockTitle}</div>
                            <div className={styles.lockText}>{l.lockText}</div>
                            <button className={styles.unlockBtn} onClick={onUpgrade}>{l.unlock}</button>
                        </div>
                    </div>
                )}
                <div className={!isPro ? styles.blurred : undefined}>
                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <div className={styles.label}>{l.logo}</div>
                            {isPro && logoUrl ? (
                                <div className={styles.logoPreview}>
                                    <img src={logoUrl} alt="Logo" className={styles.logoImg} />
                                    <div className={styles.logoActions}>
                                        <button className={styles.changeLogo} onClick={() => fileInputRef.current?.click()}>{l.replace}</button>
                                        <button className={styles.removeLogo} onClick={handleDeleteLogo}>{l.remove}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.logoPlaceholder}>
                                    <span className={styles.logoPlaceholderIcon}>📁</span>
                                    <span>{isPro ? l.uploadLogo : t.logoPlaceholder}</span>
                                </div>
                            )}
                            {isPro && !logoUrl && (
                                <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? l.uploading : l.uploadLogo}
                                </button>
                            )}
                            {isPro && <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={handleLogoUpload} />}
                            <div className={styles.hint}>{l.logoHint}</div>
                        </div>
                        <div className={styles.card}>
                            <div className={styles.label}>{t.companyName}</div>
                            <input className={styles.input} value={isPro ? companyName : 'Design Studio'} onChange={(e) => isPro && setCompanyName(e.target.value)} readOnly={!isPro} tabIndex={isPro ? 0 : -1} />
                            <div className={styles.hint}>{t.shownInPortal}</div>
                        </div>
                    </div>
                    <div className={styles.card} style={{ marginBottom: 16 }}>
                        <div className={styles.label}>{l.brandColor}</div>
                        <div className={styles.colorRow}>
                            {BASIC_COLORS.map((c) => <button key={c} className={`${styles.colorDot} ${brandColor === c ? styles.colorDotActive : ''}`} style={{ background: c }} onClick={() => isPro && setBrandColor(c)} tabIndex={isPro ? 0 : -1} />)}
                            {isPro && <input type="color" value={isGradient ? '#6366f1' : brandColor} onChange={(e) => setBrandColor(e.target.value)} className={styles.colorPicker} title={l.customColor} />}
                        </div>
                    </div>
                    <div className={styles.card} style={{ marginBottom: 20 }}>
                        <div className={styles.label}>{t.gradients}<span className={styles.proTag}>PRO</span></div>
                        <div className={styles.gradientGrid}>
                            {PRO_GRADIENTS.map((g) => <button key={g.id} className={`${styles.gradientSwatch} ${brandColor === g.value ? styles.gradientSwatchActive : ''}`} style={{ background: g.value }} onClick={() => isPro && setBrandColor(g.value)} tabIndex={isPro ? 0 : -1} title={g.id} />)}
                        </div>
                    </div>
                    <div className={styles.previewLabel2}>{l.preview}</div>
                    <div className={styles.previewBar} style={{ background: isPro ? brandColor : 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                        {isPro && logoUrl && <img src={logoUrl} alt="" className={styles.previewLogo} />}
                        {!isPro && <div className={styles.previewLogoMock}>LOGO</div>}
                        <span className={styles.previewText}>{isPro ? (companyName || t.companyName) : 'Design Studio'}</span>
                    </div>
                    {isPro && (
                        <div className={styles.saveRow}>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? t.saving : saved ? `✅ ${t.saved}` : `💾 ${t.save}`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
