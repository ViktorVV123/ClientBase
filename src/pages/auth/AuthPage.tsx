import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import * as styles from './AuthPage.module.scss';

interface AuthPageProps {
    onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
    const { signIn, signUp } = useAuth();
    const { t } = useI18n();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        if (!email || !password) {
            setError(t.enterCredentials);
            setLoading(false);
            return;
        }

        if (!isLogin && !fullName) {
            setError(t.enterName);
            setLoading(false);
            return;
        }

        if (isLogin) {
            const { error } = await signIn(email, password);
            if (error) setError(translateError(error, t));
        } else {
            const { error } = await signUp(email, password, fullName);
            if (error) {
                setError(translateError(error, t));
            } else {
                setSuccess(t.registerSuccess);
            }
        }

        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                {onBack && (
                    <button className={styles.backBtn} onClick={onBack}>
                        ← {t.back}
                    </button>
                )}

                <div className={styles.logoRow}>
                    <div className={styles.logoMark}>CB</div>
                    <span className={styles.logoText}>ClientBase</span>
                </div>

                <div className={styles.subtitle}>
                    {isLogin ? t.loginTitle : t.registerTitle}
                </div>

                {!isLogin && (
                    <>
                        <label className={styles.label}>{t.fullName}</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="John Smith"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </>
                )}

                <label className={styles.label}>{t.email}</label>
                <input
                    className={styles.input}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus={isLogin}
                />

                <label className={styles.label}>{t.password}</label>
                <input
                    className={styles.input}
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                    {loading ? t.loading : isLogin ? t.signIn : t.signUp}
                </button>

                <div className={styles.switchRow}>
                    {isLogin ? t.noAccount : t.hasAccount}
                    <button
                        className={styles.switchBtn}
                        onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                    >
                        {isLogin ? t.create : t.signIn}
                    </button>
                </div>
            </div>
        </div>
    );
};

function translateError(msg: string, t: any): string {
    if (msg.includes('Invalid login credentials')) return t.wrongCredentials;
    if (msg.includes('User already registered')) return t.emailExists;
    if (msg.includes('Password should be')) return t.shortPassword;
    if (msg.includes('invalid email')) return t.invalidEmail;
    return msg;
}
