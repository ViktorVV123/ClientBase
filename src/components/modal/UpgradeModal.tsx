import React, { useState } from 'react';
import { createCheckoutSession } from '@/lib/subscription';
import { useI18n } from '@/lib/i18n';
import * as styles from './UpgradeModal.module.scss';

interface UpgradeModalProps {
    onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
    const { t, locale } = useI18n();
    const [loading, setLoading] = useState(false);

    const proFeatures = [
        { icon: '👥', title: t.unlimitedClients, desc: t.unlimitedDesc },
        { icon: '🎨', title: t.customBranding, desc: t.customBrandingDesc },
        { icon: '⚡', title: t.prioritySupport, desc: t.prioritySupportDesc },
    ];

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const url = await createCheckoutSession();
            if (url) { window.location.href = url; }
            else { alert(t.paymentTryLater); }
        } catch (err) {
            console.error('Checkout error:', err);
            alert(t.paymentError);
        } finally { setLoading(false); }
    };

    const stayLabel = locale === 'ru' ? 'Остаться на Free' : 'Stay on Free';
    const redirectLabel = locale === 'ru' ? 'Переход к оплате...' : 'Redirecting...';
    const subscribeLabel = locale === 'ru' ? '💳 Оформить подписку' : '💳 Subscribe';
    const limitLabel = locale === 'ru'
        ? 'Вы достигли лимита бесплатного плана (1 клиент). Перейдите на Pro чтобы снять ограничения.'
        : 'You have reached the free plan limit (1 client). Upgrade to Pro to remove restrictions.';
    const cancelAnytime = locale === 'ru' ? 'Отмена в любой момент' : 'Cancel anytime';
    const footerLabel = locale === 'ru' ? 'Оплата через Stripe · Безопасно · Тестовый режим' : 'Payment via Stripe · Secure · Test mode';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.badge}>PRO</div>
                <div className={styles.title}>{t.upgradeTo}</div>
                <div className={styles.subtitle}>{limitLabel}</div>

                <div className={styles.features}>
                    {proFeatures.map((f) => (
                        <div key={f.title} className={styles.feature}>
                            <div className={styles.featureIcon}>{f.icon}</div>
                            <div className={styles.featureContent}>
                                <div className={styles.featureTitle}>{f.title}</div>
                                <div className={styles.featureDesc}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.priceBlock}>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>4$</span>
                        <span className={styles.pricePeriod}>{locale === 'ru' ? '/мес' : '/mo'}</span>
                    </div>
                    <div className={styles.priceHint}>{cancelAnytime}</div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.upgradeBtn} onClick={handleUpgrade} disabled={loading}>
                        {loading ? (<><span className={styles.spinner} />{redirectLabel}</>) : subscribeLabel}
                    </button>
                    <button className={styles.cancelBtn} onClick={onClose}>{stayLabel}</button>
                </div>

                <div className={styles.footer}>{footerLabel}</div>
            </div>
        </div>
    );
};
