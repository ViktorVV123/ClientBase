import React from 'react';
import { Client } from '@/assets/data/data';
import * as styles from './Sidebar.module.scss';

interface SidebarProps {
    clients: Client[];
    selectedClientId: number | null;
    onSelectClient: (client: Client) => void;
    onDashboard: () => void;
    onAddClient: () => void;
    onPortalPreview: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    clients,
                                                    selectedClientId,
                                                    onSelectClient,
                                                    onDashboard,
                                                    onAddClient,
                                                    onPortalPreview,
                                                }) => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoMark}>CB</div>
                <span>ClientBase</span>
            </div>

            <nav className={styles.nav}>
                <button
                    className={`${styles.navItem} ${!selectedClientId ? styles.navItemActive : ''}`}
                    onClick={onDashboard}
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
                        onClick={() => onSelectClient(c)}
                    >
                        <span className={styles.clientDot} style={{ background: c.color }} />
                        <span className={styles.clientName}>{c.name}</span>
                    </button>
                ))}
            </div>

            <div className={styles.sidebarFooter}>
                <button className={styles.addButton} onClick={onAddClient}>
                    + Новый клиент
                </button>
                {selectedClientId && (
                    <button className={styles.portalButton} onClick={onPortalPreview}>
                        👁️ Портал клиента
                    </button>
                )}
            </div>
        </aside>
    );
};
