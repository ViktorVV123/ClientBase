import React from 'react';
import { Client, formatMoney, formatDate } from '@/assets/data/data';
import * as styles from './Dashboard.module.scss';

interface DashboardProps {
    clients: Client[];
    onSelectClient: (client: Client) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, onSelectClient }) => {
    const totalRevenue = clients
        .flatMap((c) => c.invoices)
        .filter((i) => i.status === 'paid')
        .reduce((s, i) => s + i.amount, 0);

    const pendingRevenue = clients
        .flatMap((c) => c.invoices)
        .filter((i) => i.status !== 'paid')
        .reduce((s, i) => s + i.amount, 0);

    const totalProjects = clients.flatMap((c) => c.projects).length;
    const activeProjects = clients
        .flatMap((c) => c.projects)
        .filter((p) => p.status !== 'done').length;

    return (
        <>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Клиенты</div>
                    <div className={`${styles.statValue} ${styles.accent}`}>{clients.length}</div>
                    <div className={styles.statSub}>активных</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Получено</div>
                    <div className={`${styles.statValue} ${styles.success}`}>{formatMoney(totalRevenue)}</div>
                    <div className={styles.statSub}>всего оплачено</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Ожидает оплаты</div>
                    <div className={`${styles.statValue} ${styles.warning}`}>{formatMoney(pendingRevenue)}</div>
                    <div className={styles.statSub}>в ожидании</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Проекты</div>
                    <div className={`${styles.statValue} ${styles.purple}`}>
                        {activeProjects}/{totalProjects}
                    </div>
                    <div className={styles.statSub}>активных / всего</div>
                </div>
            </div>

            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Клиенты</div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Клиент</th>
                        <th>Проекты</th>
                        <th>Оплачено</th>
                        <th>К оплате</th>
                        <th>Последняя активность</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clients.map((c) => {
                        const paid = c.invoices
                            .filter((i) => i.status === 'paid')
                            .reduce((s, i) => s + i.amount, 0);
                        const pending = c.invoices
                            .filter((i) => i.status !== 'paid')
                            .reduce((s, i) => s + i.amount, 0);
                        const active = c.projects.filter((p) => p.status !== 'done').length;
                        const lastFile = c.files.length > 0 ? c.files[c.files.length - 1] : null;

                        return (
                            <tr key={c.id} onClick={() => onSelectClient(c)}>
                                <td>
                                    <div className={styles.clientCell}>
                                        <div
                                            className={styles.avatar}
                                            style={{
                                                background: c.color + '22',
                                                color: c.color,
                                            }}
                                        >
                                            {c.avatar}
                                        </div>
                                        <div>
                                            <div className={styles.clientName}>{c.name}</div>
                                            <div className={styles.clientCompany}>{c.company}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.accentText}>{active}</span>
                                    <span className={styles.dimText}> активных</span>
                                </td>
                                <td className={styles.successText}>{formatMoney(paid)}</td>
                                <td className={pending > 0 ? styles.warningText : styles.dimText}>
                                    {pending > 0 ? formatMoney(pending) : '—'}
                                </td>
                                <td className={styles.mutedText}>
                                    {lastFile ? formatDate(lastFile.date) : '—'}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </>
    );
};
