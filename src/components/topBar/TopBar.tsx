import React from 'react';
import { Plan } from '@/lib/subscription';
import * as styles from './TopBar.module.scss';

interface TopBarProps {
    clientName?: string;
    onBreadcrumbClick: () => void;
    onSignOut?: () => void;
    userEmail?: string;
    plan?: Plan;
    onUpgrade?: () => void;
    onMenuToggle?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
                                                  clientName,
                                                  onBreadcrumbClick,
                                                  onSignOut,
                                                  userEmail,
                                                  plan = 'free',
                                                  onUpgrade,
                                                  onMenuToggle,
                                              }) => {
    const initials = userEmail
        ? userEmail.slice(0, 2).toUpperCase()
        : 'ВВ';

    return (
        <div className={styles.topBar}>
            <div className={styles.left}>
                {/* Mobile burger */}
                {onMenuToggle && (
                    <button className={styles.burgerBtn} onClick={onMenuToggle}>
                        <span className={styles.burgerLine} />
                        <span className={styles.burgerLine} />
                        <span className={styles.burgerLine} />
                    </button>
                )}

                <div className={styles.breadcrumb}>
                    <span className={styles.breadcrumbLink} onClick={onBreadcrumbClick}>
                        ClientBase
                    </span>
                    {clientName && (
                        <>
                            <span className={styles.breadcrumbSep}>/</span>
                            <span className={styles.breadcrumbActive}>{clientName}</span>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.right}>
                {plan === 'pro' ? (
                    <div className={styles.planBadgePro}>⭐ Pro</div>
                ) : (
                    <button className={styles.upgradeBtnSmall} onClick={onUpgrade}>
                        Upgrade
                    </button>
                )}
                <div className={styles.userAvatar} title={userEmail}>
                    {initials}
                </div>
                {onSignOut && (
                    <button className={styles.signOutBtn} onClick={onSignOut}>
                        Выйти
                    </button>
                )}
            </div>
        </div>
    );
};
