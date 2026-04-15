import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Project, Invoice, ClientFile, STATUS_MAP, INVOICE_STATUS_MAP, FILE_ICONS, formatMoney, formatDate,
} from '@/assets/data/data';
import { fetchPortalData, downloadFile, fetchPortalNotes, ProjectNote } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import * as styles from './PublicPortal.module.scss';

interface Branding { companyName: string | null; brandColor: string | null; logoUrl: string | null; }
interface PortalData { client: { name: string; company: string; color: string }; branding: Branding | null; projects: Project[]; invoices: Invoice[]; files: ClientFile[]; }

export const PublicPortal: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { t, locale } = useI18n();
    const [data, setData] = useState<PortalData | null>(null);
    const [notes, setNotes] = useState<ProjectNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const statusLabels: Record<string, string> = { brief: t.statusBrief, in_progress: t.statusInProgress, review: t.statusReview, done: t.statusDone };
    const invStatusLabels: Record<string, string> = { paid: t.invoiceStatusPaid, pending: t.invoiceStatusPending, overdue: t.invoiceStatusOverdue };

    useEffect(() => {
        if (!token) { setNotFound(true); setLoading(false); return; }
        loadPortal(token);
    }, [token]);

    const loadPortal = async (tk: string) => {
        try {
            const result = await fetchPortalData(tk);
            if (!result) { setNotFound(true); }
            else {
                setData(result);
                if (result.projects.length > 0) {
                    try { setNotes(await fetchPortalNotes(result.projects.map((p: Project) => p.id))); } catch {}
                }
            }
        } catch { setNotFound(true); }
        finally { setLoading(false); }
    };

    const handleDownload = async (f: ClientFile) => {
        if (!f.storagePath) return;
        try { window.open(await downloadFile(f.storagePath), '_blank'); } catch (err) { console.error(err); }
    };

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
                <div>{t.loading}</div>
            </div>
        );
    }

    if (notFound || !data) {
        const notFoundTitle = locale === 'ru' ? 'Портал не найден' : 'Portal not found';
        const notFoundText = locale === 'ru' ? 'Ссылка недействительна или портал был деактивирован.' : 'This link is invalid or the portal has been deactivated.';
        return (
            <div className={styles.notFound}>
                <div className={styles.notFoundIcon}>🔒</div>
                <div className={styles.notFoundTitle}>{notFoundTitle}</div>
                <div className={styles.notFoundText}>{notFoundText}</div>
            </div>
        );
    }

    const { client, branding, projects, invoices, files } = data;
    const headerColor = branding?.brandColor || client.color;
    const headerTitle = branding?.companyName || client.company;
    const logoUrl = branding?.logoUrl || null;
    const showPoweredBy = !branding;
    const portalLabel = locale === 'ru' ? 'Клиентский портал' : 'Client Portal';
    const noDataMsg = locale === 'ru' ? 'Пока нет данных для отображения.' : 'No data to display yet.';

    return (
        <div className={styles.page}>
            <div className={styles.portal}>
                <div className={styles.header} style={{ background: headerColor }}>
                    {logoUrl && <img src={logoUrl} alt={headerTitle} className={styles.headerLogo} />}
                    <div className={styles.headerSub}>{portalLabel}</div>
                    <div className={styles.headerTitle}>{headerTitle}</div>
                    <div className={styles.headerGreeting}>{t.welcome}, {client.name.split(' ')[0]}</div>
                </div>

                <div className={styles.content}>
                    {projects.length > 0 && (
                        <>
                            <div className={styles.sectionTitle}>{t.yourProjects}</div>
                            {projects.map((p) => {
                                const s = STATUS_MAP[p.status];
                                const projectNotes = notes.filter((n) => n.project_id === p.id);
                                return (
                                    <div key={p.id} className={styles.card}>
                                        <div className={styles.cardTop}>
                                            <div className={styles.cardName}>{p.name}</div>
                                            <span className={styles.badge} style={{ color: s.color, background: s.bg }}>● {statusLabels[p.status] || s.label}</span>
                                        </div>
                                        <div className={styles.progressWrap}>
                                            <div className={styles.progressTrack}>
                                                <div className={styles.progressFill} style={{ width: p.progress + '%', background: headerColor }} />
                                            </div>
                                            <div className={styles.progressMeta}>
                                                {t.progress}: {p.progress}%{p.deadline && ` · ${t.deadline}: ${formatDate(p.deadline)}`}
                                            </div>
                                        </div>
                                        {projectNotes.length > 0 && (
                                            <div className={styles.projectNotes}>
                                                {projectNotes.map((n) => (
                                                    <div key={n.id} className={styles.projectNote}>
                                                        <div className={styles.projectNoteText}>{n.text}</div>
                                                        <div className={styles.projectNoteDate}>{new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {invoices.length > 0 && (
                        <>
                            <div className={styles.sectionTitleSpaced}>{t.yourInvoices}</div>
                            {invoices.map((inv) => {
                                const s = INVOICE_STATUS_MAP[inv.status];
                                return (
                                    <div key={inv.id} className={styles.invoiceCard}>
                                        <div>
                                            <div className={styles.cardName}>{inv.number}</div>
                                            <div className={styles.cardMeta}>{formatDate(inv.date)}</div>
                                        </div>
                                        <div className={styles.invoiceRight}>
                                            <div className={styles.invoiceAmount}>{formatMoney(inv.amount)}</div>
                                            <span className={styles.badge} style={{ color: s.color, background: s.bg }}>{invStatusLabels[inv.status] || s.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {files.length > 0 && (
                        <>
                            <div className={styles.sectionTitleSpaced}>{t.yourFiles}</div>
                            {files.map((f) => (
                                <div key={f.id} className={styles.fileCard}>
                                    <span className={styles.fileIcon}>{FILE_ICONS[f.type] || '📄'}</span>
                                    <div className={styles.fileInfo}>
                                        <div className={styles.cardName}>{f.name}</div>
                                        <div className={styles.cardMeta}>{f.size} · {formatDate(f.date)}</div>
                                    </div>
                                    <button className={styles.dlBtn} style={{ background: headerColor }} onClick={() => handleDownload(f)}>{t.download}</button>
                                </div>
                            ))}
                        </>
                    )}

                    {projects.length === 0 && invoices.length === 0 && files.length === 0 && (
                        <div className={styles.emptyPortal}>{noDataMsg}</div>
                    )}

                    <div className={styles.poweredBy}>{showPoweredBy ? t.portalPowered : headerTitle}</div>
                </div>
            </div>
        </div>
    );
};
