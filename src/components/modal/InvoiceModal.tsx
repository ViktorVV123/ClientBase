import React, { useState } from 'react';
import type { Invoice, InvoiceStatus } from '@/assets/data/data';
import { useI18n } from '@/lib/i18n';
import * as styles from './InvoiceModal.module.scss';

interface InvoiceModalProps {
    clientId: number;
    nextNumber: string;
    invoice?: Invoice | null;
    onClose: () => void;
    onSubmit: (data: { clientId: number; number: string; amount: number; status: InvoiceStatus; date: string; dueDate: string }) => void;
    onUpdate?: (invoiceId: number, data: { number: string; amount: number; status: string; date: string; due_date: string }) => void;
    onDelete?: (invoiceId: number) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ clientId, nextNumber, invoice, onClose, onSubmit, onUpdate, onDelete }) => {
    const { t } = useI18n();
    const isEdit = !!invoice;
    const today = new Date().toISOString().split('T')[0];
    const in14days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const statusOptions: { value: InvoiceStatus; label: string }[] = [
        { value: 'pending', label: t.invoiceStatusPending },
        { value: 'paid', label: t.invoiceStatusPaid },
        { value: 'overdue', label: t.invoiceStatusOverdue },
    ];

    const [number, setNumber] = useState(invoice?.number || nextNumber);
    const [amount, setAmount] = useState(invoice ? invoice.amount.toLocaleString('ru-RU') : '');
    const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || 'pending');
    const [date, setDate] = useState(invoice?.date || today);
    const [dueDate, setDueDate] = useState(invoice?.dueDate || in14days);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSubmit = () => {
        const amountNum = parseInt(amount.replace(/\D/g, ''), 10);
        if (!number.trim() || !amountNum || amountNum <= 0) return;
        if (isEdit && onUpdate && invoice) {
            onUpdate(invoice.id, { number, amount: amountNum, status, date, due_date: dueDate });
        } else {
            onSubmit({ clientId, number, amount: amountNum, status, date, dueDate });
        }
        onClose();
    };

    const handleDelete = () => { if (invoice && onDelete) { onDelete(invoice.id); onClose(); } };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); };
    const handleAmountChange = (val: string) => {
        const digits = val.replace(/\D/g, '');
        setAmount(digits ? parseInt(digits, 10).toLocaleString('ru-RU') : '');
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.title}>{isEdit ? t.editInvoice : t.newInvoice}</div>

                <label className={styles.label}>{t.invoiceNumber}</label>
                <input className={styles.input} placeholder="INV-006" value={number} onChange={(e) => setNumber(e.target.value)} onKeyDown={handleKeyDown} autoFocus />

                <label className={styles.label}>{t.amountLabel}</label>
                <input className={styles.input} placeholder="50 000" value={amount} onChange={(e) => handleAmountChange(e.target.value)} onKeyDown={handleKeyDown} />

                <label className={styles.label}>{t.invoiceStatus}</label>
                <div className={styles.statusGrid}>
                    {statusOptions.map((opt) => (
                        <button key={opt.value} type="button" className={`${styles.statusOption} ${status === opt.value ? styles.statusActive : ''}`} onClick={() => setStatus(opt.value)}>{opt.label}</button>
                    ))}
                </div>

                <div className={styles.dateRow}>
                    <div className={styles.dateField}>
                        <label className={styles.label}>{t.date}</label>
                        <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className={styles.dateField}>
                        <label className={styles.label}>{t.dueDateLabel}</label>
                        <input className={styles.input} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                </div>

                <div className={styles.actions}>
                    {isEdit && onDelete && (
                        <>
                            {showDeleteConfirm ? (
                                <div className={styles.deleteConfirm}>
                                    <span className={styles.deleteText}>{t.delete}?</span>
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
                    <button className={styles.submitBtn} onClick={handleSubmit}>{isEdit ? t.save : t.create}</button>
                </div>
            </div>
        </div>
    );
};
