import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@/assets/data/data';
import { useAuth } from '@/lib/AuthContext';
import {
    fetchClients,
    createClient as createClientApi,
    updateClient as updateClientApi,
    deleteClient as deleteClientApi,
    updateNotificationSettings as updateNotificationSettingsApi,
} from '@/lib/api';
import { fetchSubscription, canCreateClient, Subscription } from '@/lib/subscription';
import { ErrorBoundary } from '@/components/errorBoundary/ErrorBoundary';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { TopBar } from '@/components/topBar/TopBar';
import { AddClientModal } from '@/components/modal/AddClientModal';
import { UpgradeModal } from '@/components/modal/UpgradeModal';
import { AuthPage } from '@/pages/auth/AuthPage';
import { LandingPage } from '@/pages/landing/LandingPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ClientDetail } from '@/pages/clientDetail/ClientDetail';
import { PortalPreview } from '@/pages/portalPreview/PortalPreview';
import * as styles from './App.module.scss';

type View = 'dashboard' | 'client' | 'portal' | 'calendar' | 'settings';
type ModalMode = 'closed' | 'add' | 'edit' | 'upgrade';

const AppContent: React.FC = () => {
    const { user, signOut } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [view, setView] = useState<View>('dashboard');
    const [modalMode, setModalMode] = useState<ModalMode>('closed');
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ─── Global timer state (survives all navigation) ─────────────
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerProjectId, setTimerProjectId] = useState<number | null>(null);
    const [timerDesc, setTimerDesc] = useState('');
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (timerRunning) {
            timerIntervalRef.current = setInterval(() => {
                setTimerSeconds((s) => s + 1);
            }, 1000);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [timerRunning]);

    const timerState = {
        timerRunning,
        timerSeconds,
        timerProjectId,
        timerDesc,
        onTimerStart: () => setTimerRunning(true),
        onTimerStop: () => {
            setTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        },
        onTimerReset: () => { setTimerSeconds(0); setTimerDesc(''); },
        onTimerProjectChange: setTimerProjectId,
        onTimerDescChange: setTimerDesc,
    };

    useEffect(() => {
        loadClients();
        loadSubscription();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') === 'success') {
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => loadSubscription(), 1500);
        }
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await fetchClients();
            setClients(data);
            // Обновляем selectedClient если он есть
            if (selectedClient) {
                const updated = data.find((c) => c.id === selectedClient.id);
                if (updated) setSelectedClient(updated);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
        } finally {
            setLoading(false);
        }
    };

    // Лёгкая перезагрузка без спиннера — для обновлений внутри ClientDetail
    const refreshClients = async () => {
        try {
            const data = await fetchClients();
            setClients(data);
            if (selectedClient) {
                const updated = data.find((c) => c.id === selectedClient.id);
                if (updated) setSelectedClient(updated);
            }
        } catch (err) {
            console.error('Failed to refresh clients:', err);
        }
    };

    const loadSubscription = async () => {
        try {
            const sub = await fetchSubscription();
            setSubscription(sub);
        } catch (err) {
            console.error('Failed to load subscription:', err);
        }
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setView('client');
    };

    const handleDashboard = () => {
        setSelectedClient(null);
        setView('dashboard');
    };

    const handleCalendar = () => {
        setSelectedClient(null);
        setView('calendar');
    };

    const handleSettings = () => {
        setSelectedClient(null);
        setView('settings');
    };

    const handleOpenAddClient = async () => {
        const allowed = await canCreateClient();
        if (allowed) {
            setModalMode('add');
        } else {
            setModalMode('upgrade');
        }
    };

    const handleAddClient = async (newClient: Client, enableNotifications: boolean = true) => {
        try {
            const created = await createClientApi({
                name: newClient.name,
                company: newClient.company,
                email: newClient.email,
                avatar: newClient.avatar,
                color: newClient.color,
            });
            setClients((prev) => [created, ...prev]);

            // Если уведомления выключены — обновляем настройки
            if (!enableNotifications) {
                try {
                    await updateNotificationSettingsApi(created.id, {
                        notify_project_created: false,
                        notify_project_status: false,
                        notify_invoice_created: false,
                    });
                } catch {}
            }
        } catch (err) {
            console.error('Failed to create client:', err);
        }
    };

    const handleUpdateClient = async (
        clientId: number,
        data: { name: string; company: string; email: string; color: string; avatar: string; show_card_in_portal?: boolean }
    ) => {
        try {
            await updateClientApi(clientId, data);
            const mapped = {
                name: data.name,
                company: data.company,
                email: data.email,
                color: data.color,
                avatar: data.avatar,
                showCardInPortal: data.show_card_in_portal,
            };
            setClients((prev) =>
                prev.map((c) =>
                    c.id === clientId ? { ...c, ...mapped } : c
                )
            );
            if (selectedClient?.id === clientId) {
                setSelectedClient((prev) => (prev ? { ...prev, ...mapped } : prev));
            }
        } catch (err) {
            console.error('Failed to update client:', err);
        }
    };

    const handleDeleteClient = async (clientId: number) => {
        try {
            await deleteClientApi(clientId);
            setClients((prev) => prev.filter((c) => c.id !== clientId));
            if (selectedClient?.id === clientId) {
                setSelectedClient(null);
                setView('dashboard');
            }
        } catch (err) {
            console.error('Failed to delete client:', err);
        }
    };

    const handlePortalPreview = () => {
        if (selectedClient) {
            setView('portal');
        }
    };

    const currentPlan = subscription?.plan || 'free';

    return (
        <div className={styles.app}>
            <Sidebar
                clients={clients}
                selectedClientId={selectedClient?.id ?? null}
                onSelectClient={handleSelectClient}
                onDashboard={handleDashboard}
                onCalendar={handleCalendar}
                onSettings={handleSettings}
                onAddClient={handleOpenAddClient}
                onPortalPreview={handlePortalPreview}
                plan={currentPlan}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeView={view}
            />

            <main className={styles.main}>
                <TopBar
                    clientName={selectedClient?.name}
                    onBreadcrumbClick={handleDashboard}
                    onSignOut={signOut}
                    userEmail={user?.email}
                    plan={currentPlan}
                    onUpgrade={() => setModalMode('upgrade')}
                    onMenuToggle={() => setSidebarOpen(true)}
                />

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner} />
                            <div>Загрузка данных...</div>
                        </div>
                    ) : view === 'dashboard' ? (
                        <Dashboard
                            clients={clients}
                            onSelectClient={handleSelectClient}
                        />
                    ) : view === 'calendar' ? (
                        <CalendarPage
                            clients={clients}
                            onSelectClient={handleSelectClient}
                        />
                    ) : view === 'client' && selectedClient ? (
                        <ClientDetail
                            client={selectedClient}
                            onEditClient={() => setModalMode('edit')}
                            isPro={currentPlan === 'pro'}
                            onUpgrade={() => setModalMode('upgrade')}
                            onDataChanged={refreshClients}
                            timerState={timerState}
                        />
                    ) : view === 'settings' ? (
                        <SettingsPage
                            userEmail={user?.email}
                            plan={currentPlan}
                            onUpgrade={() => setModalMode('upgrade')}
                        />
                    ) : view === 'portal' && selectedClient ? (
                        <PortalPreview
                            client={selectedClient}
                            onClose={() => setView('client')}
                        />
                    ) : null}
                </div>
            </main>

            {(modalMode === 'add' || modalMode === 'edit') && (
                <AddClientModal
                    client={modalMode === 'edit' ? selectedClient : null}
                    onClose={() => setModalMode('closed')}
                    onAdd={handleAddClient}
                    onUpdate={handleUpdateClient}
                    onDelete={handleDeleteClient}
                    isPro={currentPlan === 'pro'}
                    onUpgrade={() => {
                        setModalMode('upgrade');
                    }}
                />
            )}

            {modalMode === 'upgrade' && (
                <UpgradeModal onClose={() => setModalMode('closed')} />
            )}
        </div>
    );
};

export const App: React.FC = () => {
    const { session, loading } = useAuth();
    const [showAuth, setShowAuth] = useState(false);

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.logoMark}>CB</div>
                <div>Загрузка...</div>
            </div>
        );
    }

    if (!session) {
        if (showAuth) {
            return <AuthPage onBack={() => setShowAuth(false)} />;
        }
        return (
            <LandingPage
                onGetStarted={() => setShowAuth(true)}
                onLogin={() => setShowAuth(true)}
            />
        );
    }

    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};
