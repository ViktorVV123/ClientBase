import React, { useState, useEffect } from 'react';
import { fetchNotificationSettings, updateNotificationSettings, NotificationSettings as Settings } from '@/lib/api';
import * as styles from './NotificationSettings.module.scss';

interface NotificationSettingsProps {
    clientId: number;
    clientEmail: string;
}

const NOTIFICATION_OPTIONS = [
    { key: 'notify_project_created' as const, icon: '📋', label: 'Новый проект создан', desc: 'Клиент получит письмо при создании проекта' },
    { key: 'notify_project_status' as const, icon: '🔄', label: 'Статус проекта изменён', desc: 'Письмо при смене статуса (Бриф → В работе и т.д.)' },
    { key: 'notify_invoice_created' as const, icon: '💳', label: 'Новый счёт выставлен', desc: 'Письмо с суммой и дедлайном оплаты' },
];

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ clientId, clientEmail }) => {
    const [settings, setSettings] = useState<Settings>({
        notify_project_created: true,
        notify_project_status: true,
        notify_invoice_created: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, [clientId]);

    const loadSettings = async () => {
        try {
            const data = await fetchNotificationSettings(clientId);
            setSettings(data);
        } catch (err) {
            console.error('Failed to load notification settings:', err);
        }
    };

    const handleToggle = async (key: keyof Settings) => {
        const newValue = !settings[key];
        const newSettings = { ...settings, [key]: newValue };
        setSettings(newSettings);

        setSaving(true);
        try {
            await updateNotificationSettings(clientId, { [key]: newValue });
        } catch (err) {
            console.error('Failed to update notification settings:', err);
            setSettings(settings); // откатываем
        } finally {
            setSaving(false);
        }
    };

    if (!clientEmail) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.title}>📧 Email-уведомления</div>
                <div className={styles.noEmail}>
                    У клиента не указан email. Добавьте email чтобы настроить уведомления.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.title}>📧 Email-уведомления</div>
            <div className={styles.subtitle}>
                Отправляем на <strong>{clientEmail}</strong>
            </div>

            <div className={styles.optionsList}>
                {NOTIFICATION_OPTIONS.map((opt) => (
                    <label key={opt.key} className={styles.option}>
                        <div className={styles.optionLeft}>
                            <span className={styles.optionIcon}>{opt.icon}</span>
                            <div>
                                <div className={styles.optionLabel}>{opt.label}</div>
                                <div className={styles.optionDesc}>{opt.desc}</div>
                            </div>
                        </div>
                        <div
                            className={`${styles.toggle} ${settings[opt.key] ? styles.toggleOn : ''}`}
                            onClick={() => handleToggle(opt.key)}
                        >
                            <div className={styles.toggleKnob} />
                        </div>
                    </label>
                ))}
            </div>

            {saving && <div className={styles.savingHint}>Сохранение...</div>}
        </div>
    );
};
