import React, { useState } from 'react';
import { createCheckoutSession } from '@/lib/subscription';
import * as styles from './UpgradeModal.module.scss';

interface UpgradeModalProps {
    onClose: () => void;
}

const PRO_FEATURES = [
    { icon: '👥', title: 'Безлимит клиентов', desc: 'Добавляйте сколько угодно клиентов' },
    { icon: '🎨', title: 'Кастомный брендинг', desc: 'Логотип и цвета в портале клиента' },
    { icon: '⚡', title: 'Приоритетная поддержка', desc: 'Ответ в течение 24 часов' },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const url = await createCheckoutSession();
            if (url) {
                window.location.href = url;
            } else {
                alert('Не удалось создать сессию оплаты. Попробуйте позже.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Ошибка при создании оплаты');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Badge */}
                <div className={styles.badge}>PRO</div>

                {/* Header */}
                <div className={styles.title}>Перейти на Pro</div>
                <div className={styles.subtitle}>
                    Вы достигли лимита бесплатного плана (1 клиент).
                    Перейдите на Pro чтобы снять ограничения.
                </div>

                {/* Features */}
                <div className={styles.features}>
                    {PRO_FEATURES.map((f) => (
                        <div key={f.title} className={styles.feature}>
                            <div className={styles.featureIcon}>{f.icon}</div>
                            <div className={styles.featureContent}>
                                <div className={styles.featureTitle}>{f.title}</div>
                                <div className={styles.featureDesc}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price */}
                <div className={styles.priceBlock}>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>299 ₽</span>
                        <span className={styles.pricePeriod}>/мес</span>
                    </div>
                    <div className={styles.priceHint}>Отмена в любой момент</div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={styles.upgradeBtn}
                        onClick={handleUpgrade}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className={styles.spinner} />
                                Переход к оплате...
                            </>
                        ) : (
                            '💳 Оформить подписку'
                        )}
                    </button>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Остаться на Free
                    </button>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    Оплата через Stripe · Безопасно · Тестовый режим
                </div>
            </div>
        </div>
    );
};
