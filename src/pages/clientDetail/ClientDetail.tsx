import React, { useState, useRef } from 'react';
import {
    Client,
    ClientFile,
    Project,
    ProjectStatus,
    STATUS_MAP,
    INVOICE_STATUS_MAP,
    FILE_ICONS,
    formatMoney,
    formatDate,
} from '@/assets/data/data';
import { createProject, createInvoice, uploadFile, downloadFile, deleteFile, getOrCreatePortalToken, deactivatePortalToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { PortalPreview } from '@/pages/portalPreview/PortalPreview';
import { ProjectModal } from '@/components/modal/ProjectModal';
import { InvoiceModal } from '@/components/modal/InvoiceModal';
import * as styles from './ClientDetail.module.scss';

interface ClientDetailProps {
    client: Client;
    onEditClient?: () => void;
    onClientUpdated?: (client: Client) => void;
}

type TabKey = 'projects' | 'invoices' | 'files' | 'portal';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'projects', label: 'Проекты', icon: '📋' },
    { key: 'invoices', label: 'Счета',   icon: '💳' },
    { key: 'files',    label: 'Файлы',   icon: '📁' },
    { key: 'portal',   label: 'Портал',  icon: '🔗' },
];

const KANBAN_COLS: ProjectStatus[] = ['brief', 'in_progress', 'review', 'done'];

export const ClientDetail: React.FC<ClientDetailProps> = ({
                                                              client,
                                                              onEditClient,
                                                              onClientUpdated,
                                                          }) => {
    const [tab, setTab] = useState<TabKey>('projects');
    const [showPortal, setShowPortal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Локальный стейт для проектов, инвойсов и файлов
    const [projects, setProjects] = useState(client.projects);
    const [invoices, setInvoices] = useState(client.invoices);
    const [files, setFiles] = useState(client.files);

    // Обновляем локальный стейт при смене клиента
    React.useEffect(() => {
        setProjects(client.projects);
        setInvoices(client.invoices);
        setFiles(client.files);
        setTab('projects');
    }, [client.id]);

    const handleUploadFiles = async (fileList: FileList) => {
        for (let i = 0; i < fileList.length; i++) {
            try {
                const created = await uploadFile(client.id, fileList[i]);
                setFiles((prev) => [...prev, created]);
            } catch (err) {
                console.error('Failed to upload file:', err);
            }
        }
    };

    const handleDownloadFile = async (f: ClientFile) => {
        if (!f.storagePath) return;
        try {
            const url = await downloadFile(f.storagePath);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Failed to download file:', err);
        }
    };

    const handleDeleteFile = async (f: ClientFile) => {
        if (!f.storagePath) return;
        try {
            await deleteFile(f.id, f.storagePath);
            setFiles((prev) => prev.filter((file) => file.id !== f.id));
        } catch (err) {
            console.error('Failed to delete file:', err);
        }
    };

    const handleCreateProject = async (data: {
        clientId: number;
        name: string;
        status: ProjectStatus;
        progress: number;
        deadline: string;
    }) => {
        try {
            const created = await createProject({
                clientId: data.clientId,
                name: data.name,
                status: data.status,
                progress: data.progress,
                deadline: data.deadline,
            });
            setProjects((prev) => [...prev, created]);
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    };

    const handleCreateInvoice = async (data: {
        clientId: number;
        number: string;
        amount: number;
        status: string;
        date: string;
        dueDate: string;
    }) => {
        try {
            const created = await createInvoice({
                clientId: data.clientId,
                number: data.number,
                amount: data.amount,
                status: data.status,
                date: data.date,
                dueDate: data.dueDate,
            });
            setInvoices((prev) => [...prev, created]);
        } catch (err) {
            console.error('Failed to create invoice:', err);
        }
    };

    const nextInvoiceNumber = `INV-${String(invoices.length + 1).padStart(3, '0')}`;

    return (
        <>
            {/* Header */}
            <div className={styles.header}>
                <div
                    className={styles.avatar}
                    style={{ background: client.color + '22', color: client.color }}
                >
                    {client.avatar}
                </div>
                <div className={styles.headerInfo}>
                    <div className={styles.headerName}>{client.name}</div>
                    <div className={styles.headerMeta}>
                        {client.company} · {client.email}
                    </div>
                </div>
                {onEditClient && (
                    <button className={styles.editBtn} onClick={onEditClient}>
                        ✏️ Редактировать
                    </button>
                )}
                <button className={styles.previewBtn} onClick={() => setShowPortal(true)}>
                    👁️ Предпросмотр портала
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.icon} {t.label}
                        {t.key === 'projects' && projects.length > 0 && (
                            <span className={styles.tabCount}>{projects.length}</span>
                        )}
                        {t.key === 'invoices' && invoices.length > 0 && (
                            <span className={styles.tabCount}>{invoices.length}</span>
                        )}
                        {t.key === 'files' && files.length > 0 && (
                            <span className={styles.tabCount}>{files.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === 'projects' && (
                <ProjectsTab
                    projects={projects}
                    onAdd={() => setShowProjectModal(true)}
                />
            )}
            {tab === 'invoices' && (
                <InvoicesTab
                    invoices={invoices}
                    onAdd={() => setShowInvoiceModal(true)}
                />
            )}
            {tab === 'files' && (
                <FilesTab
                    files={files}
                    onUpload={handleUploadFiles}
                    onDownload={handleDownloadFile}
                    onDelete={handleDeleteFile}
                />
            )}
            {tab === 'portal' && (
                <PortalTab client={client} onPreview={() => setShowPortal(true)} />
            )}

            {/* Modals */}
            {showPortal && (
                <PortalPreview client={{ ...client, projects, invoices }} onClose={() => setShowPortal(false)} />
            )}
            {showProjectModal && (
                <ProjectModal
                    clientId={client.id}
                    onClose={() => setShowProjectModal(false)}
                    onSubmit={handleCreateProject}
                />
            )}
            {showInvoiceModal && (
                <InvoiceModal
                    clientId={client.id}
                    nextNumber={nextInvoiceNumber}
                    onClose={() => setShowInvoiceModal(false)}
                    onSubmit={handleCreateInvoice}
                />
            )}
        </>
    );
};

// ─── Projects (Kanban) ───────────────────────────────────────────────────

const ProjectsTab: React.FC<{ projects: Project[]; onAdd: () => void }> = ({
                                                                               projects,
                                                                               onAdd,
                                                                           }) => (
    <>
        <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
                Проекты
                {projects.length === 0 && (
                    <span className={styles.emptyHint}> — пока нет проектов</span>
                )}
            </div>
            <button className={styles.addBtn} onClick={onAdd}>
                + Добавить проект
            </button>
        </div>
        <div className={styles.kanban}>
            {KANBAN_COLS.map((col) => {
                const s = STATUS_MAP[col];
                const items = projects.filter((p) => p.status === col);
                return (
                    <div key={col} className={styles.kanbanCol}>
                        <div className={styles.kanbanColTitle} style={{ color: s.color }}>
                            <span
                                className={styles.kanbanDot}
                                style={{ background: s.color }}
                            />
                            {s.label} ({items.length})
                        </div>
                        {items.map((p) => (
                            <div key={p.id} className={styles.kanbanCard}>
                                <div className={styles.kanbanCardName}>{p.name}</div>
                                <div className={styles.progressRow}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: p.progress + '%', background: s.color }}
                                        />
                                    </div>
                                    <span className={styles.progressLabel}>{p.progress}%</span>
                                </div>
                                {p.deadline && (
                                    <div className={styles.kanbanDeadline}>
                                        Дедлайн: {formatDate(p.deadline)}
                                    </div>
                                )}
                            </div>
                        ))}
                        {items.length === 0 && (
                            <div className={styles.kanbanEmpty}>Пусто</div>
                        )}
                    </div>
                );
            })}
        </div>
    </>
);

// ─── Invoices ────────────────────────────────────────────────────────────

const InvoicesTab: React.FC<{ invoices: Client['invoices']; onAdd: () => void }> = ({
                                                                                        invoices,
                                                                                        onAdd,
                                                                                    }) => {
    const total = invoices.reduce((s, i) => s + i.amount, 0);
    const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const pending = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);

    return (
        <>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Счета</div>
                <button className={styles.addBtn} onClick={onAdd}>
                    + Новый счёт
                </button>
            </div>

            {invoices.length > 0 && (
                <div className={styles.invoiceStats}>
                    <div className={styles.invoiceStat}>
                        <span className={styles.invoiceStatLabel}>Всего</span>
                        <span className={styles.invoiceStatValue}>{formatMoney(total)}</span>
                    </div>
                    <div className={styles.invoiceStat}>
                        <span className={styles.invoiceStatLabel}>Оплачено</span>
                        <span className={styles.invoiceStatValueGreen}>{formatMoney(paid)}</span>
                    </div>
                    <div className={styles.invoiceStat}>
                        <span className={styles.invoiceStatLabel}>К оплате</span>
                        <span className={styles.invoiceStatValueYellow}>{formatMoney(pending)}</span>
                    </div>
                </div>
            )}

            {invoices.length === 0 ? (
                <div className={styles.empty}>Счетов пока нет. Создайте первый!</div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Номер</th>
                            <th>Сумма</th>
                            <th>Дата</th>
                            <th>Оплата до</th>
                            <th>Статус</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invoices.map((inv) => {
                            const s = INVOICE_STATUS_MAP[inv.status];
                            return (
                                <tr key={inv.id}>
                                    <td className={styles.bold}>{inv.number}</td>
                                    <td className={styles.amount}>{formatMoney(inv.amount)}</td>
                                    <td className={styles.muted}>{formatDate(inv.date)}</td>
                                    <td className={styles.muted}>
                                        {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                                    </td>
                                    <td>
                                            <span
                                                className={styles.badge}
                                                style={{ color: s.color, background: s.bg }}
                                            >
                                                ● {s.label}
                                            </span>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

// ─── Files ───────────────────────────────────────────────────────────────

const FilesTab: React.FC<{
    files: ClientFile[];
    onUpload: (files: FileList) => void;
    onDownload: (f: ClientFile) => void;
    onDelete: (f: ClientFile) => void;
}> = ({ files, onUpload, onDownload, onDelete }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            await onUpload(e.target.files);
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Файлы</div>
                <button
                    className={styles.addBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? '⏳ Загрузка...' : '+ Загрузить файл'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </div>
            {files.length === 0 ? (
                <div className={styles.emptyFiles}>
                    <div className={styles.emptyIcon}>📁</div>
                    <div className={styles.emptyText}>Файлов пока нет</div>
                    <div className={styles.emptyHint}>
                        Загрузите файлы для клиента — они будут доступны в портале
                    </div>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    {files.map((f) => (
                        <div key={f.id} className={styles.fileRow}>
                            <span className={styles.fileIcon}>{FILE_ICONS[f.type] || '📄'}</span>
                            <div className={styles.fileInfo}>
                                <div className={styles.fileName}>{f.name}</div>
                                <div className={styles.fileMeta}>
                                    {f.size} · {formatDate(f.date)}
                                </div>
                            </div>
                            {deleteConfirmId === f.id ? (
                                <div className={styles.fileActions}>
                                    <button
                                        className={styles.fileDeleteConfirm}
                                        onClick={() => {
                                            onDelete(f);
                                            setDeleteConfirmId(null);
                                        }}
                                    >
                                        Удалить
                                    </button>
                                    <button
                                        className={styles.fileCancelBtn}
                                        onClick={() => setDeleteConfirmId(null)}
                                    >
                                        Нет
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.fileActions}>
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={() => onDownload(f)}
                                    >
                                        ⬇ Скачать
                                    </button>
                                    <button
                                        className={styles.fileDeleteBtn}
                                        onClick={() => setDeleteConfirmId(f.id)}
                                    >
                                        🗑
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

// ─── Portal settings ────────────────────────────────────────────────────

const PortalTab: React.FC<{ client: Client; onPreview: () => void }> = ({
                                                                            client,
                                                                            onPreview,
                                                                        }) => {
    const [portalToken, setPortalToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const portalUrl = portalToken
        ? `${window.location.origin}/portal/${portalToken}`
        : null;

    const handleActivate = async () => {
        setLoading(true);
        try {
            const token = await getOrCreatePortalToken(client.id);
            setPortalToken(token);
        } catch (err) {
            console.error('Failed to create portal token:', err);
        }
        setLoading(false);
    };

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            await deactivatePortalToken(client.id);
            setPortalToken(null);
        } catch (err) {
            console.error('Failed to deactivate portal:', err);
        }
        setLoading(false);
    };

    const handleCopy = () => {
        if (portalUrl) {
            navigator.clipboard.writeText(portalUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Загружаем существующий токен при монтировании
    React.useEffect(() => {
        const loadToken = async () => {
            try {
                const { data } = await supabase
                    .from('portal_tokens')
                    .select('token')
                    .eq('client_id', client.id)
                    .eq('is_active', true)
                    .single();
                if (data) setPortalToken(data.token);
            } catch {}
        };
        loadToken();
    }, [client.id]);

    return (
        <div>
            <div className={styles.portalLinkCard}>
                <div className={styles.portalLinkLabel}>Ссылка для клиента</div>
                {portalUrl ? (
                    <>
                        <div className={styles.portalLinkRow}>
                            <div className={styles.portalLinkValue}>{portalUrl}</div>
                            <button className={styles.copyBtn} onClick={handleCopy}>
                                {copied ? '✅ Скопировано!' : '📋 Копировать'}
                            </button>
                        </div>
                        <div className={styles.portalActiveRow}>
                            <span className={styles.portalActiveLabel}>● Портал активен</span>
                            <button className={styles.deactivateBtn} onClick={handleDeactivate} disabled={loading}>
                                Деактивировать
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.portalInactive}>
                        <div className={styles.portalInactiveText}>
                            Портал не активирован. Нажмите чтобы создать ссылку для клиента.
                        </div>
                        <button className={styles.activateBtn} onClick={handleActivate} disabled={loading}>
                            {loading ? 'Создание...' : '🔗 Активировать портал'}
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.sectionTitle}>Настройки портала</div>
            <div className={styles.portalSettingsGrid}>
                <div className={styles.settingCard}>
                    <div className={styles.settingLabel}>Цвет бренда</div>
                    <div className={styles.colorRow}>
                        <div
                            className={styles.colorSwatch}
                            style={{ background: client.color }}
                        />
                        <span className={styles.colorHex}>{client.color}</span>
                    </div>
                </div>
                <div className={styles.settingCard}>
                    <div className={styles.settingLabel}>Логотип</div>
                    <div className={styles.settingEmpty}>Не загружен</div>
                </div>
            </div>

            <div className={styles.portalActions}>
                <button className={styles.previewBtnPrimary} onClick={onPreview}>
                    👁️ Предпросмотр портала клиента
                </button>
            </div>
        </div>
    );
};
