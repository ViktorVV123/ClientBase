import React from 'react';
import { Client, formatMoney, formatDate } from '@/assets/data/data';
import { useI18n } from '@/lib/i18n';
import * as styles from './Dashboard.module.scss';

interface DashboardProps {
    clients: Client[];
    onSelectClient: (client: Client) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, onSelectClient }) => {
    const { t } = useI18n();

    const totalRevenue = clients
        .flatMap((c) => c.invoices)
        .filter((i) => i.status === 'paid')
        .reduce((s, i) => s + i.amount, 0);

    const pendingRevenue = clients
        .flatMap((c) => c.invoices)
        .filter((i) => i.status !== 'paid')
        .reduce((s, i) => s + i.amount, 0);

    const totalProjects = clients.flatMap((c) => c.projects).length;
    const activeProjectsCount = clients
        .flatMap((c) => c.projects)
        .filter((p) => p.status !== 'done').length;

    return (
        <>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{t.clientsCount}</div>
                    <div className={`${styles.statValue} ${styles.accent}`}>{clients.length}</div>
                    <div className={styles.statSub}>{t.active}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{t.received}</div>
                    <div className={`${styles.statValue} ${styles.success}`}>{formatMoney(totalRevenue)}</div>
                    <div className={styles.statSub}>{t.totalPaid}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{t.awaitingPayment}</div>
                    <div className={`${styles.statValue} ${styles.warning}`}>{formatMoney(pendingRevenue)}</div>
                    <div className={styles.statSub}>{t.pending}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{t.projects}</div>
                    <div className={`${styles.statValue} ${styles.purple}`}>
                        {activeProjectsCount}/{totalProjects}
                    </div>
                    <div className={styles.statSub}>{t.activeSlashTotal}</div>
                </div>
            </div>

            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>{t.clients}</div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>{t.client}</th>
                        <th>{t.projectsCol}</th>
                        <th>{t.paidCol}</th>
                        <th>{t.pendingCol}</th>
                        <th>{t.lastActivity}</th>
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
                                    <span className={styles.dimText}> {t.activeProjects}</span>
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
