import React, { useState } from 'react';
import type { InvoiceStatus } from '@/assets/data/data';
import * as styles from './InvoiceModal.module.scss';

interface InvoiceModalProps {
    clientId: number;
    nextNumber: string;
    onClose: () => void;
    onSubmit: (data: {
        clientId: number;
        number: string;
        amount: number;
        status: InvoiceStatus;
        date: string;
        dueDate: string;
    }) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
                                                              clientId,
                                                              nextNumber,
                                                              onClose,
                                                              onSubmit,
                                                          }) => {
    const today = new Date().toISOString().split('T')[0];
    const in14days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const [number, setNumber] = useState(nextNumber);
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<InvoiceStatus>('pending');
    const [date, setDate] = useState(today);
    const [dueDate, setDueDate] = useState(in14days);

    const handleSubmit = () => {
        const amountNum = parseInt(amount.replace(/\D/g, ''), 10);
        if (!number.trim() || !amountNum || amountNum <= 0) return;

        onSubmit({
            clientId,
            number,
            amount: amountNum,
            status,
            date,
            dueDate,
        });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    // Форматируем ввод суммы
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
                <div className={styles.title}>Новый счёт</div>

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
                    {[
                        { value: 'pending' as InvoiceStatus, label: 'Ожидает' },
                        { value: 'paid' as InvoiceStatus, label: 'Оплачен' },
                        { value: 'overdue' as InvoiceStatus, label: 'Просрочен' },
                    ].map((opt) => (
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
                    <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
                    <button className={styles.submitBtn} onClick={handleSubmit}>Создать</button>
                </div>
            </div>
        </div>
    );
};
