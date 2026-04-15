import { supabase } from '@/lib/supabase';
import type { Client, Project, Invoice, ClientFile, TimeEntry, ProjectTask } from '@/assets/data/data';

// ─── Helpers ─────────────────────────────────────────────────────────────

const getUserId = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
};

// ─── Clients ─────────────────────────────────────────────────────────────

export const fetchClients = async (): Promise<Client[]> => {
    const userId = await getUserId();

    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!clients || clients.length === 0) return [];

    const clientIds = clients.map((c) => c.id);

    const [projectsRes, invoicesRes, filesRes] = await Promise.all([
        supabase.from('projects').select('*').in('client_id', clientIds),
        supabase.from('invoices').select('*').in('client_id', clientIds),
        supabase.from('files').select('*').in('client_id', clientIds),
    ]);

    const projectsByClient = groupBy(projectsRes.data || [], 'client_id');
    const invoicesByClient = groupBy(invoicesRes.data || [], 'client_id');
    const filesByClient = groupBy(filesRes.data || [], 'client_id');

    return clients.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company || '',
        email: c.email || '',
        avatar: c.avatar || c.name.slice(0, 2).toUpperCase(),
        color: c.color || '#6366f1',
        projects: (projectsByClient[c.id] || []).map(mapProject),
        invoices: (invoicesByClient[c.id] || []).map(mapInvoice),
        files: (filesByClient[c.id] || []).map(mapFile),
    }));
};

export const createClient = async (data: {
    name: string;
    company: string;
    email: string;
    avatar: string;
    color: string;
}): Promise<Client> => {
    const userId = await getUserId();

    const { data: client, error } = await supabase
        .from('clients')
        .insert({
            user_id: userId,
            name: data.name,
            company: data.company,
            email: data.email,
            avatar: data.avatar,
            color: data.color,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: client.id,
        name: client.name,
        company: client.company || '',
        email: client.email || '',
        avatar: client.avatar || '',
        color: client.color || '#6366f1',
        projects: [],
        invoices: [],
        files: [],
    };
};

export const deleteClient = async (clientId: number): Promise<void> => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) throw error;
};

export const updateClient = async (
    clientId: number,
    data: { name?: string; company?: string; email?: string; avatar?: string; color?: string }
): Promise<void> => {
    const { error } = await supabase.from('clients').update(data).eq('id', clientId);
    if (error) throw error;
};

// ─── Projects ────────────────────────────────────────────────────────────

export const createProject = async (data: {
    clientId: number;
    name: string;
    status?: string;
    progress?: number;
    deadline?: string;
    description?: string;
    priority?: string;
}): Promise<Project> => {
    const userId = await getUserId();

    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            user_id: userId,
            client_id: data.clientId,
            name: data.name,
            status: data.status || 'brief',
            progress: data.progress || 0,
            deadline: data.deadline || null,
            description: data.description || '',
            priority: data.priority || 'normal',
        })
        .select()
        .single();

    if (error) throw error;
    return mapProject(project);
};

export const updateProject = async (
    projectId: number,
    data: Partial<{ name: string; status: string; progress: number; deadline: string; description: string; priority: string }>
): Promise<void> => {
    const { error } = await supabase.from('projects').update(data).eq('id', projectId);
    if (error) throw error;
};

export const deleteProject = async (projectId: number): Promise<void> => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
};

// ─── Project Notes ───────────────────────────────────────────────────────

export interface ProjectNote {
    id: number;
    project_id: number;
    text: string;
    visible_to_client: boolean;
    created_at: string;
}

export const fetchProjectNotes = async (projectId: number): Promise<ProjectNote[]> => {
    const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProjectNote[];
};

export const createProjectNote = async (data: {
    projectId: number;
    text: string;
    visibleToClient?: boolean;
}): Promise<ProjectNote> => {
    const userId = await getUserId();

    const { data: note, error } = await supabase
        .from('project_notes')
        .insert({
            project_id: data.projectId,
            user_id: userId,
            text: data.text,
            visible_to_client: data.visibleToClient ?? true,
        })
        .select()
        .single();

    if (error) throw error;
    return note as ProjectNote;
};

export const deleteProjectNote = async (noteId: number): Promise<void> => {
    const { error } = await supabase.from('project_notes').delete().eq('id', noteId);
    if (error) throw error;
};

// Для публичного портала — заметки по client_id
export const fetchPortalNotes = async (projectIds: number[]): Promise<ProjectNote[]> => {
    if (projectIds.length === 0) return [];
    const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .in('project_id', projectIds)
        .eq('visible_to_client', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProjectNote[];
};

// ─── Invoices ────────────────────────────────────────────────────────────

export const createInvoice = async (data: {
    clientId: number;
    number: string;
    amount: number;
    status?: string;
    date?: string;
    dueDate?: string;
}): Promise<Invoice> => {
    const userId = await getUserId();

    const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
            user_id: userId,
            client_id: data.clientId,
            number: data.number,
            amount: data.amount,
            status: data.status || 'pending',
            date: data.date || new Date().toISOString().split('T')[0],
            due_date: data.dueDate || null,
        })
        .select()
        .single();

    if (error) throw error;
    return mapInvoice(invoice);
};

export const updateInvoice = async (
    invoiceId: number,
    data: Partial<{ number: string; amount: number; status: string; date: string; due_date: string }>
): Promise<void> => {
    const { error } = await supabase.from('invoices').update(data).eq('id', invoiceId);
    if (error) throw error;
};

export const deleteInvoice = async (invoiceId: number): Promise<void> => {
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (error) throw error;
};

// ─── Files (Storage) ─────────────────────────────────────────────────────

const FILE_TYPE_MAP: Record<string, ClientFile['type']> = {
    'application/pdf': 'pdf',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'application/zip': 'archive',
    'application/x-rar-compressed': 'archive',
    'application/x-7z-compressed': 'archive',
};

function detectFileType(file: File): ClientFile['type'] {
    if (FILE_TYPE_MAP[file.type]) return FILE_TYPE_MAP[file.type];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['fig', 'sketch', 'psd', 'ai', 'xd'].includes(ext)) return 'design';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    if (['pdf'].includes(ext)) return 'pdf';
    return 'doc';
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const uploadFile = async (clientId: number, file: File): Promise<ClientFile> => {
    const userId = await getUserId();

    const storagePath = `${userId}/${clientId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(storagePath, file);

    if (uploadError) throw uploadError;

    const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert({
            user_id: userId,
            client_id: clientId,
            name: file.name,
            size: formatFileSize(file.size),
            file_type: detectFileType(file),
            storage_path: storagePath,
        })
        .select()
        .single();

    if (dbError) throw dbError;
    return mapFile(fileRecord);
};

export const downloadFile = async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
        .from('client-files')
        .createSignedUrl(storagePath, 60);

    if (error) throw error;
    return data.signedUrl;
};

export const deleteFile = async (fileId: number, storagePath: string): Promise<void> => {
    const { error: storageError } = await supabase.storage
        .from('client-files')
        .remove([storagePath]);

    if (storageError) throw storageError;

    const { error: dbError } = await supabase.from('files').delete().eq('id', fileId);
    if (dbError) throw dbError;
};

// ─── Profile ─────────────────────────────────────────────────────────────

export interface BrandingData {
    company_name: string;
    brand_color: string;
    logo_url: string | null;
}

export const fetchProfile = async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

export const updateProfile = async (data: {
    full_name?: string;
    company_name?: string;
    brand_color?: string;
    logo_url?: string | null;
    business_name?: string;
    inn?: string;
    bank_name?: string;
    bank_account?: string;
    bank_bik?: string;
    corr_account?: string;
    currency?: string;
    default_rate?: number | null;
    locale?: string;
}): Promise<void> => {
    const userId = await getUserId();
    const { error } = await supabase.from('profiles').update(data).eq('id', userId);
    if (error) throw error;
};

export const uploadLogo = async (file: File): Promise<string> => {
    const userId = await getUserId();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const storagePath = `${userId}/logo_${Date.now()}.${ext}`;

    // Удаляем старый лого если есть
    const { data: oldFiles } = await supabase.storage
        .from('brand-logos')
        .list(userId);

    if (oldFiles && oldFiles.length > 0) {
        await supabase.storage
            .from('brand-logos')
            .remove(oldFiles.map((f) => `${userId}/${f.name}`));
    }

    // Загружаем новый
    const { error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(storagePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Получаем публичный URL
    const { data } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(storagePath);

    const logoUrl = data.publicUrl;

    // Сохраняем в профиль
    await updateProfile({ logo_url: logoUrl });

    return logoUrl;
};

export const deleteLogo = async (): Promise<void> => {
    const userId = await getUserId();

    const { data: files } = await supabase.storage
        .from('brand-logos')
        .list(userId);

    if (files && files.length > 0) {
        await supabase.storage
            .from('brand-logos')
            .remove(files.map((f) => `${userId}/${f.name}`));
    }

    await updateProfile({ logo_url: null });
};

// ─── Portal Tokens ───────────────────────────────────────────────────────

export const getOrCreatePortalToken = async (clientId: number): Promise<string> => {
    const userId = await getUserId();

    const { data: existing } = await supabase
        .from('portal_tokens')
        .select('token')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

    if (existing) return existing.token;

    const { data: created, error } = await supabase
        .from('portal_tokens')
        .insert({ client_id: clientId, user_id: userId })
        .select('token')
        .single();

    if (error) throw error;
    return created.token;
};

export const deactivatePortalToken = async (clientId: number): Promise<void> => {
    const { error } = await supabase
        .from('portal_tokens')
        .update({ is_active: false })
        .eq('client_id', clientId);

    if (error) throw error;
};

export const regeneratePortalToken = async (clientId: number): Promise<string> => {
    await deactivatePortalToken(clientId);
    return getOrCreatePortalToken(clientId);
};

// Публичный запрос — без авторизации, по токену
export const fetchPortalData = async (token: string) => {
    // Получаем client_id и user_id по токену
    const { data: portalToken, error: tokenError } = await supabase
        .from('portal_tokens')
        .select('client_id, user_id')
        .eq('token', token)
        .eq('is_active', true)
        .single();

    if (tokenError || !portalToken) return null;

    const clientId = portalToken.client_id;
    const userId = portalToken.user_id;

    // Загружаем все данные + branding из profiles
    const [clientRes, projectsRes, invoicesRes, filesRes, profileRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('projects').select('*').eq('client_id', clientId).order('created_at'),
        supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at'),
        supabase.from('files').select('*').eq('client_id', clientId).order('created_at'),
        supabase.from('profiles').select('company_name, brand_color, logo_url').eq('id', userId).single(),
    ]);

    if (clientRes.error || !clientRes.data) return null;

    const c = clientRes.data;
    const profile = profileRes.data;

    // Проверяем подписку для branding
    const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    const isPro = sub?.plan === 'pro';

    return {
        client: {
            name: c.name,
            company: c.company || '',
            color: c.color || '#6366f1',
        },
        // Branding доступен только для Pro
        branding: isPro && profile ? {
            companyName: profile.company_name || null,
            brandColor: profile.brand_color || null,
            logoUrl: profile.logo_url || null,
        } : null,
        projects: (projectsRes.data || []).map(mapProject),
        invoices: (invoicesRes.data || []).map(mapInvoice),
        files: (filesRes.data || []).map(mapFile),
    };
};

// ─── Mappers ─────────────────────────────────────────────────────────────

function mapProject(p: any): Project {
    return {
        id: p.id,
        name: p.name,
        status: p.status || 'brief',
        progress: p.progress || 0,
        deadline: p.deadline || '',
        description: p.description || '',
        priority: p.priority || 'normal',
    };
}

function mapInvoice(i: any): Invoice {
    return {
        id: i.id,
        number: i.number,
        amount: i.amount,
        status: i.status || 'pending',
        date: i.date || '',
        dueDate: i.due_date || '',
    };
}

function mapFile(f: any): ClientFile {
    return {
        id: f.id,
        name: f.name,
        size: f.size || '',
        date: f.created_at || '',
        type: f.file_type || 'doc',
        storagePath: f.storage_path || '',
    };
}

// ─── Notifications ───────────────────────────────────────────────────────

const SUPABASE_URL = 'https://cemtccfulgwewdptkukt.supabase.co';

export interface NotificationSettings {
    notify_project_created: boolean;
    notify_project_status: boolean;
    notify_invoice_created: boolean;
}

export const fetchNotificationSettings = async (clientId: number): Promise<NotificationSettings> => {
    const { data, error } = await supabase
        .from('clients')
        .select('notify_project_created, notify_project_status, notify_invoice_created')
        .eq('id', clientId)
        .single();

    if (error || !data) {
        return { notify_project_created: true, notify_project_status: true, notify_invoice_created: true };
    }
    return data as NotificationSettings;
};

export const updateNotificationSettings = async (
    clientId: number,
    settings: Partial<NotificationSettings>
): Promise<void> => {
    const { error } = await supabase.from('clients').update(settings).eq('id', clientId);
    if (error) throw error;
};

export const sendNotification = async (data: {
    type: 'project_created' | 'project_status' | 'invoice_created';
    clientId: number;
    projectName?: string;
    newStatus?: string;
    invoiceNumber?: string;
    amount?: string;
    dueDate?: string;
}): Promise<void> => {
    try {
        // Проверяем настройки уведомлений клиента
        const settings = await fetchNotificationSettings(data.clientId);
        const typeMap: Record<string, keyof NotificationSettings> = {
            project_created: 'notify_project_created',
            project_status: 'notify_project_status',
            invoice_created: 'notify_invoice_created',
        };
        if (!settings[typeMap[data.type]]) return; // Уведомление выключено

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                ...data,
                origin: window.location.origin,
            }),
        });
    } catch (err) {
        console.error('Failed to send notification:', err);
    }
};

// ─── Project Tasks ──────────────────────────────────────────────────────

export const fetchProjectTasks = async (projectId: number): Promise<ProjectTask[]> => {
    const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

    if (error) throw error;
    return (data || []).map((t: any) => ({
        id: t.id,
        text: t.text,
        done: t.done,
        position: t.position,
    }));
};

export const createProjectTask = async (data: {
    projectId: number;
    text: string;
    position: number;
}): Promise<ProjectTask> => {
    const userId = await getUserId();

    const { data: task, error } = await supabase
        .from('project_tasks')
        .insert({
            user_id: userId,
            project_id: data.projectId,
            text: data.text,
            position: data.position,
        })
        .select()
        .single();

    if (error) throw error;
    return { id: task.id, text: task.text, done: task.done, position: task.position };
};

export const updateProjectTask = async (
    taskId: number,
    data: Partial<{ text: string; done: boolean; position: number }>
): Promise<void> => {
    const { error } = await supabase.from('project_tasks').update(data).eq('id', taskId);
    if (error) throw error;
};

export const deleteProjectTask = async (taskId: number): Promise<void> => {
    const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
    if (error) throw error;
};

// ─── Time Tracking ───────────────────────────────────────────────────────

export const fetchTimeEntries = async (projectIds: number[]): Promise<TimeEntry[]> => {
    if (projectIds.length === 0) return [];

    const { data, error } = await supabase
        .from('time_entries')
        .select('*, projects!inner(name)')
        .in('project_id', projectIds)
        .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTimeEntry);
};

export const createTimeEntry = async (data: {
    projectId: number;
    description: string;
    duration: number;
    hourlyRate: number | null;
    date: string;
}): Promise<TimeEntry> => {
    const userId = await getUserId();

    const { data: entry, error } = await supabase
        .from('time_entries')
        .insert({
            user_id: userId,
            project_id: data.projectId,
            description: data.description,
            duration: data.duration,
            hourly_rate: data.hourlyRate,
            date: data.date,
        })
        .select('*, projects!inner(name)')
        .single();

    if (error) throw error;
    return mapTimeEntry(entry);
};

export const updateTimeEntry = async (
    entryId: number,
    data: Partial<{
        projectId: number;
        description: string;
        duration: number;
        hourlyRate: number | null;
        date: string;
    }>
): Promise<void> => {
    const update: Record<string, any> = {};
    if (data.projectId !== undefined) update.project_id = data.projectId;
    if (data.description !== undefined) update.description = data.description;
    if (data.duration !== undefined) update.duration = data.duration;
    if (data.hourlyRate !== undefined) update.hourly_rate = data.hourlyRate;
    if (data.date !== undefined) update.date = data.date;

    const { error } = await supabase.from('time_entries').update(update).eq('id', entryId);
    if (error) throw error;
};

export const deleteTimeEntry = async (entryId: number): Promise<void> => {
    const { error } = await supabase.from('time_entries').delete().eq('id', entryId);
    if (error) throw error;
};

function mapTimeEntry(e: any): TimeEntry {
    return {
        id: e.id,
        projectId: e.project_id,
        projectName: e.projects?.name || '',
        description: e.description || '',
        duration: e.duration || 0,
        hourlyRate: e.hourly_rate,
        date: e.date || '',
    };
}

function groupBy<T>(arr: T[], key: string): Record<string, T[]> {
    return arr.reduce((acc, item) => {
        const k = (item as any)[key];
        if (!acc[k]) acc[k] = [];
        acc[k].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}
