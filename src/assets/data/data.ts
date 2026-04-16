// ─── Types ───────────────────────────────────────────────────────────────

export type ProjectStatus = 'brief' | 'in_progress' | 'review' | 'done';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type FileType = 'pdf' | 'design' | 'image' | 'archive' | 'doc';

export type ProjectPriority = 'normal' | 'urgent';

export interface ProjectTask {
    id: number;
    text: string;
    done: boolean;
    position: number;
}

export interface Project {
    id: number;
    name: string;
    status: ProjectStatus;
    progress: number;
    deadline: string;
    description: string;
    priority: ProjectPriority;
}

export interface Invoice {
    id: number;
    number: string;
    amount: number;
    status: InvoiceStatus;
    date: string;
    dueDate: string;
}

export interface ClientFile {
    id: number;
    name: string;
    size: string;
    date: string;
    type: FileType;
    storagePath?: string;
}

export interface TimeEntry {
    id: number;
    projectId: number;
    projectName: string;
    description: string;
    duration: number;       // в секундах
    hourlyRate: number | null;
    date: string;
}

export interface Client {
    id: number;
    name: string;
    company: string;
    email: string;
    avatar: string;
    color: string;
    showCardInPortal?: boolean;
    projects: Project[];
    invoices: Invoice[];
    files: ClientFile[];
}

// ─── Status Maps ─────────────────────────────────────────────────────────

export const STATUS_MAP: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
    brief:       { label: 'Бриф',      color: '#94a3b8', bg: '#f1f5f9' },
    in_progress: { label: 'В работе',  color: '#6366f1', bg: '#eef2ff' },
    review:      { label: 'На ревью',  color: '#f59e0b', bg: '#fefce8' },
    done:        { label: 'Готово',     color: '#22c55e', bg: '#f0fdf4' },
};

export const INVOICE_STATUS_MAP: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
    paid:    { label: 'Оплачен',   color: '#22c55e', bg: '#f0fdf4' },
    pending: { label: 'Ожидает',   color: '#f59e0b', bg: '#fefce8' },
    overdue: { label: 'Просрочен', color: '#ef4444', bg: '#fef2f2' },
};

export const FILE_ICONS: Record<FileType, string> = {
    pdf:     '📄',
    design:  '🎨',
    image:   '🖼️',
    archive: '📦',
    doc:     '📝',
};

export const AVATAR_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── Helpers ─────────────────────────────────────────────────────────────

export const formatMoney = (n: number): string => n.toLocaleString('ru-RU') + ' ₽';

export const formatDate = (d: string): string =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

export const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m} мин`;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
};

// ─── Mock Data ───────────────────────────────────────────────────────────

export const CLIENTS_DATA: Client[] = [
    {
        id: 1,
        name: 'Алексей Петров',
        company: 'StartupFlow',
        email: 'alex@startupflow.io',
        avatar: 'AP',
        color: '#6366f1',
        projects: [
            { id: 1, name: 'Редизайн лендинга',  status: 'review',      progress: 75, deadline: '2026-04-28', description: '', priority: 'normal' as ProjectPriority },
            { id: 2, name: 'Мобильная адаптация', status: 'in_progress', progress: 40, deadline: '2026-05-15', description: '', priority: 'normal' as ProjectPriority },
        ],
        invoices: [
            { id: 1, number: 'INV-001', amount: 85000,  status: 'paid',    date: '2026-03-01', dueDate: '2026-03-15' },
            { id: 2, number: 'INV-002', amount: 45000,  status: 'pending', date: '2026-04-01', dueDate: '2026-04-15' },
        ],
        files: [
            { id: 1, name: 'Brand_Guidelines_v2.pdf', size: '4.2 MB',  date: '2026-03-20', type: 'pdf' },
            { id: 2, name: 'Homepage_Final.fig',       size: '18.7 MB', date: '2026-04-05', type: 'design' },
            { id: 3, name: 'Wireframes.png',           size: '2.1 MB',  date: '2026-04-10', type: 'image' },
        ],
    },
    {
        id: 2,
        name: 'Мария Козлова',
        company: 'DesignStudio Pro',
        email: 'maria@dspro.ru',
        avatar: 'МК',
        color: '#ec4899',
        projects: [
            { id: 3, name: 'Брендбук',       status: 'done',        progress: 100, deadline: '2026-03-30', description: '', priority: 'normal' as ProjectPriority },
            { id: 4, name: 'Соцсети пакет',   status: 'in_progress', progress: 60, deadline: '2026-05-01', description: '', priority: 'normal' as ProjectPriority },
        ],
        invoices: [
            { id: 3, number: 'INV-003', amount: 120000, status: 'paid',    date: '2026-02-15', dueDate: '2026-03-01' },
            { id: 4, number: 'INV-004', amount: 65000,  status: 'overdue', date: '2026-03-15', dueDate: '2026-04-01' },
        ],
        files: [
            { id: 4, name: 'Brandbook_Final.pdf',    size: '12.4 MB', date: '2026-03-28', type: 'pdf' },
            { id: 5, name: 'Social_Templates.zip',   size: '45.0 MB', date: '2026-04-08', type: 'archive' },
        ],
    },
    {
        id: 3,
        name: 'Дмитрий Волков',
        company: 'TechBridge',
        email: 'dima@techbridge.dev',
        avatar: 'ДВ',
        color: '#14b8a6',
        projects: [
            { id: 5, name: 'API интеграция', status: 'in_progress', progress: 30, deadline: '2026-05-20', description: '', priority: 'normal' as ProjectPriority },
        ],
        invoices: [
            { id: 5, number: 'INV-005', amount: 200000, status: 'pending', date: '2026-04-10', dueDate: '2026-04-25' },
        ],
        files: [
            { id: 6, name: 'API_Documentation.md', size: '0.8 MB', date: '2026-04-09', type: 'doc' },
        ],
    },
    {
        id: 4,
        name: 'Елена Смирнова',
        company: 'GreenLeaf',
        email: 'elena@greenleaf.eco',
        avatar: 'ЕС',
        color: '#f59e0b',
        projects: [
            { id: 6, name: 'Эко-маркетплейс', status: 'brief', progress: 5, deadline: '2026-06-01', description: '', priority: 'normal' as ProjectPriority },
        ],
        invoices: [],
        files: [
            { id: 7, name: 'Brief_Marketplace.docx', size: '1.2 MB', date: '2026-04-12', type: 'doc' },
        ],
    },
];
