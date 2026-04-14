import React from 'react';
import {
    Client,
    STATUS_MAP,
    INVOICE_STATUS_MAP,
    FILE_ICONS,
    formatMoney,
    formatDate,
} from '@/assets/data/data';
import * as styles from './PortalPreview.module.scss';

interface PortalPreviewProps {
    client: Client;
    onClose: () => void;
}

export const PortalPreview: React.FC<PortalPreviewProps> = ({ client, onClose }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
                <div className={styles.closeRow}>
                    <button className={styles.closeBtn} onClick={onClose}>
                        ✕ Закрыть
                    </button>
                </div>

                <div className={styles.portal}>
                    {/* Header */}
                    <div
                        className={styles.portalHeader}
                        style={{ background: client.color }}
                    >
                        <div className={styles.portalSubtitle}>Клиентский портал</div>
                        <div className={styles.portalTitle}>{client.company}</div>
                        <div className={styles.portalGreeting}>
                            Добро пожаловать, {client.name.split(' ')[0]}
                        </div>
                    </div>

                    <div className={styles.portalContent}>
                        {/* Projects */}
                        <div className={styles.sectionTitle}>Ваши проекты</div>
                        {client.projects.map((p) => {
                            const s = STATUS_MAP[p.status];
                            return (
                                <div key={p.id} className={styles.card}>
                                    <div className={styles.cardRow}>
                                        <div className={styles.cardName}>{p.name}</div>
                                        <span
                                            className={styles.badge}
                                            style={{ color: s.color, background: s.bg }}
                                        >
                                            ● {s.label}
                                        </span>
                                    </div>
                                    <div className={styles.progressWrap}>
                                        <div className={styles.progressTrack}>
                                            <div
                                                className={styles.progressFill}
                                                style={{
                                                    width: p.progress + '%',
                                                    background: client.color,
                                                }}
                                            />
                                        </div>
                                        <div className={styles.progressMeta}>
                                            Прогресс: {p.progress}% · Дедлайн:{' '}
                                            {formatDate(p.deadline)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Invoices */}
                        {client.invoices.length > 0 && (
                            <>
                                <div className={styles.sectionTitleSpaced}>Счета</div>
                                {client.invoices.map((inv) => {
                                    const s = INVOICE_STATUS_MAP[inv.status];
                                    return (
                                        <div key={inv.id} className={styles.invoiceCard}>
                                            <div>
                                                <div className={styles.cardName}>
                                                    {inv.number}
                                                </div>
                                                <div className={styles.cardMeta}>
                                                    от {formatDate(inv.date)}
                                                </div>
                                            </div>
                                            <div className={styles.invoiceRight}>
                                                <div className={styles.invoiceAmount}>
                                                    {formatMoney(inv.amount)}
                                                </div>
                                                <span
                                                    className={styles.badge}
                                                    style={{
                                                        color: s.color,
                                                        background: s.bg,
                                                    }}
                                                >
                                                    {s.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* Files */}
                        {client.files.length > 0 && (
                            <>
                                <div className={styles.sectionTitleSpaced}>Файлы</div>
                                {client.files.map((f) => (
                                    <div key={f.id} className={styles.fileCard}>
                                        <span className={styles.fileIcon}>
                                            {FILE_ICONS[f.type] || '📄'}
                                        </span>
                                        <div className={styles.fileInfo}>
                                            <div className={styles.cardName}>{f.name}</div>
                                            <div className={styles.cardMeta}>
                                                {f.size} · {formatDate(f.date)}
                                            </div>
                                        </div>
                                        <button
                                            className={styles.dlBtn}
                                            style={{ background: client.color }}
                                        >
                                            Скачать
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}

                        <div className={styles.poweredBy}>Powered by ClientBase</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
