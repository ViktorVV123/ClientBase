import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import * as styles from './AuthPage.module.scss';

interface AuthPageProps {
    onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
    const { signIn, signUp } = useAuth();
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
            setError('Введите email и пароль');
            setLoading(false);
            return;
        }

        if (!isLogin && !fullName) {
            setError('Введите ваше имя');
            setLoading(false);
            return;
        }

        if (isLogin) {
            const { error } = await signIn(email, password);
            if (error) setError(translateError(error));
        } else {
            const { error } = await signUp(email, password, fullName);
            if (error) {
                setError(translateError(error));
            } else {
                setSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
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
                        ← Назад
                    </button>
                )}

                <div className={styles.logoRow}>
                    <div className={styles.logoMark}>CB</div>
                    <span className={styles.logoText}>ClientBase</span>
                </div>

                <div className={styles.subtitle}>
                    {isLogin
                        ? 'Войдите в свой аккаунт'
                        : 'Создайте аккаунт фрилансера'}
                </div>

                {!isLogin && (
                    <>
                        <label className={styles.label}>Полное имя</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Виктор Власюк"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </>
                )}

                <label className={styles.label}>Email</label>
                <input
                    className={styles.input}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus={isLogin}
                />

                <label className={styles.label}>Пароль</label>
                <input
                    className={styles.input}
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading
                        ? 'Загрузка...'
                        : isLogin
                            ? 'Войти'
                            : 'Зарегистрироваться'}
                </button>

                <div className={styles.switchRow}>
                    {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                    <button
                        className={styles.switchBtn}
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        {isLogin ? 'Создать' : 'Войти'}
                    </button>
                </div>
            </div>
        </div>
    );
};

function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Неверный email или пароль';
    if (msg.includes('User already registered')) return 'Этот email уже зарегистрирован';
    if (msg.includes('Password should be')) return 'Пароль должен быть минимум 6 символов';
    if (msg.includes('invalid email')) return 'Некорректный email';
    return msg;
}
