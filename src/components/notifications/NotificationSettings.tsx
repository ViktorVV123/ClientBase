import React, { useState, useEffect } from 'react';
import { fetchNotificationSettings, updateNotificationSettings, NotificationSettings as Settings } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import * as styles from './NotificationSettings.module.scss';

interface NotificationSettingsProps { clientId: number; clientEmail: string; }

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ clientId, clientEmail }) => {
    const { t, locale } = useI18n();

    const options = [
        { key: 'notify_project_created' as const, icon: '📋', label: t.notifyProjectCreated, desc: t.notifyProjectCreatedDesc },
        { key: 'notify_project_status' as const, icon: '🔄', label: t.notifyProjectStatus, desc: t.notifyProjectStatusDesc },
        { key: 'notify_invoice_created' as const, icon: '💳', label: t.notifyInvoiceCreated, desc: t.notifyInvoiceCreatedDesc },
    ];

    const [settings, setSettings] = useState<Settings>({ notify_project_created: true, notify_project_status: true, notify_invoice_created: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadSettings(); }, [clientId]);
    const loadSettings = async () => { try { setSettings(await fetchNotificationSettings(clientId)); } catch (err) { console.error(err); } };

    const handleToggle = async (key: keyof Settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        setSaving(true);
        try { await updateNotificationSettings(clientId, { [key]: !settings[key] }); }
        catch (err) { console.error(err); setSettings(settings); }
        finally { setSaving(false); }
    };

    const noEmailMsg = locale === 'ru'
        ? 'У клиента не указан email. Добавьте email чтобы настроить уведомления.'
        : 'No email set for this client. Add an email to configure notifications.';
    const sendingTo = locale === 'ru' ? 'Отправляем на' : 'Sending to';

    if (!clientEmail) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.title}>📧 {t.notifications}</div>
                <div className={styles.noEmail}>{noEmailMsg}</div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.title}>📧 {t.notifications}</div>
            <div className={styles.subtitle}>{sendingTo} <strong>{clientEmail}</strong></div>
            <div className={styles.optionsList}>
                {options.map((opt) => (
                    <label key={opt.key} className={styles.option}>
                        <div className={styles.optionLeft}>
                            <span className={styles.optionIcon}>{opt.icon}</span>
                            <div>
                                <div className={styles.optionLabel}>{opt.label}</div>
                                <div className={styles.optionDesc}>{opt.desc}</div>
                            </div>
                        </div>
                        <div className={`${styles.toggle} ${settings[opt.key] ? styles.toggleOn : ''}`} onClick={() => handleToggle(opt.key)}>
                            <div className={styles.toggleKnob} />
                        </div>
                    </label>
                ))}
            </div>
            {saving && <div className={styles.savingHint}>{t.saving}</div>}
        </div>
    );
};
