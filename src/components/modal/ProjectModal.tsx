import React, { useState, useEffect } from 'react';
import type { Project, ProjectStatus, ProjectPriority, ProjectTask } from '@/assets/data/data';
import {
    fetchProjectNotes, createProjectNote, deleteProjectNote, ProjectNote,
    fetchProjectTasks, createProjectTask, updateProjectTask, deleteProjectTask,
} from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import * as styles from './ProjectModal.module.scss';

interface ProjectModalProps {
    clientId: number;
    project?: Project | null;
    onClose: () => void;
    onSubmit: (data: { clientId: number; name: string; status: ProjectStatus; progress: number; deadline: string; description: string; priority: ProjectPriority }) => void;
    onUpdate?: (projectId: number, data: { name: string; status: string; progress: number; deadline: string; description: string; priority: string }) => void;
    onDelete?: (projectId: number) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ clientId, project, onClose, onSubmit, onUpdate, onDelete }) => {
    const { t } = useI18n();
    const isEdit = !!project;

    const statusOptions: { value: ProjectStatus; label: string }[] = [
        { value: 'brief', label: t.statusBrief },
        { value: 'in_progress', label: t.statusInProgress },
        { value: 'review', label: t.statusReview },
        { value: 'done', label: t.statusDone },
    ];

    const [name, setName] = useState(project?.name || '');
    const [status, setStatus] = useState<ProjectStatus>(project?.status || 'brief');
    const [progress, setProgress] = useState(project?.progress || 0);
    const [deadline, setDeadline] = useState(project?.deadline || '');
    const [description, setDescription] = useState(project?.description || '');
    const [priority, setPriority] = useState<ProjectPriority>(project?.priority || 'normal');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [notes, setNotes] = useState<ProjectNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [noteVisible, setNoteVisible] = useState(true);
    const [addingNote, setAddingNote] = useState(false);

    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [addingTask, setAddingTask] = useState(false);

    useEffect(() => { if (isEdit && project) { loadNotes(project.id); loadTasks(project.id); } }, [project?.id]);

    const loadNotes = async (projectId: number) => { try { setNotes(await fetchProjectNotes(projectId)); } catch (err) { console.error(err); } };
    const handleAddNote = async () => {
        if (!newNote.trim() || !project) return;
        setAddingNote(true);
        try { const note = await createProjectNote({ projectId: project.id, text: newNote.trim(), visibleToClient: noteVisible }); setNotes((prev) => [note, ...prev]); setNewNote(''); }
        catch (err) { console.error(err); } finally { setAddingNote(false); }
    };
    const handleDeleteNote = async (noteId: number) => { try { await deleteProjectNote(noteId); setNotes((prev) => prev.filter((n) => n.id !== noteId)); } catch (err) { console.error(err); } };

    const loadTasks = async (projectId: number) => { try { setTasks(await fetchProjectTasks(projectId)); } catch (err) { console.error(err); } };
    const handleAddTask = async () => {
        if (!newTaskText.trim() || !project) return;
        setAddingTask(true);
        try { const task = await createProjectTask({ projectId: project.id, text: newTaskText.trim(), position: tasks.length }); const updated = [...tasks, task]; setTasks(updated); setNewTaskText(''); recalcProgress(updated); }
        catch (err) { console.error(err); } finally { setAddingTask(false); }
    };
    const handleToggleTask = async (task: ProjectTask) => {
        try { await updateProjectTask(task.id, { done: !task.done }); const updated = tasks.map((t2) => t2.id === task.id ? { ...t2, done: !t2.done } : t2); setTasks(updated); recalcProgress(updated); }
        catch (err) { console.error(err); }
    };
    const handleDeleteTask = async (taskId: number) => {
        try { await deleteProjectTask(taskId); const updated = tasks.filter((t2) => t2.id !== taskId); setTasks(updated); recalcProgress(updated); }
        catch (err) { console.error(err); }
    };
    const handleTaskKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); } };
    const recalcProgress = (taskList: ProjectTask[]) => { if (taskList.length === 0) return; setProgress(Math.round((taskList.filter((t2) => t2.done).length / taskList.length) * 100)); };

    const handleSubmit = () => {
        if (!name.trim()) return;
        if (isEdit && onUpdate && project) onUpdate(project.id, { name, status, progress, deadline, description, priority });
        else onSubmit({ clientId, name, status, progress, deadline, description, priority });
        onClose();
    };
    const handleDelete = () => { if (project && onDelete) { onDelete(project.id); onClose(); } };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement) handleSubmit(); };
    const handleStatusChange = (newStatus: ProjectStatus) => { setStatus(newStatus); };

    const formatNoteDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const doneCount = tasks.filter((t2) => t2.done).length;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalBody}>
                    <div className={styles.title}>{isEdit ? t.editProject : t.newProject}</div>

                    <label className={styles.label}>{t.projectName}</label>
                    <input className={styles.input} placeholder={t.projectNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} autoFocus />

                    <label className={styles.label}>{t.description}</label>
                    <textarea className={styles.textarea} placeholder={t.descriptionPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

                    <div className={styles.rowFields}>
                        <div className={styles.fieldHalf}>
                            <label className={styles.label}>{t.status}</label>
                            <div className={styles.statusGrid}>
                                {statusOptions.map((opt) => (
                                    <button key={opt.value} type="button" className={`${styles.statusOption} ${status === opt.value ? styles.statusActive : ''}`} onClick={() => handleStatusChange(opt.value)}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.fieldHalf}>
                            <label className={styles.label}>{t.priority}</label>
                            <div className={styles.priorityGrid}>
                                <button type="button" className={`${styles.priorityOption} ${priority === 'normal' ? styles.priorityNormal : ''}`} onClick={() => setPriority('normal')}>{t.priorityNormal}</button>
                                <button type="button" className={`${styles.priorityOption} ${priority === 'urgent' ? styles.priorityUrgent : ''}`} onClick={() => setPriority('urgent')}>{t.priorityUrgent}</button>
                            </div>
                        </div>
                    </div>

                    {tasks.length > 0 ? (
                        <div className={styles.autoProgressBar}>
                            <div className={styles.autoProgressLabel}>{t.progressAuto(doneCount, tasks.length, progress)}</div>
                            <div className={styles.autoProgressTrack}><div className={styles.autoProgressFill} style={{ width: progress + '%' }} /></div>
                        </div>
                    ) : (
                        <>
                            <label className={styles.label}>{t.progress}: {progress}%</label>
                            <input className={styles.range} type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
                        </>
                    )}

                    <label className={styles.label}>{t.deadline}</label>
                    <input className={styles.input} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} onKeyDown={handleKeyDown} />

                    {isEdit && (
                        <div className={styles.tasksSection}>
                            <div className={styles.tasksSectionHeader}>
                                <span className={styles.label} style={{ marginBottom: 0 }}>{t.tasks} ({doneCount}/{tasks.length})</span>
                            </div>
                            <div className={styles.taskInput}>
                                <input className={styles.taskInputField} placeholder={t.addTask} value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleTaskKeyDown} />
                                <button className={styles.taskAddBtn} onClick={handleAddTask} disabled={!newTaskText.trim() || addingTask}>+</button>
                            </div>
                            <div className={styles.tasksList}>
                                {tasks.map((tk) => (
                                    <div key={tk.id} className={`${styles.taskItem} ${tk.done ? styles.taskDone : ''}`}>
                                        <button className={tk.done ? styles.taskCheckDone : styles.taskCheck} onClick={() => handleToggleTask(tk)}>{tk.done ? '✓' : ''}</button>
                                        <span className={tk.done ? styles.taskTextDone : styles.taskText}>{tk.text}</span>
                                        <button className={styles.taskDeleteBtn} onClick={() => handleDeleteTask(tk.id)}>✕</button>
                                    </div>
                                ))}
                                {tasks.length === 0 && <div className={styles.tasksEmpty}>{t.tasksEmpty}</div>}
                            </div>
                        </div>
                    )}

                    {isEdit && (
                        <div className={styles.notesSection}>
                            <div className={styles.notesHeader}>
                                <span className={styles.label} style={{ marginBottom: 0 }}>{t.notes} ({notes.length})</span>
                            </div>
                            <div className={styles.noteInput}>
                                <textarea className={styles.noteTextarea} placeholder={t.writeNote} value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} />
                                <div className={styles.noteActions}>
                                    <label className={styles.visibilityToggle}>
                                        <input type="checkbox" checked={noteVisible} onChange={(e) => setNoteVisible(e.target.checked)} />
                                        <span className={styles.visibilityLabel}>{noteVisible ? t.visibleToClient : t.privateNote}</span>
                                    </label>
                                    <button className={styles.addNoteBtn} onClick={handleAddNote} disabled={!newNote.trim() || addingNote}>{addingNote ? '...' : `+ ${t.add}`}</button>
                                </div>
                            </div>
                            <div className={styles.notesList}>
                                {notes.map((n) => (
                                    <div key={n.id} className={styles.noteItem}>
                                        <div className={styles.noteText}>{n.text}</div>
                                        <div className={styles.noteMeta}>
                                            <span>{formatNoteDate(n.created_at)}</span>
                                            <span className={n.visible_to_client ? styles.noteVisible : styles.notePrivate}>{n.visible_to_client ? t.clientSees : t.privateLabel}</span>
                                            <button className={styles.noteDeleteBtn} onClick={() => handleDeleteNote(n.id)}>✕</button>
                                        </div>
                                    </div>
                                ))}
                                {notes.length === 0 && <div className={styles.notesEmpty}>{t.noNotes}</div>}
                            </div>
                        </div>
                    )}

                </div>

                <div className={styles.actions}>
                    {isEdit && onDelete && (
                        <>
                            {showDeleteConfirm ? (
                                <div className={styles.deleteConfirm}>
                                    <span className={styles.deleteText}>{t.deleteProject}</span>
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
