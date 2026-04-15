import React, { useState, useEffect } from 'react';
import { fetchProfile, updateProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Plan } from '@/lib/subscription';
import * as styles from './SettingsPage.module.scss';

interface SettingsPageProps {
    userEmail?: string;
    plan: Plan;
    onUpgrade: () => void;
}

interface ProfileData {
    full_name: string;
    company_name: string;
    business_name: string;
    inn: string;
    bank_name: string;
    bank_account: string;
    bank_bik: string;
    corr_account: string;
    currency: string;
    default_rate: number | null;
    locale: string;
}

const EMPTY_PROFILE: ProfileData = {
    full_name: '',
    company_name: '',
    business_name: '',
    inn: '',
    bank_name: '',
    bank_account: '',
    bank_bik: '',
    corr_account: '',
    currency: '₽',
    default_rate: null,
    locale: 'ru',
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ userEmail, plan, onUpgrade }) => {
    const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);

    // Section collapse state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        profile: true,
        billing: false,
        rates: false,
        subscription: false,
        password: false,
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await fetchProfile();
            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    company_name: data.company_name || '',
                    business_name: data.business_name || '',
                    inn: data.inn || '',
                    bank_name: data.bank_name || '',
                    bank_account: data.bank_account || '',
                    bank_bik: data.bank_bik || '',
                    corr_account: data.corr_account || '',
                    currency: data.currency || '₽',
                    default_rate: data.default_rate ?? null,
                    locale: data.locale || 'ru',
                });
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (key: string) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async (section: string, data: Partial<ProfileData>) => {
        setSaving(section);
        setSaved(null);
        try {
            await updateProfile(data);
            setSaved(section);
            setTimeout(() => setSaved(null), 2000);
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(null);
        }
    };

    const handlePasswordReset = async () => {
        if (!userEmail) return;
        try {
            await supabase.auth.resetPasswordForEmail(userEmail, {
                redirectTo: `${window.location.origin}`,
            });
            alert('Письмо для сброса пароля отправлено на ' + userEmail);
        } catch (err) {
            console.error('Failed to send reset:', err);
        }
    };

    const update = (key: keyof ProfileData, value: string | number | null) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className={styles.settings}>
                <h1 className={styles.title}>Настройки</h1>
                <div style={{ color: 'var(--text-muted)', padding: 20 }}>Загрузка...</div>
            </div>
        );
    }

    return (
        <div className={styles.settings}>
            <h1 className={styles.title}>Настройки</h1>

            {/* ─── Profile ────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('profile')}>
                    <span className={styles.sectionIcon}>👤</span>
                    <span className={styles.sectionTitle}>Профиль</span>
                    <span className={openSections.profile ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.profile && (
                    <div className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Имя</label>
                                <input
                                    className={styles.input}
                                    value={profile.full_name}
                                    onChange={(e) => update('full_name', e.target.value)}
                                    placeholder="Виктор Власюк"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Email</label>
                                <input
                                    className={styles.input}
                                    value={userEmail || ''}
                                    disabled
                                    style={{ opacity: 0.5 }}
                                />
                                <span className={styles.hint}>Изменить email нельзя</span>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Название компании / бренда</label>
                            <input
                                className={styles.input}
                                value={profile.company_name}
                                onChange={(e) => update('company_name', e.target.value)}
                                placeholder="Моя Студия"
                            />
                            <span className={styles.hint}>Отображается в портале клиента</span>
                        </div>
                        <div className={styles.actions}>
                            <button
                                className={styles.saveBtn}
                                disabled={saving === 'profile'}
                                onClick={() => handleSave('profile', {
                                    full_name: profile.full_name,
                                    company_name: profile.company_name,
                                })}
                            >
                                {saving === 'profile' ? 'Сохраняю…' : 'Сохранить'}
                            </button>
                            {saved === 'profile' && <span className={styles.savedMsg}>✓ Сохранено</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Billing / Реквизиты ────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('billing')}>
                    <span className={styles.sectionIcon}>🏦</span>
                    <span className={styles.sectionTitle}>Реквизиты для счетов (в разработке)</span>
                    <span className={openSections.billing ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.billing && (
                    <div className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Наименование ИП / Организации</label>
                                <input
                                    className={styles.input}
                                    value={profile.business_name}
                                    onChange={(e) => update('business_name', e.target.value)}
                                    placeholder="ИП Иванов И.И."
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>ИНН</label>
                                <input
                                    className={styles.input}
                                    value={profile.inn}
                                    onChange={(e) => update('inn', e.target.value)}
                                    placeholder="1234567890"
                                />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Банк</label>
                                <input
                                    className={styles.input}
                                    value={profile.bank_name}
                                    onChange={(e) => update('bank_name', e.target.value)}
                                    placeholder="Тинькофф Банк"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>БИК</label>
                                <input
                                    className={styles.input}
                                    value={profile.bank_bik}
                                    onChange={(e) => update('bank_bik', e.target.value)}
                                    placeholder="044525974"
                                />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Расчётный счёт</label>
                                <input
                                    className={styles.input}
                                    value={profile.bank_account}
                                    onChange={(e) => update('bank_account', e.target.value)}
                                    placeholder="40802810000000000000"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Корр. счёт</label>
                                <input
                                    className={styles.input}
                                    value={profile.corr_account}
                                    onChange={(e) => update('corr_account', e.target.value)}
                                    placeholder="30101810000000000000"
                                />
                            </div>
                        </div>
                        <span className={styles.hint}>Эти данные будут подставляться в PDF-счета для клиентов</span>
                        <div className={styles.actions}>
                            <button
                                className={styles.saveBtn}
                                disabled={saving === 'billing'}
                                onClick={() => handleSave('billing', {
                                    business_name: profile.business_name,
                                    inn: profile.inn,
                                    bank_name: profile.bank_name,
                                    bank_account: profile.bank_account,
                                    bank_bik: profile.bank_bik,
                                    corr_account: profile.corr_account,
                                })}
                            >
                                {saving === 'billing' ? 'Сохраняю…' : 'Сохранить'}
                            </button>
                            {saved === 'billing' && <span className={styles.savedMsg}>✓ Сохранено</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Rates & Currency ────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('rates')}>
                    <span className={styles.sectionIcon}>💰</span>
                    <span className={styles.sectionTitle}>Валюта и ставка (В разработке)</span>
                    <span className={openSections.rates ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.rates && (
                    <div className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Валюта</label>
                                <select
                                    className={styles.select}
                                    value={profile.currency}
                                    onChange={(e) => update('currency', e.target.value)}
                                >
                                    <option value="₽">₽ — Рубли</option>
                                    <option value="$">$ — Доллары</option>
                                    <option value="€">€ — Евро</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Ставка по умолчанию ({profile.currency}/ч)</label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    min="0"
                                    value={profile.default_rate ?? ''}
                                    onChange={(e) => update('default_rate', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="2000"
                                />
                                <span className={styles.hint}>Подставляется при трекинге времени</span>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button
                                className={styles.saveBtn}
                                disabled={saving === 'rates'}
                                onClick={() => handleSave('rates', {
                                    currency: profile.currency,
                                    default_rate: profile.default_rate,
                                })}
                            >
                                {saving === 'rates' ? 'Сохраняю…' : 'Сохранить'}
                            </button>
                            {saved === 'rates' && <span className={styles.savedMsg}>✓ Сохранено</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Subscription ────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('subscription')}>
                    <span className={styles.sectionIcon}>⭐</span>
                    <span className={styles.sectionTitle}>Подписка</span>
                    <span className={openSections.subscription ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.subscription && (
                    <div className={styles.form}>
                        <div className={styles.planCard}>
                            <span className={plan === 'pro' ? styles.planPro : styles.planFree}>
                                {plan === 'pro' ? '⭐ Pro' : 'Free'}
                            </span>
                            <div className={styles.planInfo}>
                                <div className={styles.planName}>
                                    {plan === 'pro' ? 'Pro Plan' : 'Бесплатный план'}
                                </div>
                                <div className={styles.planDesc}>
                                    {plan === 'pro'
                                        ? 'Безлимит клиентов, брендинг, все функции'
                                        : '1 клиент, базовые функции'}
                                </div>
                            </div>
                            {plan !== 'pro' && (
                                <button className={styles.upgradeBtn} onClick={onUpgrade}>
                                    Перейти на Pro
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Password ────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('password')}>
                    <span className={styles.sectionIcon}>🔒</span>
                    <span className={styles.sectionTitle}>Безопасность</span>
                    <span className={openSections.password ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.password && (
                    <div className={styles.form}>
                        <div className={styles.passwordRow}>
                            <span className={styles.passwordNote}>
                                Для смены пароля мы отправим ссылку на ваш email
                            </span>
                            <button className={styles.passwordBtn} onClick={handlePasswordReset}>
                                Сбросить пароль
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
