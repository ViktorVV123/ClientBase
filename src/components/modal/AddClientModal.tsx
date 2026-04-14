import React, { useState } from 'react';
import { Client, AVATAR_COLORS } from '@/assets/data/data';
import * as styles from './AddClientModal.module.scss';

interface ClientModalProps {
    client?: Client | null;        // если передан — режим редактирования
    onClose: () => void;
    onAdd: (client: Client) => void;
    onUpdate?: (clientId: number, data: { name: string; company: string; email: string; color: string; avatar: string }) => void;
    onDelete?: (clientId: number) => void;
}

export const AddClientModal: React.FC<ClientModalProps> = ({
                                                               client,
                                                               onClose,
                                                               onAdd,
                                                               onUpdate,
                                                               onDelete,
                                                           }) => {
    const isEdit = !!client;

    const [name, setName] = useState(client?.name || '');
    const [company, setCompany] = useState(client?.company || '');
    const [email, setEmail] = useState(client?.email || '');
    const [color, setColor] = useState(client?.color || AVATAR_COLORS[0]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;

        const initials = name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        if (isEdit && onUpdate && client) {
            onUpdate(client.id, {
                name,
                company: company || 'Без компании',
                email: email || '',
                color,
                avatar: initials,
            });
        } else {
            onAdd({
                id: Date.now(),
                name,
                company: company || 'Без компании',
                email: email || '',
                avatar: initials,
                color,
                projects: [],
                invoices: [],
                files: [],
            });
        }
        onClose();
    };

    const handleDelete = () => {
        if (client && onDelete) {
            onDelete(client.id);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.title}>
                    {isEdit ? 'Редактировать клиента' : 'Новый клиент'}
                </div>

                <label className={styles.label}>Имя</label>
                <input
                    className={styles.input}
                    placeholder="Иван Иванов"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />

                <label className={styles.label}>Компания</label>
                <input
                    className={styles.input}
                    placeholder="Название компании"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <label className={styles.label}>Email</label>
                <input
                    className={styles.input}
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <label className={styles.label}>Цвет</label>
                <div className={styles.colorPicker}>
                    {AVATAR_COLORS.map((c) => (
                        <button
                            key={c}
                            className={`${styles.colorOption} ${color === c ? styles.colorSelected : ''}`}
                            style={{ background: c }}
                            onClick={() => setColor(c)}
                            type="button"
                        />
                    ))}
                </div>

                <div className={styles.actions}>
                    {isEdit && onDelete && (
                        <>
                            {showDeleteConfirm ? (
                                <div className={styles.deleteConfirm}>
                                    <span className={styles.deleteText}>Удалить клиента?</span>
                                    <button className={styles.deleteConfirmBtn} onClick={handleDelete}>
                                        Да, удалить
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
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Отмена
                    </button>
                    <button className={styles.submitBtn} onClick={handleSubmit}>
                        {isEdit ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
};
