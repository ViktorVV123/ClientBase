import React, { useState, useEffect } from 'react';
import { Client } from '@/assets/data/data';
import { useAuth } from '@/lib/AuthContext';
import {
    fetchClients,
    createClient as createClientApi,
    updateClient as updateClientApi,
    deleteClient as deleteClientApi,
} from '@/lib/api';
import { fetchSubscription, canCreateClient, Subscription } from '@/lib/subscription';
import { ErrorBoundary } from '@/components/errorBoundary/ErrorBoundary';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { TopBar } from '@/components/topBar/TopBar';
import { AddClientModal } from '@/components/modal/AddClientModal';
import { UpgradeModal } from '@/components/modal/UpgradeModal';
import { AuthPage } from '@/pages/auth/AuthPage';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { ClientDetail } from '@/pages/clientDetail/ClientDetail';
import { PortalPreview } from '@/pages/portalPreview/PortalPreview';
import * as styles from './App.module.scss';

type View = 'dashboard' | 'client' | 'portal';
type ModalMode = 'closed' | 'add' | 'edit' | 'upgrade';

const AppContent: React.FC = () => {
    const { user, signOut } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [view, setView] = useState<View>('dashboard');
    const [modalMode, setModalMode] = useState<ModalMode>('closed');
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    useEffect(() => {
        loadClients();
        loadSubscription();
    }, []);

    // Проверяем URL на возврат из Stripe (success)
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
        } catch (err) {
            console.error('Failed to load clients:', err);
        } finally {
            setLoading(false);
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

    const handleOpenAddClient = async () => {
        const allowed = await canCreateClient();
        if (allowed) {
            setModalMode('add');
        } else {
            setModalMode('upgrade');
        }
    };

    const handleAddClient = async (newClient: Client) => {
        try {
            const created = await createClientApi({
                name: newClient.name,
                company: newClient.company,
                email: newClient.email,
                avatar: newClient.avatar,
                color: newClient.color,
            });
            setClients((prev) => [created, ...prev]);
        } catch (err) {
            console.error('Failed to create client:', err);
        }
    };

    const handleUpdateClient = async (
        clientId: number,
        data: { name: string; company: string; email: string; color: string; avatar: string }
    ) => {
        try {
            await updateClientApi(clientId, data);
            // Обновляем локальный стейт
            setClients((prev) =>
                prev.map((c) =>
                    c.id === clientId ? { ...c, ...data } : c
                )
            );
            // Обновляем выбранного клиента
            if (selectedClient?.id === clientId) {
                setSelectedClient((prev) => (prev ? { ...prev, ...data } : prev));
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

    return (
        <div className={styles.app}>
            <Sidebar
                clients={clients}
                selectedClientId={selectedClient?.id ?? null}
                onSelectClient={handleSelectClient}
                onDashboard={handleDashboard}
                onAddClient={handleOpenAddClient}
                onPortalPreview={handlePortalPreview}
            />

            <main className={styles.main}>
                <TopBar
                    clientName={selectedClient?.name}
                    onBreadcrumbClick={handleDashboard}
                    onSignOut={signOut}
                    userEmail={user?.email}
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
                    ) : view === 'client' && selectedClient ? (
                        <ClientDetail
                            client={selectedClient}
                            onEditClient={() => setModalMode('edit')}
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

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.logoMark}>CB</div>
                <div>Загрузка...</div>
            </div>
        );
    }

    if (!session) {
        return <AuthPage />;
    }

    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};
