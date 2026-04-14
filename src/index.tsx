// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
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
        element: <PublicPortal />,
    },
    {
        path: '*',
        element: (
            <AuthProvider>
                <App />
            </AuthProvider>
        ),
    },
]);

createRoot(root).render(<RouterProvider router={router} />);
