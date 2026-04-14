import { supabase } from '@/lib/supabase';
import type { Client, Project, Invoice, ClientFile } from '@/assets/data/data';

// ─── Helpers ─────────────────────────────────────────────────────────────

const getUserId = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
};

// ─── Clients ─────────────────────────────────────────────────────────────

export const fetchClients = async (): Promise<Client[]> => {
    const userId = await getUserId();

    // Загружаем клиентов
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!clients || clients.length === 0) return [];

    const clientIds = clients.map((c) => c.id);

    // Загружаем связанные данные параллельно
    const [projectsRes, invoicesRes, filesRes] = await Promise.all([
        supabase.from('projects').select('*').in('client_id', clientIds),
        supabase.from('invoices').select('*').in('client_id', clientIds),
        supabase.from('files').select('*').in('client_id', clientIds),
    ]);

    // Группируем по client_id
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
        })
        .select()
        .single();

    if (error) throw error;
    return mapProject(project);
};

export const updateProject = async (
    projectId: number,
    data: Partial<{ name: string; status: string; progress: number; deadline: string }>
): Promise<void> => {
    const { error } = await supabase.from('projects').update(data).eq('id', projectId);
    if (error) throw error;
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

    // Загружаем в Storage: userId/clientId/filename
    const storagePath = `${userId}/${clientId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(storagePath, file);

    if (uploadError) throw uploadError;

    // Сохраняем запись в таблицу files
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
        .createSignedUrl(storagePath, 60); // URL на 60 секунд

    if (error) throw error;
    return data.signedUrl;
};

export const deleteFile = async (fileId: number, storagePath: string): Promise<void> => {
    // Удаляем из Storage
    const { error: storageError } = await supabase.storage
        .from('client-files')
        .remove([storagePath]);

    if (storageError) throw storageError;

    // Удаляем запись из БД
    const { error: dbError } = await supabase.from('files').delete().eq('id', fileId);
    if (dbError) throw dbError;
};

// ─── Profile ─────────────────────────────────────────────────────────────

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
}): Promise<void> => {
    const userId = await getUserId();
    const { error } = await supabase.from('profiles').update(data).eq('id', userId);
    if (error) throw error;
};

// ─── Portal Tokens ───────────────────────────────────────────────────────

export const getOrCreatePortalToken = async (clientId: number): Promise<string> => {
    const userId = await getUserId();

    // Проверяем, есть ли уже токен
    const { data: existing } = await supabase
        .from('portal_tokens')
        .select('token')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

    if (existing) return existing.token;

    // Создаём новый
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
    // Получаем client_id по токену
    const { data: portalToken, error: tokenError } = await supabase
        .from('portal_tokens')
        .select('client_id')
        .eq('token', token)
        .eq('is_active', true)
        .single();

    if (tokenError || !portalToken) return null;

    const clientId = portalToken.client_id;

    // Загружаем все данные параллельно
    const [clientRes, projectsRes, invoicesRes, filesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('projects').select('*').eq('client_id', clientId).order('created_at'),
        supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at'),
        supabase.from('files').select('*').eq('client_id', clientId).order('created_at'),
    ]);

    if (clientRes.error || !clientRes.data) return null;

    const c = clientRes.data;
    return {
        client: {
            name: c.name,
            company: c.company || '',
            color: c.color || '#6366f1',
        },
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

function groupBy<T>(arr: T[], key: string): Record<string, T[]> {
    return arr.reduce((acc, item) => {
        const k = (item as any)[key];
        if (!acc[k]) acc[k] = [];
        acc[k].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}
