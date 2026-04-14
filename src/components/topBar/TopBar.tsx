import React from 'react';
import * as styles from './TopBar.module.scss';

interface TopBarProps {
    clientName?: string;
    onBreadcrumbClick: () => void;
    onSignOut?: () => void;
    userEmail?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
                                                  clientName,
                                                  onBreadcrumbClick,
                                                  onSignOut,
                                                  userEmail,
                                              }) => {
    const initials = userEmail
        ? userEmail.slice(0, 2).toUpperCase()
        : 'ВВ';

    return (
        <div className={styles.topBar}>
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
            <div className={styles.right}>
                <div className={styles.planBadge}>● Pro Plan</div>
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
