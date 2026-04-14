import React, { useState, useEffect, useRef } from 'react';
import { fetchProfile, updateProfile, uploadLogo, deleteLogo } from '@/lib/api';
import { AVATAR_COLORS } from '@/assets/data/data';
import * as styles from './BrandingSettings.module.scss';

interface BrandingSettingsProps {
    isPro: boolean;
    onUpgrade?: () => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ isPro, onUpgrade }) => {
    const [companyName, setCompanyName] = useState('');
    const [brandColor, setBrandColor] = useState('#6366f1');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isPro) loadBranding();
    }, [isPro]);

    const loadBranding = async () => {
        try {
            const profile = await fetchProfile();
            if (profile) {
                setCompanyName(profile.company_name || '');
                setBrandColor(profile.brand_color || '#6366f1');
                setLogoUrl(profile.logo_url || null);
            }
        } catch (err) {
            console.error('Failed to load branding:', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({ company_name: companyName, brand_color: brandColor });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save branding:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadLogo(file);
            setLogoUrl(url);
        } catch (err) {
            console.error('Failed to upload logo:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteLogo = async () => {
        try {
            await deleteLogo();
            setLogoUrl(null);
        } catch (err) {
            console.error('Failed to delete logo:', err);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.sectionHeader}>
                <div className={styles.title}>
                    🎨 Брендинг портала
                    {!isPro && <span className={styles.proBadge}>PRO</span>}
                </div>
                <div className={styles.subtitle}>
                    {isPro
                        ? 'Настройте внешний вид портала для ваших клиентов'
                        : 'Ваш портал будет выглядеть как собственный продукт — с логотипом, цветами и названием'}
                </div>
            </div>

            <div className={styles.contentArea}>
                {/* Lock overlay для Free — поверх заблюренного контента */}
                {!isPro && (
                    <div className={styles.lockOverlay}>
                        <div className={styles.lockCard}>
                            <div className={styles.lockIcon}>🔒</div>
                            <div className={styles.lockTitle}>Доступно на Pro</div>
                            <div className={styles.lockText}>
                                Логотип, фирменный цвет и название компании —
                                клиенты увидят ваш бренд, а не ClientBase
                            </div>
                            <button className={styles.unlockBtn} onClick={onUpgrade}>
                                ⭐ Разблокировать за 299 ₽/мес
                            </button>
                        </div>
                    </div>
                )}

                {/* Контент — для Free заблюрен, для Pro рабочий */}
                <div className={!isPro ? styles.blurred : undefined}>
                    <div className={styles.grid}>
                        {/* Логотип */}
                        <div className={styles.card}>
                            <div className={styles.label}>Логотип</div>
                            {isPro && logoUrl ? (
                                <div className={styles.logoPreview}>
                                    <img src={logoUrl} alt="Logo" className={styles.logoImg} />
                                    <div className={styles.logoActions}>
                                        <button className={styles.changeLogo} onClick={() => fileInputRef.current?.click()}>
                                            Заменить
                                        </button>
                                        <button className={styles.removeLogo} onClick={handleDeleteLogo}>
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.logoPlaceholder}>
                                    <span className={styles.logoPlaceholderIcon}>📁</span>
                                    <span>{isPro ? 'Загрузите логотип' : 'Ваш логотип здесь'}</span>
                                </div>
                            )}
                            {isPro && !logoUrl && (
                                <button
                                    className={styles.uploadBtn}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? '⏳ Загрузка...' : '📁 Загрузить логотип'}
                                </button>
                            )}
                            {isPro && (
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={handleLogoUpload}
                                />
                            )}
                            <div className={styles.hint}>PNG, JPG или SVG, до 2 МБ</div>
                        </div>

                        {/* Название */}
                        <div className={styles.card}>
                            <div className={styles.label}>Название компании</div>
                            <input
                                className={styles.input}
                                value={isPro ? companyName : 'Design Studio'}
                                onChange={(e) => isPro && setCompanyName(e.target.value)}
                                placeholder="Моя компания"
                                readOnly={!isPro}
                                tabIndex={isPro ? 0 : -1}
                            />
                            <div className={styles.hint}>Отображается в шапке портала</div>
                        </div>

                        {/* Цвет */}
                        <div className={styles.card}>
                            <div className={styles.label}>Цвет бренда</div>
                            <div className={styles.colorRow}>
                                {AVATAR_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        className={`${styles.colorDot} ${brandColor === c ? styles.colorDotActive : ''}`}
                                        style={{ background: c }}
                                        onClick={() => isPro && setBrandColor(c)}
                                        tabIndex={isPro ? 0 : -1}
                                    />
                                ))}
                                {isPro && (
                                    <input
                                        type="color"
                                        value={brandColor}
                                        onChange={(e) => setBrandColor(e.target.value)}
                                        className={styles.colorPicker}
                                        title="Свой цвет"
                                    />
                                )}
                            </div>
                            <div className={styles.hint}>Шапка портала и кнопки</div>
                        </div>
                    </div>

                    {/* Preview bar */}
                    <div className={styles.previewLabel2}>Предпросмотр шапки портала:</div>
                    <div className={styles.previewBar} style={{ background: isPro ? brandColor : '#6366f1' }}>
                        {isPro && logoUrl && <img src={logoUrl} alt="" className={styles.previewLogo} />}
                        {!isPro && <div className={styles.previewLogoMock}>LOGO</div>}
                        <span className={styles.previewText}>
                            {isPro ? (companyName || 'Название компании') : 'Design Studio'}
                        </span>
                    </div>

                    {/* Save */}
                    {isPro && (
                        <div className={styles.saveRow}>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Сохранение...' : saved ? '✅ Сохранено!' : '💾 Сохранить'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
