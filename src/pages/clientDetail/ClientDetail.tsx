import React, { useState, useRef } from 'react';
import {
    Client,
    ClientFile,
    Project,
    Invoice,
    ProjectStatus,
    InvoiceStatus,
    STATUS_MAP,
    INVOICE_STATUS_MAP,
    FILE_ICONS,
    formatMoney,
    formatDate,
} from '@/assets/data/data';
import { createProject, updateProject, deleteProject, createInvoice, updateInvoice, deleteInvoice, uploadFile, downloadFile, deleteFile, getOrCreatePortalToken, deactivatePortalToken, sendNotification } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { PortalPreview } from '@/pages/portalPreview/PortalPreview';
import { ProjectModal } from '@/components/modal/ProjectModal';
import { InvoiceModal } from '@/components/modal/InvoiceModal';
import { BrandingSettings } from '@/components/branding/BrandingSettings';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import * as styles from './ClientDetail.module.scss';

interface ClientDetailProps {
    client: Client;
    onEditClient?: () => void;
    onClientUpdated?: (client: Client) => void;
    isPro?: boolean;
    onUpgrade?: () => void;
    onDataChanged?: () => void;
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
                                                              isPro = false,
                                                              onUpgrade,
                                                              onDataChanged,
                                                          }) => {
    const [tab, setTab] = useState<TabKey>('projects');
    const [showPortal, setShowPortal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    const [projects, setProjects] = useState(client.projects);
    const [invoices, setInvoices] = useState(client.invoices);
    const [files, setFiles] = useState(client.files);

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
        onDataChanged?.();
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
            onDataChanged?.();
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
            onDataChanged?.();
            sendNotification({ type: 'project_created', clientId: client.id, projectName: data.name });
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    };

    const handleUpdateProject = async (
        projectId: number,
        data: { name: string; status: string; progress: number; deadline: string }
    ) => {
        try {
            const oldProject = projects.find((p) => p.id === projectId);
            await updateProject(projectId, data);
            setProjects((prev) =>
                prev.map((p) =>
                    p.id === projectId ? { ...p, ...data, status: data.status as ProjectStatus } : p
                )
            );
            onDataChanged?.();
            if (oldProject && oldProject.status !== data.status) {
                sendNotification({ type: 'project_status', clientId: client.id, projectName: data.name, newStatus: data.status });
            }
        } catch (err) {
            console.error('Failed to update project:', err);
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        try {
            await deleteProject(projectId);
            setProjects((prev) => prev.filter((p) => p.id !== projectId));
            onDataChanged?.();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        setShowProjectModal(true);
    };

    const handleUpdateInvoice = async (
        invoiceId: number,
        data: { number: string; amount: number; status: string; date: string; due_date: string }
    ) => {
        try {
            await updateInvoice(invoiceId, data);
            setInvoices((prev) =>
                prev.map((inv) =>
                    inv.id === invoiceId
                        ? { ...inv, number: data.number, amount: data.amount, status: data.status as InvoiceStatus, date: data.date, dueDate: data.due_date }
                        : inv
                )
            );
            onDataChanged?.();
        } catch (err) {
            console.error('Failed to update invoice:', err);
        }
    };

    const handleDeleteInvoice = async (invoiceId: number) => {
        try {
            await deleteInvoice(invoiceId);
            setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
            onDataChanged?.();
        } catch (err) {
            console.error('Failed to delete invoice:', err);
        }
    };

    const handleEditInvoice = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setShowInvoiceModal(true);
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
            onDataChanged?.();
            sendNotification({
                type: 'invoice_created',
                clientId: client.id,
                invoiceNumber: data.number,
                amount: data.amount.toLocaleString('ru-RU') + ' ₽',
                dueDate: data.dueDate,
            });
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
                    onAdd={() => {
                        setEditingProject(null);
                        setShowProjectModal(true);
                    }}
                    onEdit={handleEditProject}
                    onStatusChange={handleUpdateProject}
                />
            )}
            {tab === 'invoices' && (
                <InvoicesTab
                    invoices={invoices}
                    onAdd={() => {
                        setEditingInvoice(null);
                        setShowInvoiceModal(true);
                    }}
                    onEdit={handleEditInvoice}
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
                <PortalTab
                    client={client}
                    onPreview={() => setShowPortal(true)}
                    isPro={isPro}
                    onUpgrade={onUpgrade}
                />
            )}

            {/* Modals */}
            {showPortal && (
                <PortalPreview client={{ ...client, projects, invoices }} onClose={() => setShowPortal(false)} isPro={isPro} />
            )}
            {showProjectModal && (
                <ProjectModal
                    clientId={client.id}
                    clientEmail={client.email}
                    project={editingProject}
                    onClose={() => {
                        setShowProjectModal(false);
                        setEditingProject(null);
                    }}
                    onSubmit={handleCreateProject}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                />
            )}
            {showInvoiceModal && (
                <InvoiceModal
                    clientId={client.id}
                    clientEmail={client.email}
                    nextNumber={nextInvoiceNumber}
                    invoice={editingInvoice}
                    onClose={() => {
                        setShowInvoiceModal(false);
                        setEditingInvoice(null);
                    }}
                    onSubmit={handleCreateInvoice}
                    onUpdate={handleUpdateInvoice}
                    onDelete={handleDeleteInvoice}
                />
            )}
        </>
    );
};

// ─── Projects (Kanban) ───────────────────────────────────────────────────

const ProjectsTab: React.FC<{
    projects: Project[];
    onAdd: () => void;
    onEdit: (p: Project) => void;
    onStatusChange: (projectId: number, data: { name: string; status: string; progress: number; deadline: string }) => void;
}> = ({ projects, onAdd, onEdit, onStatusChange }) => {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverCol, setDragOverCol] = useState<ProjectStatus | null>(null);

    const handleDragStart = (e: React.DragEvent, project: Project) => {
        setDraggedId(project.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(project.id));
    };

    const handleDragOver = (e: React.DragEvent, col: ProjectStatus) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCol(col);
    };

    const handleDragLeave = () => {
        setDragOverCol(null);
    };

    const handleDrop = (e: React.DragEvent, targetStatus: ProjectStatus) => {
        e.preventDefault();
        setDragOverCol(null);
        setDraggedId(null);

        const projectId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const project = projects.find((p) => p.id === projectId);
        if (!project || project.status === targetStatus) return;

        // Автоматический прогресс при перетаскивании (вперёд и назад)
        let newProgress = project.progress;
        if (targetStatus === 'brief') newProgress = 5;
        if (targetStatus === 'in_progress') newProgress = Math.max(20, Math.min(newProgress, 60));
        if (targetStatus === 'review') newProgress = Math.max(70, Math.min(newProgress, 95));
        if (targetStatus === 'done') newProgress = 100;

        onStatusChange(projectId, {
            name: project.name,
            status: targetStatus,
            progress: newProgress,
            deadline: project.deadline,
        });
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverCol(null);
    };

    return (
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
                    const isOver = dragOverCol === col;
                    return (
                        <div
                            key={col}
                            className={`${styles.kanbanCol} ${isOver ? styles.kanbanColDragOver : ''}`}
                            onDragOver={(e) => handleDragOver(e, col)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, col)}
                        >
                            <div className={styles.kanbanColTitle} style={{ color: s.color }}>
                                <span
                                    className={styles.kanbanDot}
                                    style={{ background: s.color }}
                                />
                                {s.label} ({items.length})
                            </div>
                            {items.map((p) => (
                                <div
                                    key={p.id}
                                    className={`${styles.kanbanCard} ${draggedId === p.id ? styles.kanbanCardDragging : ''}`}
                                    onClick={() => onEdit(p)}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, p)}
                                    onDragEnd={handleDragEnd}
                                >
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
                            {items.length === 0 && !isOver && (
                                <div className={styles.kanbanEmpty}>Пусто</div>
                            )}
                            {isOver && (
                                <div className={styles.kanbanDropHint}>Отпустите здесь</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

// ─── Invoices ────────────────────────────────────────────────────────────

const InvoicesTab: React.FC<{ invoices: Invoice[]; onAdd: () => void; onEdit: (inv: Invoice) => void }> = ({
                                                                                                               invoices,
                                                                                                               onAdd,
                                                                                                               onEdit,
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
                                <tr key={inv.id} onClick={() => onEdit(inv)} style={{ cursor: 'pointer' }}>
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

const PortalTab: React.FC<{
    client: Client;
    onPreview: () => void;
    isPro?: boolean;
    onUpgrade?: () => void;
}> = ({ client, onPreview, isPro = false, onUpgrade }) => {
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
            {/* Ссылка для клиента */}
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

            {/* Брендинг — заблюренный для Free, рабочий для Pro */}
            <BrandingSettings isPro={isPro} onUpgrade={onUpgrade} />

            {/* Настройки уведомлений */}
            <NotificationSettings clientId={client.id} clientEmail={client.email} />

            {/* Предпросмотр */}
            <div className={styles.portalActions}>
                <button className={styles.previewBtnPrimary} onClick={onPreview}>
                    👁️ Предпросмотр портала клиента
                </button>
            </div>
        </div>
    );
};
