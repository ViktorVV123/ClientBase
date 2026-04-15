import React, { useState } from 'react';
import { Client, AVATAR_COLORS } from '@/assets/data/data';
import { useI18n } from '@/lib/i18n';
import * as styles from './AddClientModal.module.scss';

const PRO_GRADIENTS = [
    { id: 'sunset',   value: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { id: 'ocean',    value: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { id: 'aurora',   value: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
    { id: 'emerald',  value: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { id: 'fire',     value: 'linear-gradient(135deg, #f12711, #f5af19)' },
    { id: 'midnight', value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
    { id: 'candy',    value: 'linear-gradient(135deg, #fc5c7d, #6a82fb)' },
    { id: 'neon',     value: 'linear-gradient(135deg, #b721ff, #21d4fd)' },
];

interface ClientModalProps {
    client?: Client | null;
    onClose: () => void;
    onAdd: (client: Client, enableNotifications: boolean) => void;
    onUpdate?: (clientId: number, data: { name: string; company: string; email: string; color: string; avatar: string }) => void;
    onDelete?: (clientId: number) => void;
    isPro?: boolean;
    onUpgrade?: () => void;
}

export const AddClientModal: React.FC<ClientModalProps> = ({ client, onClose, onAdd, onUpdate, onDelete, isPro = false, onUpgrade }) => {
    const { t } = useI18n();
    const isEdit = !!client;

    const [name, setName] = useState(client?.name || '');
    const [company, setCompany] = useState(client?.company || '');
    const [email, setEmail] = useState(client?.email || '');
    const [color, setColor] = useState(client?.color || AVATAR_COLORS[0]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [enableNotifications, setEnableNotifications] = useState(true);

    const handleSubmit = () => {
        if (!name.trim()) return;
        const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        if (isEdit && onUpdate && client) {
            onUpdate(client.id, { name, company: company || t.noCompany, email: email || '', color, avatar: initials });
        } else {
            onAdd({ id: Date.now(), name, company: company || t.noCompany, email: email || '', avatar: initials, color, projects: [], invoices: [], files: [] }, enableNotifications);
        }
        onClose();
    };

    const handleDelete = () => { if (client && onDelete) { onDelete(client.id); onClose(); } };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.title}>{isEdit ? t.editClientTitle : t.addClientTitle}</div>

                <label className={styles.label}>{t.clientName}</label>
                <input className={styles.input} placeholder={t.clientNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} autoFocus />

                <label className={styles.label}>{t.company}</label>
                <input className={styles.input} placeholder={t.companyPlaceholder} value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={handleKeyDown} />

                <label className={styles.label}>{t.email}</label>
                <input className={styles.input} placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
                {email && (
                    <label className={styles.notifyToggle}>
                        <input type="checkbox" checked={enableNotifications} onChange={(e) => setEnableNotifications(e.target.checked)} />
                        <span className={styles.notifyLabel}>📧 {t.enableNotifications}</span>
                    </label>
                )}

                <label className={styles.label}>{t.color}</label>
                <div className={styles.colorPicker}>
                    {AVATAR_COLORS.map((c) => (
                        <button key={c} className={`${styles.colorOption} ${color === c ? styles.colorSelected : ''}`} style={{ background: c }} onClick={() => setColor(c)} type="button" />
                    ))}
                </div>

                <div className={styles.gradientSection}>
                    <label className={styles.label}>{t.gradients}{!isPro && <span className={styles.proBadge}>PRO</span>}</label>
                    <div className={isPro ? styles.gradientGrid : styles.gradientGridLocked}>
                        {PRO_GRADIENTS.map((g) => (
                            <button key={g.id} className={`${styles.gradientSwatch} ${color === g.value ? styles.gradientSwatchActive : ''}`} style={{ background: g.value }} onClick={() => isPro ? setColor(g.value) : onUpgrade?.()} type="button" title={isPro ? g.id : t.proOnly} />
                        ))}
                        {!isPro && <div className={styles.gradientLock} onClick={onUpgrade}>🔒 Pro</div>}
                    </div>
                </div>

                <div className={styles.actions}>
                    {isEdit && onDelete && (
                        <>
                            {showDeleteConfirm ? (
                                <div className={styles.deleteConfirm}>
                                    <span className={styles.deleteText}>{t.deleteClientConfirm}</span>
                                    <button className={styles.deleteConfirmBtn} onClick={handleDelete}>{t.yes}</button>
                                    <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>{t.no}</button>
                                </div>
                            ) : (
                                <button className={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>🗑 {t.delete}</button>
                            )}
                        </>
                    )}
                    <div className={styles.actionsSpacer} />
                    <button className={styles.cancelBtn} onClick={onClose}>{t.cancel}</button>
                    <button className={styles.submitBtn} onClick={handleSubmit}>{isEdit ? t.save : t.add}</button>
                </div>
            </div>
        </div>
    );
};
