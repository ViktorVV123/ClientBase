import React, { useState } from 'react';
import type { Invoice, InvoiceStatus } from '@/assets/data/data';
import * as styles from './InvoiceModal.module.scss';

interface InvoiceModalProps {
    clientId: number;
    nextNumber: string;
    invoice?: Invoice | null;
    onClose: () => void;
    onSubmit: (data: {
        clientId: number;
        number: string;
        amount: number;
        status: InvoiceStatus;
        date: string;
        dueDate: string;
    }) => void;
    onUpdate?: (invoiceId: number, data: {
        number: string;
        amount: number;
        status: string;
        date: string;
        due_date: string;
    }) => void;
    onDelete?: (invoiceId: number) => void;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
    { value: 'pending', label: 'Ожидает' },
    { value: 'paid', label: 'Оплачен' },
    { value: 'overdue', label: 'Просрочен' },
];

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
                                                              clientId,
                                                              nextNumber,
                                                              invoice,
                                                              onClose,
                                                              onSubmit,
                                                              onUpdate,
                                                              onDelete,
                                                          }) => {
    const isEdit = !!invoice;
    const today = new Date().toISOString().split('T')[0];
    const in14days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const [number, setNumber] = useState(invoice?.number || nextNumber);
    const [amount, setAmount] = useState(
        invoice ? invoice.amount.toLocaleString('ru-RU') : ''
    );
    const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || 'pending');
    const [date, setDate] = useState(invoice?.date || today);
    const [dueDate, setDueDate] = useState(invoice?.dueDate || in14days);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSubmit = () => {
        const amountNum = parseInt(amount.replace(/\D/g, ''), 10);
        if (!number.trim() || !amountNum || amountNum <= 0) return;

        if (isEdit && onUpdate && invoice) {
            onUpdate(invoice.id, {
                number,
                amount: amountNum,
                status,
                date,
                due_date: dueDate,
            });
        } else {
            onSubmit({
                clientId,
                number,
                amount: amountNum,
                status,
                date,
                dueDate,
            });
        }
        onClose();
    };

    const handleDelete = () => {
        if (invoice && onDelete) {
            onDelete(invoice.id);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const handleAmountChange = (val: string) => {
        const digits = val.replace(/\D/g, '');
        if (digits) {
            setAmount(parseInt(digits, 10).toLocaleString('ru-RU'));
        } else {
            setAmount('');
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.title}>
                    {isEdit ? 'Редактировать счёт' : 'Новый счёт'}
                </div>

                <label className={styles.label}>Номер счёта</label>
                <input
                    className={styles.input}
                    placeholder="INV-006"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />

                <label className={styles.label}>Сумма (₽)</label>
                <input
                    className={styles.input}
                    placeholder="50 000"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <label className={styles.label}>Статус</label>
                <div className={styles.statusGrid}>
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.statusOption} ${status === opt.value ? styles.statusActive : ''}`}
                            onClick={() => setStatus(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className={styles.dateRow}>
                    <div className={styles.dateField}>
                        <label className={styles.label}>Дата</label>
                        <input
                            className={styles.input}
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.dateField}>
                        <label className={styles.label}>Оплата до</label>
                        <input
                            className={styles.input}
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    {isEdit && onDelete && (
                        <>
                            {showDeleteConfirm ? (
                                <div className={styles.deleteConfirm}>
                                    <span className={styles.deleteText}>Удалить счёт?</span>
                                    <button className={styles.deleteConfirmBtn} onClick={handleDelete}>
                                        Да
                                    </button>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Нет
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    🗑 Удалить
                                </button>
                            )}
                        </>
                    )}
                    <div className={styles.actionsSpacer} />
                    <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
                    <button className={styles.submitBtn} onClick={handleSubmit}>
                        {isEdit ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};
