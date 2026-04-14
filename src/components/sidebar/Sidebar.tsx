import React from 'react';
import { Client } from '@/assets/data/data';
import { Plan } from '@/lib/subscription';
import * as styles from './Sidebar.module.scss';

interface SidebarProps {
    clients: Client[];
    selectedClientId: number | null;
    onSelectClient: (client: Client) => void;
    onDashboard: () => void;
    onAddClient: () => void;
    onPortalPreview: () => void;
    plan?: Plan;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    clients,
                                                    selectedClientId,
                                                    onSelectClient,
                                                    onDashboard,
                                                    onAddClient,
                                                    onPortalPreview,
                                                    plan = 'free',
                                                    isOpen = false,
                                                    onClose,
                                                }) => {
    const handleNav = (cb: () => void) => {
        cb();
        onClose?.();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && <div className={styles.overlay} onClick={onClose} />}

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.logo}>
                    <div className={styles.logoMark}>CB</div>
                    <span>ClientBase</span>
                    {/* Mobile close button */}
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose}>✕</button>
                    )}
                </div>

                <nav className={styles.nav}>
                    <button
                        className={`${styles.navItem} ${!selectedClientId ? styles.navItemActive : ''}`}
                        onClick={() => handleNav(onDashboard)}
                    >
                        <span className={styles.navIcon}>📊</span>
                        Дашборд
                    </button>
                    <button className={styles.navItem}>
                        <span className={styles.navIcon}>📅</span>
                        Календарь
                    </button>
                    <button className={styles.navItem}>
                        <span className={styles.navIcon}>⚙️</span>
                        Настройки
                    </button>
                </nav>

                <div className={styles.sectionLabel}>Клиенты</div>

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
                    {/* Plan badge */}
                    <div className={plan === 'pro' ? styles.planBadgePro : styles.planBadgeFree}>
                        {plan === 'pro' ? '⭐ Pro Plan' : `Free · ${clients.length}/1 клиент`}
                    </div>

                    <button className={styles.addButton} onClick={() => handleNav(onAddClient)}>
                        + Новый клиент
                    </button>
                    {selectedClientId && (
                        <button className={styles.portalButton} onClick={() => handleNav(onPortalPreview)}>
                            👁️ Портал клиента
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};
