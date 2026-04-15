import React, { useState, useEffect } from 'react';
import type { Project, ProjectStatus } from '@/assets/data/data';
import { fetchProjectNotes, createProjectNote, deleteProjectNote, ProjectNote } from '@/lib/api';
import * as styles from './ProjectModal.module.scss';

interface ProjectModalProps {
    clientId: number;
    project?: Project | null;
    onClose: () => void;
    onSubmit: (data: {
        clientId: number;
        name: string;
        status: ProjectStatus;
        progress: number;
        deadline: string;
    }) => void;
    onUpdate?: (projectId: number, data: {
        name: string;
        status: string;
        progress: number;
        deadline: string;
    }) => void;
    onDelete?: (projectId: number) => void;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'brief', label: 'Бриф' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'review', label: 'На ревью' },
    { value: 'done', label: 'Готово' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
                                                              clientId,
                                                              project,
                                                              onClose,
                                                              onSubmit,
                                                              onUpdate,
                                                              onDelete,
                                                          }) => {
    const isEdit = !!project;

    const [name, setName] = useState(project?.name || '');
    const [status, setStatus] = useState<ProjectStatus>(project?.status || 'brief');
    const [progress, setProgress] = useState(project?.progress || 0);
    const [deadline, setDeadline] = useState(project?.deadline || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Notes
    const [notes, setNotes] = useState<ProjectNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [noteVisible, setNoteVisible] = useState(true);
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        if (isEdit && project) {
            loadNotes(project.id);
        }
    }, [project?.id]);

    const loadNotes = async (projectId: number) => {
        try {
            const data = await fetchProjectNotes(projectId);
            setNotes(data);
        } catch (err) {
            console.error('Failed to load notes:', err);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !project) return;
        setAddingNote(true);
        try {
            const note = await createProjectNote({
                projectId: project.id,
                text: newNote.trim(),
                visibleToClient: noteVisible,
            });
            setNotes((prev) => [note, ...prev]);
            setNewNote('');
        } catch (err) {
            console.error('Failed to add note:', err);
        } finally {
            setAddingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        try {
            await deleteProjectNote(noteId);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        if (isEdit && onUpdate && project) {
            onUpdate(project.id, { name, status, progress, deadline });
        } else {
            onSubmit({ clientId, name, status, progress, deadline });
        }
        onClose();
    };

    const handleDelete = () => {
        if (project && onDelete) {
            onDelete(project.id);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) handleSubmit();
    };

    const handleStatusChange = (newStatus: ProjectStatus) => {
        setStatus(newStatus);
        if (newStatus === 'brief' && progress === 0) setProgress(5);
        if (newStatus === 'in_progress' && progress < 20) setProgress(20);
        if (newStatus === 'review' && progress < 70) setProgress(70);
        if (newStatus === 'done') setProgress(100);
    };

    const formatNoteDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
            + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.title}>
                    {isEdit ? 'Редактировать проект' : 'Новый проект'}
                </div>

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

                {/* Notes section — only in edit mode */}
                {isEdit && (
                    <div className={styles.notesSection}>
                        <div className={styles.notesHeader}>
                            <span className={styles.label} style={{ marginBottom: 0 }}>
                                Заметки ({notes.length})
                            </span>
                        </div>

                        {/* Add note */}
                        <div className={styles.noteInput}>
                            <textarea
                                className={styles.noteTextarea}
                                placeholder="Написать заметку..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={2}
                            />
                            <div className={styles.noteActions}>
                                <label className={styles.visibilityToggle}>
                                    <input
                                        type="checkbox"
                                        checked={noteVisible}
                                        onChange={(e) => setNoteVisible(e.target.checked)}
                                    />
                                    <span className={styles.visibilityLabel}>
                                        {noteVisible ? '👁 Видна клиенту' : '🔒 Только для вас'}
                                    </span>
                                </label>
                                <button
                                    className={styles.addNoteBtn}
                                    onClick={handleAddNote}
                                    disabled={!newNote.trim() || addingNote}
                                >
                                    {addingNote ? '...' : '+ Добавить'}
                                </button>
                            </div>
                        </div>

                        {/* Notes list */}
                        <div className={styles.notesList}>
                            {notes.map((n) => (
                                <div key={n.id} className={styles.noteItem}>
                                    <div className={styles.noteText}>{n.text}</div>
                                    <div className={styles.noteMeta}>
                                        <span>{formatNoteDate(n.created_at)}</span>
                                        <span className={n.visible_to_client ? styles.noteVisible : styles.notePrivate}>
                                            {n.visible_to_client ? '👁 Клиент видит' : '🔒 Приватная'}
                                        </span>
                                        <button
                                            className={styles.noteDeleteBtn}
                                            onClick={() => handleDeleteNote(n.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && (
                                <div className={styles.notesEmpty}>Заметок пока нет</div>
                            )}
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    {isEdit && onDelete && (
                        <>
                            {showDeleteConfirm ? (
                                <div className={styles.deleteConfirm}>
                                    <span className={styles.deleteText}>Удалить проект?</span>
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
