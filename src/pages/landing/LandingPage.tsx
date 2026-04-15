import React, { useState } from 'react';
import * as styles from './LandingPage.module.scss';

type Lang = 'ru' | 'en';

const t = {
    ru: {
        nav: { features: 'Возможности', pricing: 'Тарифы', login: 'Войти', start: 'Начать бесплатно' },
        hero: {
            badge: 'Клиентский портал для профессионалов',
            title1: 'Управляйте клиентами.',
            title2: 'Впечатляйте результатом.',
            subtitle: 'Проекты, счета, файлы и брендированный портал для ваших клиентов — всё в одном месте. Бесплатно для старта.',
            cta: 'Попробовать бесплатно',
            ctaSub: 'Без карты · 1 клиент бесплатно навсегда',
        },
        features: {
            title: 'Всё что нужно фрилансеру',
            subtitle: 'Минимум настроек — максимум пользы',
            items: [
                { icon: '📋', title: 'Канбан проектов', desc: 'Drag-and-drop доска с автоматическим прогрессом. Бриф → В работе → Ревью → Готово.' },
                { icon: '💳', title: 'Счета и оплата', desc: 'Создавайте счета, отслеживайте статус оплаты. Клиент видит всё в портале.' },
                { icon: '📁', title: 'Файлы', desc: 'Загрузка и скачивание файлов. Дизайн-макеты, документы, архивы — всё в одном месте.' },
                { icon: '🔗', title: 'Портал клиента', desc: 'Публичная ссылка для клиента — проекты, счета, файлы и заметки без регистрации.' },
                { icon: '🎨', title: 'Брендинг', desc: 'Логотип, цвет, градиенты — портал выглядит как ваш собственный продукт.' },
                { icon: '📝', title: 'Заметки', desc: 'Комментарии к проектам. Выбирайте: видна клиенту или только вам.' },
            ],
        },
        portal: {
            title: 'Портал, который впечатляет',
            subtitle: 'Ваш клиент видит профессиональную страницу с вашим брендом',
        },
        pricing: {
            title: 'Простые тарифы',
            subtitle: 'Начните бесплатно, перейдите на Pro когда вырастете',
            free: {
                name: 'Free',
                price: '0 ₽',
                period: 'навсегда',
                features: ['1 клиент', 'Все базовые функции', 'Канбан проектов', 'Счета и файлы', 'Портал клиента'],
                cta: 'Начать бесплатно',
            },
            pro: {
                name: 'Pro',
                price: '299 ₽',
                period: '/мес',
                features: ['Безлимит клиентов', 'Всё из Free', 'Кастомный брендинг', 'Градиенты и логотип', 'Приоритетная поддержка'],
                cta: 'Попробовать Pro',
                badge: 'Популярный',
            },
        },
        cta: {
            title: 'Готовы начать?',
            subtitle: 'Регистрация занимает 30 секунд. Без карты.',
            button: 'Создать аккаунт бесплатно',
        },
        footer: {
            copy: '© 2026 ClientBase. Все права защищены.',
            links: ['Политика конфиденциальности', 'Условия использования'],
        },
    },
    en: {
        nav: { features: 'Features', pricing: 'Pricing', login: 'Sign in', start: 'Start free' },
        hero: {
            badge: 'Client portal for professionals',
            title1: 'Manage clients.',
            title2: 'Impress with results.',
            subtitle: 'Projects, invoices, files and a branded portal for your clients — all in one place. Free to start.',
            cta: 'Try for free',
            ctaSub: 'No credit card · 1 client free forever',
        },
        features: {
            title: 'Everything a freelancer needs',
            subtitle: 'Minimal setup — maximum value',
            items: [
                { icon: '📋', title: 'Kanban board', desc: 'Drag-and-drop board with auto-progress. Brief → In progress → Review → Done.' },
                { icon: '💳', title: 'Invoices & billing', desc: 'Create invoices, track payment status. Clients see everything in the portal.' },
                { icon: '📁', title: 'File sharing', desc: 'Upload and download files. Design mockups, documents, archives — all in one place.' },
                { icon: '🔗', title: 'Client portal', desc: 'A public link for your client — projects, invoices, files and notes without registration.' },
                { icon: '🎨', title: 'Custom branding', desc: 'Logo, colors, gradients — the portal looks like your own product.' },
                { icon: '📝', title: 'Project notes', desc: 'Comments on projects. Choose: visible to client or private.' },
            ],
        },
        portal: {
            title: 'A portal that impresses',
            subtitle: 'Your client sees a professional page with your brand',
        },
        pricing: {
            title: 'Simple pricing',
            subtitle: 'Start free, upgrade to Pro when you grow',
            free: {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: ['1 client', 'All basic features', 'Kanban board', 'Invoices & files', 'Client portal'],
                cta: 'Start free',
            },
            pro: {
                name: 'Pro',
                price: '$4',
                period: '/mo',
                features: ['Unlimited clients', 'Everything in Free', 'Custom branding', 'Gradients & logo', 'Priority support'],
                cta: 'Try Pro',
                badge: 'Popular',
            },
        },
        cta: {
            title: 'Ready to start?',
            subtitle: 'Sign up takes 30 seconds. No credit card.',
            button: 'Create free account',
        },
        footer: {
            copy: '© 2026 ClientBase. All rights reserved.',
            links: ['Privacy Policy', 'Terms of Service'],
        },
    },
};

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    const [lang, setLang] = useState<Lang>('ru');
    const s = t[lang];

    return (
        <div className={styles.page}>
            {/* Nav */}
            <nav className={styles.nav}>
                <div className={styles.navInner}>
                    <div className={styles.navLogo}>
                        <div className={styles.logoMark}>CB</div>
                        <span className={styles.logoText}>ClientBase</span>
                    </div>
                    <div className={styles.navLinks}>
                        <a href="#features" className={styles.navLink}>{s.nav.features}</a>
                        <a href="#pricing" className={styles.navLink}>{s.nav.pricing}</a>
                        <button className={styles.langToggle} onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}>
                            {lang === 'ru' ? 'EN' : 'RU'}
                        </button>
                        <button className={styles.navLoginBtn} onClick={onLogin}>{s.nav.login}</button>
                        <button className={styles.navStartBtn} onClick={onGetStarted}>{s.nav.start}</button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroGlow} />
                <div className={styles.heroBadge}>{s.hero.badge}</div>
                <h1 className={styles.heroTitle}>
                    <span className={styles.heroLine1}>{s.hero.title1}</span>
                    <span className={styles.heroLine2}>{s.hero.title2}</span>
                </h1>
                <p className={styles.heroSubtitle}>{s.hero.subtitle}</p>
                <button className={styles.heroCta} onClick={onGetStarted}>{s.hero.cta}</button>
                <div className={styles.heroCtaSub}>{s.hero.ctaSub}</div>

                {/* Mock dashboard */}
                <div className={styles.heroMock}>
                    <div className={styles.mockBar}>
                        <div className={styles.mockDots}>
                            <span /><span /><span />
                        </div>
                        <div className={styles.mockUrl}>client-base.app</div>
                    </div>
                    <div className={styles.mockContent}>
                        <div className={styles.mockSidebar}>
                            <div className={styles.mockSidebarLogo}>CB</div>
                            <div className={styles.mockSidebarItem} style={{ opacity: 1 }} />
                            <div className={styles.mockSidebarItem} />
                            <div className={styles.mockSidebarItem} />
                            <div className={styles.mockSidebarSep} />
                            <div className={styles.mockSidebarClient}><span className={styles.mockDot} style={{ background: '#6366f1' }} />Client 1</div>
                            <div className={styles.mockSidebarClient}><span className={styles.mockDot} style={{ background: '#ec4899' }} />Client 2</div>
                            <div className={styles.mockSidebarClient}><span className={styles.mockDot} style={{ background: '#14b8a6' }} />Client 3</div>
                        </div>
                        <div className={styles.mockMain}>
                            <div className={styles.mockStats}>
                                <div className={styles.mockStatCard}><span className={styles.mockStatNum} style={{ color: '#6366f1' }}>12</span><span className={styles.mockStatLabel}>{lang === 'ru' ? 'Клиентов' : 'Clients'}</span></div>
                                <div className={styles.mockStatCard}><span className={styles.mockStatNum} style={{ color: '#22c55e' }}>₽840K</span><span className={styles.mockStatLabel}>{lang === 'ru' ? 'Получено' : 'Earned'}</span></div>
                                <div className={styles.mockStatCard}><span className={styles.mockStatNum} style={{ color: '#f59e0b' }}>₽125K</span><span className={styles.mockStatLabel}>{lang === 'ru' ? 'К оплате' : 'Pending'}</span></div>
                                <div className={styles.mockStatCard}><span className={styles.mockStatNum} style={{ color: '#a855f7' }}>8/24</span><span className={styles.mockStatLabel}>{lang === 'ru' ? 'Проекты' : 'Projects'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className={styles.features} id="features">
                <h2 className={styles.sectionTitle}>{s.features.title}</h2>
                <p className={styles.sectionSubtitle}>{s.features.subtitle}</p>
                <div className={styles.featureGrid}>
                    {s.features.items.map((f, i) => (
                        <div key={i} className={styles.featureCard}>
                            <div className={styles.featureIcon}>{f.icon}</div>
                            <div className={styles.featureTitle}>{f.title}</div>
                            <div className={styles.featureDesc}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Portal preview */}
            <section className={styles.portalSection}>
                <h2 className={styles.sectionTitle}>{s.portal.title}</h2>
                <p className={styles.sectionSubtitle}>{s.portal.subtitle}</p>
                <div className={styles.portalMock}>
                    <div className={styles.portalHeader}>
                        <div className={styles.portalLogoMock}>LOGO</div>
                        <div>
                            <div className={styles.portalCompany}>Design Studio</div>
                            <div className={styles.portalGreeting}>{lang === 'ru' ? 'Добро пожаловать, Алексей' : 'Welcome, Alex'}</div>
                        </div>
                    </div>
                    <div className={styles.portalBody}>
                        <div className={styles.portalCard}>
                            <div className={styles.portalCardTitle}>{lang === 'ru' ? 'Редизайн лендинга' : 'Landing page redesign'}</div>
                            <div className={styles.portalProgress}><div className={styles.portalProgressFill} style={{ width: '75%' }} /></div>
                            <div className={styles.portalCardMeta}>75% · {lang === 'ru' ? 'На ревью' : 'In review'}</div>
                        </div>
                        <div className={styles.portalCard}>
                            <div className={styles.portalCardTitle}>{lang === 'ru' ? 'Мобильная адаптация' : 'Mobile adaptation'}</div>
                            <div className={styles.portalProgress}><div className={styles.portalProgressFill} style={{ width: '40%' }} /></div>
                            <div className={styles.portalCardMeta}>40% · {lang === 'ru' ? 'В работе' : 'In progress'}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className={styles.pricingSection} id="pricing">
                <h2 className={styles.sectionTitle}>{s.pricing.title}</h2>
                <p className={styles.sectionSubtitle}>{s.pricing.subtitle}</p>
                <div className={styles.pricingGrid}>
                    {/* Free */}
                    <div className={styles.pricingCard}>
                        <div className={styles.pricingName}>{s.pricing.free.name}</div>
                        <div className={styles.pricingPrice}>
                            <span className={styles.priceAmount}>{s.pricing.free.price}</span>
                            <span className={styles.pricePeriod}>{s.pricing.free.period}</span>
                        </div>
                        <ul className={styles.pricingFeatures}>
                            {s.pricing.free.features.map((f, i) => (
                                <li key={i}>{f}</li>
                            ))}
                        </ul>
                        <button className={styles.pricingCtaOutline} onClick={onGetStarted}>{s.pricing.free.cta}</button>
                    </div>
                    {/* Pro */}
                    <div className={`${styles.pricingCard} ${styles.pricingCardPro}`}>
                        <div className={styles.pricingBadge}>{s.pricing.pro.badge}</div>
                        <div className={styles.pricingName}>{s.pricing.pro.name}</div>
                        <div className={styles.pricingPrice}>
                            <span className={styles.priceAmount}>{s.pricing.pro.price}</span>
                            <span className={styles.pricePeriod}>{s.pricing.pro.period}</span>
                        </div>
                        <ul className={styles.pricingFeatures}>
                            {s.pricing.pro.features.map((f, i) => (
                                <li key={i}>{f}</li>
                            ))}
                        </ul>
                        <button className={styles.pricingCtaPrimary} onClick={onGetStarted}>{s.pricing.pro.cta}</button>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className={styles.finalCta}>
                <h2 className={styles.finalCtaTitle}>{s.cta.title}</h2>
                <p className={styles.finalCtaSubtitle}>{s.cta.subtitle}</p>
                <button className={styles.finalCtaBtn} onClick={onGetStarted}>{s.cta.button}</button>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerLogo}>
                        <div className={styles.logoMark}>CB</div>
                        <span>ClientBase</span>
                    </div>
                    <div className={styles.footerCopy}>{s.footer.copy}</div>
                </div>
            </footer>
        </div>
    );
};
