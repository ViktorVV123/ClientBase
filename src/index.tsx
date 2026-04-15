// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { I18nProvider } from '@/lib/i18n';
import { App } from '@/components/App';
import { PublicPortal } from '@/pages/publicPortal/PublicPortal';
import './global.scss';

const root = document.getElementById('root');
if (!root) {
    throw new Error('root not found');
}

const router = createBrowserRouter([
    {
        path: '/portal/:token',
        element: (
            <I18nProvider>
                <PublicPortal />
            </I18nProvider>
        ),
    },
    {
        path: '*',
        element: (
            <I18nProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </I18nProvider>
        ),
    },
]);

createRoot(root).render(<RouterProvider router={router} />);
