import React from 'react';
import { Client } from '@/assets/data/data';
import { Plan } from '@/lib/subscription';
import { useI18n } from '@/lib/i18n';
import * as styles from './Sidebar.module.scss';

interface SidebarProps {
    clients: Client[];
    selectedClientId: number | null;
    onSelectClient: (client: Client) => void;
    onDashboard: () => void;
    onCalendar?: () => void;
    onSettings?: () => void;
    onAddClient: () => void;
    onPortalPreview: () => void;
    plan?: Plan;
    isOpen?: boolean;
    onClose?: () => void;
    activeView?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    clients,
                                                    selectedClientId,
                                                    onSelectClient,
                                                    onDashboard,
                                                    onCalendar,
                                                    onSettings,
                                                    onAddClient,
                                                    onPortalPreview,
                                                    plan = 'free',
                                                    isOpen = false,
                                                    onClose,
                                                    activeView,
                                                }) => {
    const { t } = useI18n();

    const handleNav = (cb: () => void) => {
        cb();
        onClose?.();
    };

    return (
        <>
            {isOpen && <div className={styles.overlay} onClick={onClose} />}

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.logo}>
                    <div className={styles.logoMark}>CB</div>
                    <span>ClientBase</span>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose}>✕</button>
                    )}
                </div>

                <nav className={styles.nav}>
                    <button
                        className={`${styles.navItem} ${activeView === 'dashboard' && !selectedClientId ? styles.navItemActive : ''}`}
                        onClick={() => handleNav(onDashboard)}
                    >
                        <span className={styles.navIcon}>📊</span>
                        {t.dashboard}
                    </button>
                    <button
                        className={`${styles.navItem} ${activeView === 'calendar' ? styles.navItemActive : ''}`}
                        onClick={() => handleNav(onCalendar || onDashboard)}
                    >
                        <span className={styles.navIcon}>📅</span>
                        {t.calendar}
                    </button>
                    <button
                        className={`${styles.navItem} ${activeView === 'settings' ? styles.navItemActive : ''}`}
                        onClick={() => handleNav(onSettings || onDashboard)}
                    >
                        <span className={styles.navIcon}>⚙️</span>
                        {t.settings}
                    </button>
                </nav>

                <div className={styles.sectionLabel}>{t.clients}</div>

                <div className={styles.clientList}>
                    {clients.map((c) => (
                        <button
                            key={c.id}
                            className={`${styles.clientItem} ${selectedClientId === c.id ? styles.clientItemActive : ''}`}
                            onClick={() => handleNav(() => onSelectClient(c))}
                        >
                            <span className={styles.clientDot} style={{ background: c.color }} />
                            <span className={styles.clientName}>{c.name}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.sidebarFooter}>
                    <div className={plan === 'pro' ? styles.planBadgePro : styles.planBadgeFree}>
                        {plan === 'pro' ? t.planPro : t.freeLimit(clients.length)}
                    </div>

                    <button className={styles.addButton} onClick={() => handleNav(onAddClient)}>
                        {t.newClient}
                    </button>
                    {selectedClientId && (
                        <button className={styles.portalButton} onClick={() => handleNav(onPortalPreview)}>
                            {t.clientPortal}
                        </button>
                    )}

                    <a
                        href="https://t.me/gga123321"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.supportLink}
                    >
                        {t.supportTg}
                    </a>
                </div>
            </aside>
        </>
    );
};
