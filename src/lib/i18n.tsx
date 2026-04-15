import React, { createContext, useContext, useState, useCallback } from 'react';

export type Locale = 'ru' | 'en';

const translations = {
    ru: {
        // ─── Common ──────────────────────────────────────────
        save: 'Сохранить',
        saving: 'Сохраняю…',
        saved: '✓ Сохранено',
        cancel: 'Отмена',
        create: 'Создать',
        creating: 'Создание...',
        delete: 'Удалить',
        edit: 'Редактировать',
        close: 'Закрыть',
        add: 'Добавить',
        loading: 'Загрузка...',
        loadingData: 'Загрузка данных...',
        back: 'Назад',
        yes: 'Да',
        no: 'Нет',
        noDescription: 'без описания',

        // ─── Sidebar ────────────────────────────────────────
        dashboard: 'Дашборд',
        calendar: 'Календарь',
        settings: 'Настройки',
        clients: 'Клиенты',
        newClient: '+ Новый клиент',
        clientPortal: '👁️ Портал клиента',
        supportTg: '✈️ Поддержка в Telegram',
        planFree: 'Free',
        planPro: '⭐ Pro Plan',
        freeLimit: (n: number) => `Free · ${n}/1 клиент`,

        // ─── TopBar ─────────────────────────────────────────
        allClients: 'Все клиенты',
        upgrade: 'Upgrade',
        signOut: 'Выйти',

        // ─── Dashboard ──────────────────────────────────────
        clientsCount: 'Клиенты',
        active: 'активных',
        received: 'Получено',
        totalPaid: 'всего оплачено',
        awaitingPayment: 'Ожидает оплаты',
        pending: 'в ожидании',
        projects: 'Проекты',
        activeSlashTotal: 'активных / всего',
        client: 'Клиент',
        projectsCol: 'Проекты',
        paidCol: 'Оплачено',
        pendingCol: 'К оплате',
        lastActivity: 'Последняя активность',
        activeProjects: 'активных',

        // ─── Client Detail ──────────────────────────────────
        editClient: '✏ Редактировать',
        previewPortal: '👁️ Предпросмотр портала',
        tabProjects: 'Проекты',
        tabInvoices: 'Счета',
        tabFiles: 'Файлы',
        tabTime: 'Время',
        tabPortal: 'Портал',

        // ─── Projects ───────────────────────────────────────
        addProject: '+ Добавить проект',
        noProjects: '— пока нет проектов',
        empty: 'Пусто',
        dropHere: 'Отпустите здесь',
        deadline: 'Дедлайн',

        // ─── Project Modal ──────────────────────────────────
        newProject: 'Новый проект',
        editProject: 'Редактировать проект',
        projectName: 'Название',
        projectNamePlaceholder: 'Редизайн лендинга',
        description: 'Описание',
        descriptionPlaceholder: 'ТЗ, ссылки, заметки по проекту...',
        status: 'Статус',
        statusBrief: 'Бриф',
        statusInProgress: 'В работе',
        statusReview: 'На ревью',
        statusDone: 'Готово',
        priority: 'Приоритет',
        priorityNormal: 'Обычный',
        priorityUrgent: '🔥 Срочный',
        progress: 'Прогресс',
        progressAuto: (done: number, total: number, pct: number) => `Прогресс: ${done}/${total} задач (${pct}%)`,
        deleteProject: 'Удалить проект?',

        // ─── Tasks ──────────────────────────────────────────
        tasks: 'Задачи',
        addTask: 'Добавить задачу...',
        tasksEmpty: 'Разбейте проект на задачи',

        // ─── Notes ──────────────────────────────────────────
        notes: 'Заметки',
        writeNote: 'Написать заметку...',
        visibleToClient: '👁 Видна клиенту',
        privateNote: '🔒 Только для вас',
        clientSees: '👁 Клиент видит',
        privateLabel: '🔒 Приватная',
        noNotes: 'Заметок пока нет',

        // ─── Invoices ───────────────────────────────────────
        invoices: 'Счета',
        newInvoice: '+ Новый счёт',
        editInvoice: 'Редактировать счёт',
        invoiceNumber: 'Номер',
        invoiceAmount: 'Сумма',
        invoiceDate: 'Дата',
        invoiceDueDate: 'Оплата до',
        invoiceStatus: 'Статус',
        invoiceStatusPaid: 'Оплачен',
        invoiceStatusPending: 'Ожидает',
        invoiceStatusOverdue: 'Просрочен',
        totalAmount: 'Всего',
        paidAmount: 'Оплачено',
        pendingAmount: 'К оплате',
        noInvoices: 'Счетов пока нет. Создайте первый!',
        amountLabel: 'Сумма (₽)',
        dueDateLabel: 'Оплатить до',

        // ─── Files ──────────────────────────────────────────
        files: 'Файлы',
        uploadFiles: 'Загрузить файлы',
        dragOrClick: 'Перетащите файлы сюда или нажмите',
        noFiles: 'Файлов пока нет',

        // ─── Time Tracking ──────────────────────────────────
        timerStart: '▶ Старт',
        timerStop: '⏹ Стоп',
        whatAreYouDoing: 'Чем занимаетесь?',
        addManually: '▸ Добавить вручную',
        hideManual: '▾ Скрыть ручной ввод',
        project: 'Проект',
        time: 'Время',
        hourlyRate: 'Ставка ₽/ч',
        date: 'Дата',
        totalTime: 'Всего времени',
        entries: 'Записей',
        amount: 'Сумма',
        noTimeEntries: 'Записей пока нет',
        noTimeHint: 'Запустите таймер или добавьте время вручную',
        createProjectFirst: 'Сначала создайте проект',
        timeLinkedToProjects: 'Время привязывается к проектам клиента',
        whatDidYouDo: 'Что делали?',

        // ─── Portal ─────────────────────────────────────────
        portal: 'Портал',
        portalLink: 'Ссылка на портал',
        generateLink: 'Сгенерировать ссылку',
        deactivateLink: 'Деактивировать',
        copyLink: 'Скопировать',
        copied: 'Скопировано!',
        portalDesc: 'Эта ссылка открывает публичный портал для вашего клиента',
        brandingPro: 'Кастомный брендинг',
        brandingProDesc: 'Логотип и цвета в портале клиента',

        // ─── Branding ───────────────────────────────────────
        branding: 'Брендинг портала',
        brandingHint: 'Настройте внешний вид портала для ваших клиентов',
        companyName: 'Название компании',
        logoUpload: 'Загрузите логотип',
        logoPlaceholder: 'Ваш логотип здесь',
        colorScheme: 'Цветовая схема',
        gradients: 'Градиенты (Pro)',
        proOnly: 'Доступно на Pro',

        // ─── Notifications ──────────────────────────────────
        notifications: 'Уведомления',
        notifyProjectCreated: 'Новый проект создан',
        notifyProjectCreatedDesc: 'Клиент получит письмо при создании проекта',
        notifyProjectStatus: 'Статус проекта изменён',
        notifyProjectStatusDesc: 'Письмо при смене статуса (Бриф → В работе и т.д.)',
        notifyInvoiceCreated: 'Новый счёт выставлен',
        notifyInvoiceCreatedDesc: 'Письмо с суммой и дедлайном оплаты',

        // ─── Add/Edit Client Modal ──────────────────────────
        addClientTitle: 'Новый клиент',
        editClientTitle: 'Редактировать клиента',
        clientName: 'Имя клиента',
        clientNamePlaceholder: 'Алексей Петров',
        company: 'Компания',
        companyPlaceholder: 'StartupFlow',
        email: 'Email',
        emailPlaceholder: 'client@company.com',
        avatar: 'Аватар',
        color: 'Цвет',
        enableNotifications: 'Включить email-уведомления для этого клиента',
        deleteClient: 'Удалить клиента',
        deleteClientConfirm: 'Удалить клиента и все его данные?',
        noCompany: 'Без компании',

        // ─── Upgrade Modal ──────────────────────────────────
        upgradeTo: 'Перейти на Pro',
        upgradeTitle: 'Разблокируйте всё',
        unlimitedClients: 'Безлимит клиентов',
        unlimitedDesc: 'Добавляйте сколько угодно клиентов',
        customBranding: 'Кастомный брендинг',
        customBrandingDesc: 'Логотип и цвета в портале клиента',
        prioritySupport: 'Приоритетная поддержка',
        prioritySupportDesc: 'Ответ в течение 24 часов',
        pricePerMonth: '4$ / мес',
        paymentError: 'Ошибка при создании оплаты',
        paymentTryLater: 'Не удалось создать сессию оплаты. Попробуйте позже.',

        // ─── Auth ───────────────────────────────────────────
        signIn: 'Войти',
        signUp: 'Зарегистрироваться',
        loginTitle: 'Войдите в свой аккаунт',
        registerTitle: 'Создайте аккаунт фрилансера',
        enterCredentials: 'Введите email и пароль',
        enterName: 'Введите ваше имя',
        fullName: 'Полное имя',
        password: 'Пароль',
        noAccount: 'Нет аккаунта?',
        hasAccount: 'Уже есть аккаунт?',
        registerSuccess: 'Регистрация успешна! Проверьте почту для подтверждения.',
        invalidEmail: 'Некорректный email',
        shortPassword: 'Пароль должен быть минимум 6 символов',
        wrongCredentials: 'Неверный email или пароль',
        emailExists: 'Этот email уже зарегистрирован',

        // ─── Settings ───────────────────────────────────────
        settingsTitle: 'Настройки',
        profile: 'Профиль',
        name: 'Имя',
        emailCantChange: 'Изменить email нельзя',
        companyBrand: 'Название компании / бренда',
        shownInPortal: 'Отображается в портале клиента',
        billingDetails: 'Реквизиты для счетов (пока в разработке)',
        businessName: 'Наименование ИП / Организации',
        businessNamePlaceholder: 'ИП Иванов И.И.',
        inn: 'ИНН',
        bank: 'Банк',
        bik: 'БИК',
        bankAccount: 'Расчётный счёт',
        corrAccount: 'Корр. счёт',
        billingHint: 'Эти данные будут подставляться в PDF-счета для клиентов',
        currencyAndRate: 'Валюта и ставка (в разработке)',
        currency: 'Валюта',
        defaultRate: 'Ставка по умолчанию',
        defaultRateHint: 'Подставляется при трекинге времени',
        subscription: 'Подписка',
        freePlan: 'Бесплатный план',
        freePlanDesc: '1 клиент, базовые функции',
        proPlan: 'Pro Plan',
        proPlanDesc: 'Безлимит клиентов, брендинг, все функции',
        goToPro: 'Перейти на Pro',
        security: 'Безопасность',
        passwordResetInfo: 'Для смены пароля мы отправим ссылку на ваш email',
        resetPassword: 'Сбросить пароль',
        passwordResetSent: 'Письмо для сброса пароля отправлено на ',
        rubles: '₽ — Рубли',
        dollars: '$ — Доллары',
        euros: '€ — Евро',

        // ─── Calendar ───────────────────────────────────────
        calendarTitle: 'Календарь дедлайнов',
        event: 'событие',
        events2to4: 'события',
        events5plus: 'событий',
        overdueExcl: 'Просрочен!',

        // ─── Public Portal ──────────────────────────────────
        welcome: 'Добро пожаловать',
        yourProjects: 'Ваши проекты',
        yourInvoices: 'Счета',
        yourFiles: 'Файлы',
        download: 'Скачать',
        portalPowered: 'Работает на ClientBase',
    },

    en: {
        // ─── Common ──────────────────────────────────────────
        save: 'Save',
        saving: 'Saving…',
        saved: '✓ Saved',
        cancel: 'Cancel',
        create: 'Create',
        creating: 'Creating...',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        add: 'Add',
        loading: 'Loading...',
        loadingData: 'Loading data...',
        back: 'Back',
        yes: 'Yes',
        no: 'No',
        noDescription: 'no description',

        // ─── Sidebar ────────────────────────────────────────
        dashboard: 'Dashboard',
        calendar: 'Calendar',
        settings: 'Settings',
        clients: 'Clients',
        newClient: '+ New Client',
        clientPortal: '👁️ Client Portal',
        supportTg: '✈️ Telegram Support',
        planFree: 'Free',
        planPro: '⭐ Pro Plan',
        freeLimit: (n: number) => `Free · ${n}/1 client`,

        // ─── TopBar ─────────────────────────────────────────
        allClients: 'All Clients',
        upgrade: 'Upgrade',
        signOut: 'Sign out',

        // ─── Dashboard ──────────────────────────────────────
        clientsCount: 'Clients',
        active: 'active',
        received: 'Received',
        totalPaid: 'total paid',
        awaitingPayment: 'Awaiting Payment',
        pending: 'pending',
        projects: 'Projects',
        activeSlashTotal: 'active / total',
        client: 'Client',
        projectsCol: 'Projects',
        paidCol: 'Paid',
        pendingCol: 'Pending',
        lastActivity: 'Last Activity',
        activeProjects: 'active',

        // ─── Client Detail ──────────────────────────────────
        editClient: '✏ Edit',
        previewPortal: '👁️ Portal Preview',
        tabProjects: 'Projects',
        tabInvoices: 'Invoices',
        tabFiles: 'Files',
        tabTime: 'Time',
        tabPortal: 'Portal',

        // ─── Projects ───────────────────────────────────────
        addProject: '+ Add Project',
        noProjects: '— no projects yet',
        empty: 'Empty',
        dropHere: 'Drop here',
        deadline: 'Deadline',

        // ─── Project Modal ──────────────────────────────────
        newProject: 'New Project',
        editProject: 'Edit Project',
        projectName: 'Name',
        projectNamePlaceholder: 'Landing page redesign',
        description: 'Description',
        descriptionPlaceholder: 'Brief, links, project notes...',
        status: 'Status',
        statusBrief: 'Brief',
        statusInProgress: 'In Progress',
        statusReview: 'Review',
        statusDone: 'Done',
        priority: 'Priority',
        priorityNormal: 'Normal',
        priorityUrgent: '🔥 Urgent',
        progress: 'Progress',
        progressAuto: (done: number, total: number, pct: number) => `Progress: ${done}/${total} tasks (${pct}%)`,
        deleteProject: 'Delete project?',

        // ─── Tasks ──────────────────────────────────────────
        tasks: 'Tasks',
        addTask: 'Add a task...',
        tasksEmpty: 'Break down the project into tasks',

        // ─── Notes ──────────────────────────────────────────
        notes: 'Notes',
        writeNote: 'Write a note...',
        visibleToClient: '👁 Visible to client',
        privateNote: '🔒 Private',
        clientSees: '👁 Client sees',
        privateLabel: '🔒 Private',
        noNotes: 'No notes yet',

        // ─── Invoices ───────────────────────────────────────
        invoices: 'Invoices',
        newInvoice: '+ New Invoice',
        editInvoice: 'Edit Invoice',
        invoiceNumber: 'Number',
        invoiceAmount: 'Amount',
        invoiceDate: 'Date',
        invoiceDueDate: 'Due Date',
        invoiceStatus: 'Status',
        invoiceStatusPaid: 'Paid',
        invoiceStatusPending: 'Pending',
        invoiceStatusOverdue: 'Overdue',
        totalAmount: 'Total',
        paidAmount: 'Paid',
        pendingAmount: 'Pending',
        noInvoices: 'No invoices yet. Create your first one!',
        amountLabel: 'Amount (₽)',
        dueDateLabel: 'Due date',

        // ─── Files ──────────────────────────────────────────
        files: 'Files',
        uploadFiles: 'Upload Files',
        dragOrClick: 'Drag files here or click',
        noFiles: 'No files yet',

        // ─── Time Tracking ──────────────────────────────────
        timerStart: '▶ Start',
        timerStop: '⏹ Stop',
        whatAreYouDoing: 'What are you working on?',
        addManually: '▸ Add manually',
        hideManual: '▾ Hide manual entry',
        project: 'Project',
        time: 'Time',
        hourlyRate: 'Rate $/hr',
        date: 'Date',
        totalTime: 'Total Time',
        entries: 'Entries',
        amount: 'Amount',
        noTimeEntries: 'No entries yet',
        noTimeHint: 'Start the timer or add time manually',
        createProjectFirst: 'Create a project first',
        timeLinkedToProjects: 'Time is linked to client projects',
        whatDidYouDo: 'What did you do?',

        // ─── Portal ─────────────────────────────────────────
        portal: 'Portal',
        portalLink: 'Portal Link',
        generateLink: 'Generate Link',
        deactivateLink: 'Deactivate',
        copyLink: 'Copy',
        copied: 'Copied!',
        portalDesc: 'This link opens a public portal for your client',
        brandingPro: 'Custom Branding',
        brandingProDesc: 'Logo and colors in client portal',

        // ─── Branding ───────────────────────────────────────
        branding: 'Portal Branding',
        brandingHint: 'Customize the appearance of your client portal',
        companyName: 'Company Name',
        logoUpload: 'Upload Logo',
        logoPlaceholder: 'Your logo here',
        colorScheme: 'Color Scheme',
        gradients: 'Gradients (Pro)',
        proOnly: 'Pro only',

        // ─── Notifications ──────────────────────────────────
        notifications: 'Notifications',
        notifyProjectCreated: 'New project created',
        notifyProjectCreatedDesc: 'Client receives an email when a project is created',
        notifyProjectStatus: 'Project status changed',
        notifyProjectStatusDesc: 'Email on status change (Brief → In Progress, etc.)',
        notifyInvoiceCreated: 'New invoice issued',
        notifyInvoiceCreatedDesc: 'Email with amount and payment deadline',

        // ─── Add/Edit Client Modal ──────────────────────────
        addClientTitle: 'New Client',
        editClientTitle: 'Edit Client',
        clientName: 'Client Name',
        clientNamePlaceholder: 'John Smith',
        company: 'Company',
        companyPlaceholder: 'StartupFlow',
        email: 'Email',
        emailPlaceholder: 'client@company.com',
        avatar: 'Avatar',
        color: 'Color',
        enableNotifications: 'Enable email notifications for this client',
        deleteClient: 'Delete Client',
        deleteClientConfirm: 'Delete this client and all their data?',
        noCompany: 'No company',

        // ─── Upgrade Modal ──────────────────────────────────
        upgradeTo: 'Upgrade to Pro',
        upgradeTitle: 'Unlock Everything',
        unlimitedClients: 'Unlimited Clients',
        unlimitedDesc: 'Add as many clients as you want',
        customBranding: 'Custom Branding',
        customBrandingDesc: 'Logo and colors in client portal',
        prioritySupport: 'Priority Support',
        prioritySupportDesc: 'Response within 24 hours',
        pricePerMonth: '$4 / mo',
        paymentError: 'Payment error',
        paymentTryLater: 'Could not create payment session. Please try later.',

        // ─── Auth ───────────────────────────────────────────
        signIn: 'Sign In',
        signUp: 'Sign Up',
        loginTitle: 'Sign in to your account',
        registerTitle: 'Create a freelancer account',
        enterCredentials: 'Enter your email and password',
        enterName: 'Enter your name',
        fullName: 'Full Name',
        password: 'Password',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        registerSuccess: 'Registration successful! Check your email to confirm.',
        invalidEmail: 'Invalid email',
        shortPassword: 'Password must be at least 6 characters',
        wrongCredentials: 'Wrong email or password',
        emailExists: 'This email is already registered',

        // ─── Settings ───────────────────────────────────────
        settingsTitle: 'Settings',
        profile: 'Profile',
        name: 'Name',
        emailCantChange: 'Email cannot be changed',
        companyBrand: 'Company / Brand Name',
        shownInPortal: 'Shown in client portal',
        billingDetails: 'Billing Details (in development)',
        businessName: 'Business Name',
        businessNamePlaceholder: 'Acme LLC',
        inn: 'Tax ID',
        bank: 'Bank',
        bik: 'SWIFT/BIC',
        bankAccount: 'Account Number',
        corrAccount: 'Correspondent Account',
        billingHint: 'This information will be used in PDF invoices for clients',
        currencyAndRate: 'Currency & Rate (in development)',
        currency: 'Currency',
        defaultRate: 'Default Rate',
        defaultRateHint: 'Applied when tracking time',
        subscription: 'Subscription',
        freePlan: 'Free Plan',
        freePlanDesc: '1 client, basic features',
        proPlan: 'Pro Plan',
        proPlanDesc: 'Unlimited clients, branding, all features',
        goToPro: 'Upgrade to Pro',
        security: 'Security',
        passwordResetInfo: 'We will send a password reset link to your email',
        resetPassword: 'Reset Password',
        passwordResetSent: 'Password reset email sent to ',
        rubles: '₽ — Rubles',
        dollars: '$ — Dollars',
        euros: '€ — Euros',

        // ─── Calendar ───────────────────────────────────────
        calendarTitle: 'Deadline Calendar',
        event: 'event',
        events2to4: 'events',
        events5plus: 'events',
        overdueExcl: 'Overdue!',

        // ─── Public Portal ──────────────────────────────────
        welcome: 'Welcome',
        yourProjects: 'Your Projects',
        yourInvoices: 'Invoices',
        yourFiles: 'Files',
        download: 'Download',
        portalPowered: 'Powered by ClientBase',
    },
};

type Translations = typeof translations.ru;

interface I18nContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: Translations;
}

const I18nContext = createContext<I18nContextType>({
    locale: 'ru',
    setLocale: () => {},
    t: translations.ru,
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(() => {
        const saved = localStorage.getItem('cb_locale') as Locale | null;
        return saved === 'en' ? 'en' : 'ru';
    });

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        localStorage.setItem('cb_locale', l);
    }, []);

    const t: Translations = translations[locale];

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
};
