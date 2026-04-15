// @ts-nocheck
// supabase/functions/send-notification/index.ts
// Отправляет email-уведомления клиентам через Resend
//
// Deploy: npx supabase functions deploy send-notification --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Email templates ─────────────────────────────────────────────────────

function projectCreatedEmail(data: { clientName: string; projectName: string; portalUrl: string; companyName: string }) {
    return {
        subject: `Новый проект: ${data.projectName}`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:28px 32px;color:#fff;">
        <div style="font-size:12px;opacity:0.8;">Уведомление от</div>
        <div style="font-size:22px;font-weight:700;">${data.companyName}</div>
    </div>
    <div style="padding:32px;">
        <div style="font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:8px;">Привет, ${data.clientName}!</div>
        <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:24px;">
            Для вас создан новый проект: <strong style="color:#1a1a2e;">${data.projectName}</strong>
        </div>
        <a href="${data.portalUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Открыть портал
        </a>
        <div style="margin-top:24px;font-size:12px;color:#9ca3af;">
            Это автоматическое уведомление от ${data.companyName} через ClientBase
        </div>
    </div>
</div>
</body>
</html>`,
    };
}

function projectStatusEmail(data: { clientName: string; projectName: string; newStatus: string; portalUrl: string; companyName: string }) {
    const statusLabels: Record<string, string> = {
        brief: 'Бриф',
        in_progress: 'В работе',
        review: 'На ревью',
        done: 'Готово',
    };
    const statusLabel = statusLabels[data.newStatus] || data.newStatus;

    return {
        subject: `${data.projectName} → ${statusLabel}`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:28px 32px;color:#fff;">
        <div style="font-size:12px;opacity:0.8;">Уведомление от</div>
        <div style="font-size:22px;font-weight:700;">${data.companyName}</div>
    </div>
    <div style="padding:32px;">
        <div style="font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:8px;">Привет, ${data.clientName}!</div>
        <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:16px;">
            Статус проекта <strong style="color:#1a1a2e;">${data.projectName}</strong> изменён:
        </div>
        <div style="display:inline-block;padding:6px 16px;background:#eef2ff;color:#6366f1;border-radius:20px;font-weight:600;font-size:14px;margin-bottom:24px;">
            → ${statusLabel}
        </div>
        <div style="margin-top:16px;">
            <a href="${data.portalUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                Открыть портал
            </a>
        </div>
        <div style="margin-top:24px;font-size:12px;color:#9ca3af;">
            Это автоматическое уведомление от ${data.companyName} через ClientBase
        </div>
    </div>
</div>
</body>
</html>`,
    };
}

function invoiceCreatedEmail(data: { clientName: string; invoiceNumber: string; amount: string; dueDate: string; portalUrl: string; companyName: string }) {
    return {
        subject: `Новый счёт ${data.invoiceNumber} на ${data.amount}`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:28px 32px;color:#fff;">
        <div style="font-size:12px;opacity:0.8;">Уведомление от</div>
        <div style="font-size:22px;font-weight:700;">${data.companyName}</div>
    </div>
    <div style="padding:32px;">
        <div style="font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:8px;">Привет, ${data.clientName}!</div>
        <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:16px;">
            Для вас выставлен новый счёт:
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#6b7280;font-size:13px;">Номер</span>
                <span style="font-weight:600;color:#1a1a2e;">${data.invoiceNumber}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#6b7280;font-size:13px;">Сумма</span>
                <span style="font-weight:700;color:#1a1a2e;font-size:18px;">${data.amount}</span>
            </div>
            ${data.dueDate ? `<div style="display:flex;justify-content:space-between;">
                <span style="color:#6b7280;font-size:13px;">Оплата до</span>
                <span style="color:#f59e0b;font-weight:600;">${data.dueDate}</span>
            </div>` : ''}
        </div>
        <a href="${data.portalUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Открыть портал
        </a>
        <div style="margin-top:24px;font-size:12px;color:#9ca3af;">
            Это автоматическое уведомление от ${data.companyName} через ClientBase
        </div>
    </div>
</div>
</body>
</html>`,
    };
}

// ─── Main handler ────────────────────────────────────────────────────────

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body = await req.json();
        const { type, clientId, projectName, newStatus, invoiceNumber, amount, dueDate } = body;

        // Получаем данные клиента
        const { data: client } = await supabase
            .from('clients')
            .select('name, email')
            .eq('id', clientId)
            .single();

        if (!client || !client.email) {
            return new Response(JSON.stringify({ error: 'Client has no email' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Получаем название компании из профиля
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, full_name')
            .eq('id', user.id)
            .single();

        const companyName = profile?.company_name || profile?.full_name || 'ClientBase';

        // Получаем портал URL
        const { data: portalToken } = await supabase
            .from('portal_tokens')
            .select('token')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .single();

        const origin = body.origin || 'https://client-base-chi.vercel.app';
        const portalUrl = portalToken
            ? `${origin}/portal/${portalToken.token}`
            : origin;

        // Генерируем email по типу
        let emailContent;
        switch (type) {
            case 'project_created':
                emailContent = projectCreatedEmail({
                    clientName: client.name.split(' ')[0],
                    projectName,
                    portalUrl,
                    companyName,
                });
                break;
            case 'project_status':
                emailContent = projectStatusEmail({
                    clientName: client.name.split(' ')[0],
                    projectName,
                    newStatus,
                    portalUrl,
                    companyName,
                });
                break;
            case 'invoice_created':
                emailContent = invoiceCreatedEmail({
                    clientName: client.name.split(' ')[0],
                    invoiceNumber,
                    amount,
                    dueDate: dueDate || '',
                    portalUrl,
                    companyName,
                });
                break;
            default:
                return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
        }

        // Отправляем через Resend
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'ClientBase <onboarding@resend.dev>',
                to: [client.email],
                subject: emailContent.subject,
                html: emailContent.html,
            }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
            console.error('Resend error:', resendData);
            return new Response(JSON.stringify({ error: 'Failed to send email', details: resendData }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Notification error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
