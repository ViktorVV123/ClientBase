import React, { useState, useEffect } from 'react';
import { fetchProfile, updateProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Plan } from '@/lib/subscription';
import { useI18n } from '@/lib/i18n';
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
    const { t } = useI18n();
    const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        profile: true,
        billing: false,
        rates: false,
        subscription: false,
        password: false,
    });

    useEffect(() => { loadProfile(); }, []);

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
            alert(t.passwordResetSent + userEmail);
        } catch (err) {
            console.error('Failed to send reset:', err);
        }
    };

    const update = (key: keyof ProfileData, value: string | number | null) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    const saveBtn = (section: string) => saving === section ? t.saving : t.save;

    if (loading) {
        return (
            <div className={styles.settings}>
                <h1 className={styles.title}>{t.settingsTitle}</h1>
                <div style={{ color: 'var(--text-muted)', padding: 20 }}>{t.loading}</div>
            </div>
        );
    }

    return (
        <div className={styles.settings}>
            <h1 className={styles.title}>{t.settingsTitle}</h1>

            {/* ─── Profile ─────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('profile')}>
                    <span className={styles.sectionIcon}>👤</span>
                    <span className={styles.sectionTitle}>{t.profile}</span>
                    <span className={openSections.profile ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.profile && (
                    <div className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.name}</label>
                                <input className={styles.input} value={profile.full_name} onChange={(e) => update('full_name', e.target.value)} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.email}</label>
                                <input className={styles.input} value={userEmail || ''} disabled style={{ opacity: 0.5 }} />
                                <span className={styles.hint}>{t.emailCantChange}</span>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>{t.companyBrand}</label>
                            <input className={styles.input} value={profile.company_name} onChange={(e) => update('company_name', e.target.value)} />
                            <span className={styles.hint}>{t.shownInPortal}</span>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.saveBtn} disabled={saving === 'profile'} onClick={() => handleSave('profile', { full_name: profile.full_name, company_name: profile.company_name })}>{saveBtn('profile')}</button>
                            {saved === 'profile' && <span className={styles.savedMsg}>{t.saved}</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Billing ─────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('billing')}>
                    <span className={styles.sectionIcon}>🏦</span>
                    <span className={styles.sectionTitle}>{t.billingDetails}</span>
                    <span className={openSections.billing ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.billing && (
                    <div className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.businessName}</label>
                                <input className={styles.input} value={profile.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder={t.businessNamePlaceholder} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.inn}</label>
                                <input className={styles.input} value={profile.inn} onChange={(e) => update('inn', e.target.value)} placeholder="1234567890" />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.bank}</label>
                                <input className={styles.input} value={profile.bank_name} onChange={(e) => update('bank_name', e.target.value)} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.bik}</label>
                                <input className={styles.input} value={profile.bank_bik} onChange={(e) => update('bank_bik', e.target.value)} />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.bankAccount}</label>
                                <input className={styles.input} value={profile.bank_account} onChange={(e) => update('bank_account', e.target.value)} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.corrAccount}</label>
                                <input className={styles.input} value={profile.corr_account} onChange={(e) => update('corr_account', e.target.value)} />
                            </div>
                        </div>
                        <span className={styles.hint}>{t.billingHint}</span>
                        <div className={styles.actions}>
                            <button className={styles.saveBtn} disabled={saving === 'billing'} onClick={() => handleSave('billing', { business_name: profile.business_name, inn: profile.inn, bank_name: profile.bank_name, bank_account: profile.bank_account, bank_bik: profile.bank_bik, corr_account: profile.corr_account })}>{saveBtn('billing')}</button>
                            {saved === 'billing' && <span className={styles.savedMsg}>{t.saved}</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Rates ───────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('rates')}>
                    <span className={styles.sectionIcon}>💰</span>
                    <span className={styles.sectionTitle}>{t.currencyAndRate}</span>
                    <span className={openSections.rates ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.rates && (
                    <div className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.currency}</label>
                                <select className={styles.select} value={profile.currency} onChange={(e) => update('currency', e.target.value)}>
                                    <option value="₽">{t.rubles}</option>
                                    <option value="$">{t.dollars}</option>
                                    <option value="€">{t.euros}</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.defaultRate} ({profile.currency}/h)</label>
                                <input className={styles.input} type="number" min="0" value={profile.default_rate ?? ''} onChange={(e) => update('default_rate', e.target.value ? parseFloat(e.target.value) : null)} placeholder="2000" />
                                <span className={styles.hint}>{t.defaultRateHint}</span>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.saveBtn} disabled={saving === 'rates'} onClick={() => handleSave('rates', { currency: profile.currency, default_rate: profile.default_rate })}>{saveBtn('rates')}</button>
                            {saved === 'rates' && <span className={styles.savedMsg}>{t.saved}</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Subscription ─────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('subscription')}>
                    <span className={styles.sectionIcon}>⭐</span>
                    <span className={styles.sectionTitle}>{t.subscription}</span>
                    <span className={openSections.subscription ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.subscription && (
                    <div className={styles.form}>
                        <div className={styles.planCard}>
                            <span className={plan === 'pro' ? styles.planPro : styles.planFree}>
                                {plan === 'pro' ? '⭐ Pro' : 'Free'}
                            </span>
                            <div className={styles.planInfo}>
                                <div className={styles.planName}>{plan === 'pro' ? t.proPlan : t.freePlan}</div>
                                <div className={styles.planDesc}>{plan === 'pro' ? t.proPlanDesc : t.freePlanDesc}</div>
                            </div>
                            {plan !== 'pro' && (
                                <button className={styles.upgradeBtn} onClick={onUpgrade}>{t.goToPro}</button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Password ─────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('password')}>
                    <span className={styles.sectionIcon}>🔒</span>
                    <span className={styles.sectionTitle}>{t.security}</span>
                    <span className={openSections.password ? styles.sectionToggleOpen : styles.sectionToggle}>▸</span>
                </div>
                {openSections.password && (
                    <div className={styles.form}>
                        <div className={styles.passwordRow}>
                            <span className={styles.passwordNote}>{t.passwordResetInfo}</span>
                            <button className={styles.passwordBtn} onClick={handlePasswordReset}>{t.resetPassword}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
