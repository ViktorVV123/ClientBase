import React, { useState } from 'react';
import type { ProjectStatus } from '@/assets/data/data';
import * as styles from './ProjectModal.module.scss';

interface ProjectModalProps {
    clientId: number;
    onClose: () => void;
    onSubmit: (data: {
        clientId: number;
        name: string;
        status: ProjectStatus;
        progress: number;
        deadline: string;
    }) => void;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'brief', label: 'Бриф' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'review', label: 'На ревью' },
    { value: 'done', label: 'Готово' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
                                                              clientId,
                                                              onClose,
                                                              onSubmit,
                                                          }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('brief');
    const [progress, setProgress] = useState(0);
    const [deadline, setDeadline] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSubmit({ clientId, name, status, progress, deadline });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    // Автоматически ставим прогресс при смене статуса
    const handleStatusChange = (newStatus: ProjectStatus) => {
        setStatus(newStatus);
        if (newStatus === 'brief' && progress === 0) setProgress(5);
        if (newStatus === 'in_progress' && progress < 20) setProgress(20);
        if (newStatus === 'review' && progress < 70) setProgress(70);
        if (newStatus === 'done') setProgress(100);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.title}>Новый проект</div>

                <label className={styles.label}>Название</label>
                <input
                    className={styles.input}
                    placeholder="Редизайн лендинга"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />

                <label className={styles.label}>Статус</label>
                <div className={styles.statusGrid}>
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.statusOption} ${status === opt.value ? styles.statusActive : ''}`}
                            onClick={() => handleStatusChange(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <label className={styles.label}>Прогресс: {progress}%</label>
                <input
                    className={styles.range}
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                />

                <label className={styles.label}>Дедлайн</label>
                <input
                    className={styles.input}
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
                    <button className={styles.submitBtn} onClick={handleSubmit}>Создать</button>
                </div>
            </div>
        </div>
    );
};
