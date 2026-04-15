import React, { useState, useEffect, useCallback } from 'react';
import { Project, TimeEntry, formatDuration, formatMoney, formatDate } from '@/assets/data/data';
import { fetchTimeEntries, createTimeEntry, deleteTimeEntry } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import * as styles from './TimeTab.module.scss';

interface TimeTabProps {
    projects: Project[];
    clientId: number;
    onDataChanged?: () => void;
    timerRunning: boolean;
    timerSeconds: number;
    timerProjectId: number | null;
    timerDesc: string;
    onTimerStart: () => void;
    onTimerStop: () => void;
    onTimerReset: () => void;
    onTimerProjectChange: (id: number | null) => void;
    onTimerDescChange: (desc: string) => void;
}

export const TimeTab: React.FC<TimeTabProps> = ({
                                                    projects, clientId, onDataChanged,
                                                    timerRunning, timerSeconds, timerProjectId, timerDesc,
                                                    onTimerStart, onTimerStop, onTimerReset, onTimerProjectChange, onTimerDescChange,
                                                }) => {
    const { t } = useI18n();
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [showManual, setShowManual] = useState(false);
    const [manualProjectId, setManualProjectId] = useState<number | null>(projects[0]?.id ?? null);
    const [manualDesc, setManualDesc] = useState('');
    const [manualHours, setManualHours] = useState('');
    const [manualMinutes, setManualMinutes] = useState('');
    const [manualRate, setManualRate] = useState('');
    const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
    const [saving, setSaving] = useState(false);

    const loadEntries = useCallback(async () => {
        try {
            const ids = projects.map((p) => p.id);
            const data = await fetchTimeEntries(ids);
            setEntries(data);
        } catch (err) {
            console.error('Failed to load time entries:', err);
        } finally {
            setLoading(false);
        }
    }, [projects]);

    useEffect(() => { loadEntries(); }, [loadEntries]);

    useEffect(() => {
        if (projects.length > 0 && !manualProjectId) setManualProjectId(projects[0].id);
    }, [projects]);

    const formatTimer = (sec: number): string => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleStartTimer = () => { if (timerProjectId) onTimerStart(); };

    const handleStopTimer = async () => {
        onTimerStop();
        if (timerSeconds < 10 || !timerProjectId) { onTimerReset(); return; }
        try {
            const entry = await createTimeEntry({ projectId: timerProjectId, description: timerDesc, duration: timerSeconds, hourlyRate: null, date: new Date().toISOString().slice(0, 10) });
            setEntries((prev) => [entry, ...prev]);
            onTimerReset();
            onDataChanged?.();
        } catch (err) { console.error('Failed to save time entry:', err); }
    };

    const handleManualSave = async () => {
        if (!manualProjectId) return;
        const h = parseInt(manualHours || '0', 10);
        const m = parseInt(manualMinutes || '0', 10);
        const totalSec = h * 3600 + m * 60;
        if (totalSec <= 0) return;
        setSaving(true);
        try {
            const entry = await createTimeEntry({ projectId: manualProjectId, description: manualDesc, duration: totalSec, hourlyRate: manualRate ? parseFloat(manualRate) : null, date: manualDate });
            setEntries((prev) => [entry, ...prev]);
            setManualDesc(''); setManualHours(''); setManualMinutes(''); setManualRate('');
            setManualDate(new Date().toISOString().slice(0, 10));
            onDataChanged?.();
        } catch (err) { console.error('Failed to save time entry:', err); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await deleteTimeEntry(id); setEntries((prev) => prev.filter((e) => e.id !== id)); onDataChanged?.(); }
        catch (err) { console.error('Failed to delete time entry:', err); }
    };

    const totalSeconds = entries.reduce((s, e) => s + e.duration, 0);
    const totalAmount = entries.filter((e) => e.hourlyRate).reduce((s, e) => s + (e.duration / 3600) * (e.hourlyRate || 0), 0);

    const grouped = entries.reduce<Record<string, TimeEntry[]>>((acc, e) => {
        if (!acc[e.date]) acc[e.date] = [];
        acc[e.date].push(e);
        return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    if (projects.length === 0) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>⏱️</div>
                <div className={styles.emptyText}>{t.createProjectFirst}</div>
                <div className={styles.emptyHint}>{t.timeLinkedToProjects}</div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.timerSection}>
                <div className={timerRunning ? styles.timerDisplayRunning : styles.timerDisplay}>{formatTimer(timerSeconds)}</div>
                <div className={styles.timerProject}>
                    <select value={timerProjectId || ''} onChange={(e) => onTimerProjectChange(Number(e.target.value))} disabled={timerRunning}>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className={styles.timerDesc}>
                    <input type="text" placeholder={t.whatAreYouDoing} value={timerDesc} onChange={(e) => onTimerDescChange(e.target.value)} />
                </div>
                {timerRunning
                    ? <button className={styles.timerStop} onClick={handleStopTimer}>{t.timerStop}</button>
                    : <button className={styles.timerStart} onClick={handleStartTimer}>{t.timerStart}</button>
                }
            </div>

            <button className={styles.manualToggle} onClick={() => setShowManual(!showManual)}>
                {showManual ? t.hideManual : t.addManually}
            </button>

            {showManual && (
                <div className={styles.manualForm}>
                    <div className={styles.formGroupGrow}>
                        <label className={styles.formLabel}>{t.project}</label>
                        <select className={styles.formSelect} value={manualProjectId || ''} onChange={(e) => setManualProjectId(Number(e.target.value))}>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroupGrow}>
                        <label className={styles.formLabel}>{t.description}</label>
                        <input className={styles.formInput} type="text" placeholder={t.whatDidYouDo} value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t.time}</label>
                        <div className={styles.timeInputs}>
                            <input className={styles.timeInput} type="number" min="0" max="99" placeholder="H" value={manualHours} onChange={(e) => setManualHours(e.target.value)} />
                            <span className={styles.timeSep}>:</span>
                            <input className={styles.timeInput} type="number" min="0" max="59" placeholder="M" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t.hourlyRate}</label>
                        <input className={styles.formInput} type="number" min="0" placeholder="—" value={manualRate} onChange={(e) => setManualRate(e.target.value)} style={{ width: 80 }} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t.date}</label>
                        <input className={styles.formInput} type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                    </div>
                    <button className={styles.saveBtn} onClick={handleManualSave} disabled={saving || !manualProjectId || (!manualHours && !manualMinutes)}>
                        {saving ? t.saving : `+ ${t.add}`}
                    </button>
                </div>
            )}

            {entries.length > 0 && (
                <div className={styles.statsBar}>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>{t.totalTime}</div>
                        <div className={styles.statValue}>{formatDuration(totalSeconds)}</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>{t.entries}</div>
                        <div className={styles.statValue}>{entries.length}</div>
                    </div>
                    {totalAmount > 0 && (
                        <div className={styles.stat}>
                            <div className={styles.statLabel}>{t.amount}</div>
                            <div className={styles.statValueAccent}>{formatMoney(Math.round(totalAmount))}</div>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className={styles.empty}><div className={styles.emptyText}>{t.loading}</div></div>
            ) : entries.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>⏱️</div>
                    <div className={styles.emptyText}>{t.noTimeEntries}</div>
                    <div className={styles.emptyHint}>{t.noTimeHint}</div>
                </div>
            ) : (
                sortedDates.map((date) => {
                    const dayEntries = grouped[date];
                    const dayTotal = dayEntries.reduce((s, e) => s + e.duration, 0);
                    return (
                        <div key={date} className={styles.dayGroup}>
                            <div className={styles.dayHeader}>
                                <span>{formatDate(date)}</span>
                                <span className={styles.dayTotal}>{formatDuration(dayTotal)}</span>
                            </div>
                            <div className={styles.entriesList}>
                                {dayEntries.map((e) => (
                                    <div key={e.id} className={styles.entryRow}>
                                        <span className={styles.entryDate}>{formatDate(e.date)}</span>
                                        <span className={styles.entryProject}>{e.projectName}</span>
                                        <span className={e.description ? styles.entryDesc : styles.entryDescEmpty}>
                                            {e.description || t.noDescription}
                                        </span>
                                        <span className={styles.entryDuration}>{formatDuration(e.duration)}</span>
                                        {e.hourlyRate && (
                                            <span className={styles.entryAmount}>{formatMoney(Math.round((e.duration / 3600) * e.hourlyRate))}</span>
                                        )}
                                        <button className={styles.entryDelete} onClick={() => handleDelete(e.id)} title={t.delete}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </>
    );
};
