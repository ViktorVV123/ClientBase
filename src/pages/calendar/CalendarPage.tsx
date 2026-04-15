import React from 'react';
import { Client, STATUS_MAP, formatDate, formatMoney } from '@/assets/data/data';
import * as styles from './CalendarPage.module.scss';

interface CalendarPageProps {
    clients: Client[];
    onSelectClient: (client: Client) => void;
}

interface Event {
    id: string;
    date: string;
    type: 'deadline' | 'invoice' | 'overdue';
    title: string;
    subtitle: string;
    client: Client;
    color: string;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ clients, onSelectClient }) => {
    // Собираем все события
    const events: Event[] = [];

    clients.forEach((c) => {
        // Дедлайны проектов
        c.projects.forEach((p) => {
            if (p.deadline && p.status !== 'done') {
                events.push({
                    id: `proj-${p.id}`,
                    date: p.deadline,
                    type: 'deadline',
                    title: p.name,
                    subtitle: `${STATUS_MAP[p.status].label} · ${p.progress}%`,
                    client: c,
                    color: STATUS_MAP[p.status].color,
                });
            }
        });

        // Счета к оплате
        c.invoices.forEach((inv) => {
            if (inv.status === 'pending' && inv.dueDate) {
                events.push({
                    id: `inv-${inv.id}`,
                    date: inv.dueDate,
                    type: 'invoice',
                    title: `${inv.number} — ${formatMoney(inv.amount)}`,
                    subtitle: 'Ожидает оплаты',
                    client: c,
                    color: '#f59e0b',
                });
            }
            if (inv.status === 'overdue') {
                events.push({
                    id: `inv-overdue-${inv.id}`,
                    date: inv.dueDate || inv.date,
                    type: 'overdue',
                    title: `${inv.number} — ${formatMoney(inv.amount)}`,
                    subtitle: 'Просрочен!',
                    client: c,
                    color: '#ef4444',
                });
            }
        });
    });

    // Сортируем по дате
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter((e) => e.date === today);
    const upcomingEvents = events.filter((e) => e.date > today);
    const overdueEvents = events.filter((e) => e.date < today);

    const typeIcons: Record<string, string> = {
        deadline: '📋',
        invoice: '💳',
        overdue: '🔴',
    };

    const renderEvent = (event: Event) => (
        <div
            key={event.id}
            className={styles.eventCard}
            onClick={() => onSelectClient(event.client)}
        >
            <div className={styles.eventIcon}>{typeIcons[event.type]}</div>
            <div className={styles.eventInfo}>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.eventMeta}>
                    <span className={styles.eventDot} style={{ background: event.client.color }} />
                    {event.client.name} · {event.subtitle}
                </div>
            </div>
            <div className={styles.eventDate}>{formatDate(event.date)}</div>
        </div>
    );

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerTitle}>📅 Календарь</div>
                <div className={styles.headerSub}>
                    {events.length} {events.length === 1 ? 'событие' : events.length < 5 ? 'события' : 'событий'}
                </div>
            </div>

            {events.length === 0 && (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📅</div>
                    <div className={styles.emptyTitle}>Нет предстоящих событий</div>
                    <div className={styles.emptyText}>
                        Дедлайны проектов и даты оплаты счетов появятся здесь автоматически
                    </div>
                </div>
            )}

            {overdueEvents.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span className={styles.sectionDot} style={{ background: '#ef4444' }} />
                        Просрочено ({overdueEvents.length})
                    </div>
                    <div className={styles.eventList}>
                        {overdueEvents.map(renderEvent)}
                    </div>
                </div>
            )}

            {todayEvents.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span className={styles.sectionDot} style={{ background: '#6366f1' }} />
                        Сегодня ({todayEvents.length})
                    </div>
                    <div className={styles.eventList}>
                        {todayEvents.map(renderEvent)}
                    </div>
                </div>
            )}

            {upcomingEvents.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <span className={styles.sectionDot} style={{ background: '#22c55e' }} />
                        Предстоящие ({upcomingEvents.length})
                    </div>
                    <div className={styles.eventList}>
                        {upcomingEvents.map(renderEvent)}
                    </div>
                </div>
            )}
        </>
    );
};
