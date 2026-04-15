import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Project,
    Invoice,
    ClientFile,
    STATUS_MAP,
    INVOICE_STATUS_MAP,
    FILE_ICONS,
    formatMoney,
    formatDate,
} from '@/assets/data/data';
import { fetchPortalData, downloadFile, fetchPortalNotes, ProjectNote } from '@/lib/api';
import * as styles from './PublicPortal.module.scss';

interface Branding {
    companyName: string | null;
    brandColor: string | null;
    logoUrl: string | null;
}

interface PortalData {
    client: { name: string; company: string; color: string };
    branding: Branding | null;
    projects: Project[];
    invoices: Invoice[];
    files: ClientFile[];
}

export const PublicPortal: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<PortalData | null>(null);
    const [notes, setNotes] = useState<ProjectNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!token) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        loadPortal(token);
    }, [token]);

    const loadPortal = async (t: string) => {
        try {
            const result = await fetchPortalData(t);
            if (!result) {
                setNotFound(true);
            } else {
                setData(result);
                // Загружаем заметки для проектов
                if (result.projects.length > 0) {
                    const projectIds = result.projects.map((p: Project) => p.id);
                    try {
                        const notesData = await fetchPortalNotes(projectIds);
                        setNotes(notesData);
                    } catch {}
                }
            }
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (f: ClientFile) => {
        if (!f.storagePath) return;
        try {
            const url = await downloadFile(f.storagePath);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
                <div>Загрузка портала...</div>
            </div>
        );
    }

    if (notFound || !data) {
        return (
            <div className={styles.notFound}>
                <div className={styles.notFoundIcon}>🔒</div>
                <div className={styles.notFoundTitle}>Портал не найден</div>
                <div className={styles.notFoundText}>
                    Ссылка недействительна или портал был деактивирован.
                </div>
            </div>
        );
    }

    const { client, branding, projects, invoices, files } = data;

    // Branding overrides: если Pro и есть кастомные настройки — используем их
    const headerColor = branding?.brandColor || client.color;
    const headerTitle = branding?.companyName || client.company;
    const logoUrl = branding?.logoUrl || null;
    const showPoweredBy = !branding; // Free юзеры видят "Powered by ClientBase"

    return (
        <div className={styles.page}>
            <div className={styles.portal}>
                <div className={styles.header} style={{ background: headerColor }}>
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt={headerTitle}
                            className={styles.headerLogo}
                        />
                    )}
                    <div className={styles.headerSub}>Клиентский портал</div>
                    <div className={styles.headerTitle}>{headerTitle}</div>
                    <div className={styles.headerGreeting}>
                        Добро пожаловать, {client.name.split(' ')[0]}
                    </div>
                </div>

                <div className={styles.content}>
                    {projects.length > 0 && (
                        <>
                            <div className={styles.sectionTitle}>Ваши проекты</div>
                            {projects.map((p) => {
                                const s = STATUS_MAP[p.status];
                                const projectNotes = notes.filter((n) => n.project_id === p.id);
                                return (
                                    <div key={p.id} className={styles.card}>
                                        <div className={styles.cardTop}>
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
                                                        background: headerColor,
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.progressMeta}>
                                                Прогресс: {p.progress}%
                                                {p.deadline && ` · Дедлайн: ${formatDate(p.deadline)}`}
                                            </div>
                                        </div>
                                        {projectNotes.length > 0 && (
                                            <div className={styles.projectNotes}>
                                                {projectNotes.map((n) => (
                                                    <div key={n.id} className={styles.projectNote}>
                                                        <div className={styles.projectNoteText}>{n.text}</div>
                                                        <div className={styles.projectNoteDate}>
                                                            {new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                                        </div>
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
                            <div className={styles.sectionTitleSpaced}>Счета</div>
                            {invoices.map((inv) => {
                                const s = INVOICE_STATUS_MAP[inv.status];
                                return (
                                    <div key={inv.id} className={styles.invoiceCard}>
                                        <div>
                                            <div className={styles.cardName}>{inv.number}</div>
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
                                                style={{ color: s.color, background: s.bg }}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {files.length > 0 && (
                        <>
                            <div className={styles.sectionTitleSpaced}>Файлы</div>
                            {files.map((f) => (
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
                                        style={{ background: headerColor }}
                                        onClick={() => handleDownload(f)}
                                    >
                                        Скачать
                                    </button>
                                </div>
                            ))}
                        </>
                    )}

                    {projects.length === 0 && invoices.length === 0 && files.length === 0 && (
                        <div className={styles.emptyPortal}>
                            Пока нет данных для отображения.
                        </div>
                    )}

                    <div className={styles.poweredBy}>
                        {showPoweredBy ? 'Powered by ClientBase' : headerTitle}
                    </div>
                </div>
            </div>
        </div>
    );
};
