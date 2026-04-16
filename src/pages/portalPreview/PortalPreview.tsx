import React, { useEffect, useState } from 'react';
import { Client, STATUS_MAP, INVOICE_STATUS_MAP, FILE_ICONS, formatMoney, formatDate } from '@/assets/data/data';
import { fetchProfile, fetchPortalNotes, ProjectNote } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import * as styles from './PortalPreview.module.scss';

interface PortalPreviewProps { client: Client; onClose: () => void; isPro?: boolean; }

export const PortalPreview: React.FC<PortalPreviewProps> = ({ client, onClose, isPro = false }) => {
    const { t, locale } = useI18n();
    const statusLabels: Record<string, string> = { brief: t.statusBrief, in_progress: t.statusInProgress, review: t.statusReview, done: t.statusDone };
    const invStatusLabels: Record<string, string> = { paid: t.invoiceStatusPaid, pending: t.invoiceStatusPending, overdue: t.invoiceStatusOverdue };

    const [branding, setBranding] = useState<{ companyName: string | null; brandColor: string | null; logoUrl: string | null } | null>(null);
    const [notes, setNotes] = useState<ProjectNote[]>([]);
    const [cardNumber, setCardNumber] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile().then((profile) => {
            if (profile) {
                if (isPro) setBranding({ companyName: profile.company_name || null, brandColor: profile.brand_color || null, logoUrl: profile.logo_url || null });
                if (client.showCardInPortal && profile.card_number) setCardNumber(profile.card_number);
            }
        }).catch(() => {});
        if (client.projects.length > 0) {
            fetchPortalNotes(client.projects.map((p) => p.id)).then(setNotes).catch(() => {});
        }
    }, [isPro, client.id, client.showCardInPortal]);

    const headerColor = (isPro && branding?.brandColor) || client.color;
    const headerTitle = (isPro && branding?.companyName) || client.company;
    const logoUrl = isPro ? branding?.logoUrl : null;
    const showPoweredBy = !isPro || !branding?.companyName;
    const portalLabel = locale === 'ru' ? 'Клиентский портал' : 'Client Portal';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
                <div className={styles.closeRow}>
                    <button className={styles.closeBtn} onClick={onClose}>✕ {t.close}</button>
                </div>

                <div className={styles.portal}>
                    <div className={styles.portalHeader} style={{ background: headerColor }}>
                        {logoUrl && <img src={logoUrl} alt={headerTitle} className={styles.portalLogo} />}
                        <div className={styles.portalSubtitle}>{portalLabel}</div>
                        <div className={styles.portalTitle}>{headerTitle}</div>
                        <div className={styles.portalGreeting}>{t.welcome}, {client.name.split(' ')[0]}</div>
                    </div>

                    <div className={styles.portalContent}>
                        {client.projects.length > 0 && (
                            <>
                                <div className={styles.sectionTitle}>{t.yourProjects}</div>
                                {client.projects.map((p) => {
                                    const s = STATUS_MAP[p.status];
                                    const projectNotes = notes.filter((n) => n.project_id === p.id);
                                    return (
                                        <div key={p.id} className={styles.card}>
                                            <div className={styles.cardRow}>
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

                        {client.invoices.length > 0 && (
                            <>
                                <div className={styles.sectionTitleSpaced}>{t.yourInvoices}</div>
                                {client.invoices.map((inv) => {
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

                        {cardNumber && client.invoices.length > 0 && (
                            <div className={styles.card} style={{ borderLeft: `4px solid ${headerColor}`, padding: 16, marginTop: 12 }}>
                                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
                                    💳 {t.cardForPayment}
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '1px', fontFamily: 'monospace' }}>
                                    {cardNumber}
                                </div>
                            </div>
                        )}

                        {client.files.length > 0 && (
                            <>
                                <div className={styles.sectionTitleSpaced}>{t.yourFiles}</div>
                                {client.files.map((f) => (
                                    <div key={f.id} className={styles.fileCard}>
                                        <span className={styles.fileIcon}>{FILE_ICONS[f.type] || '📄'}</span>
                                        <div className={styles.fileInfo}>
                                            <div className={styles.cardName}>{f.name}</div>
                                            <div className={styles.cardMeta}>{f.size} · {formatDate(f.date)}</div>
                                        </div>
                                        <button className={styles.dlBtn} style={{ background: headerColor }}>{t.download}</button>
                                    </div>
                                ))}
                            </>
                        )}

                        <div className={styles.poweredBy}>{showPoweredBy ? t.portalPowered : headerTitle}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
