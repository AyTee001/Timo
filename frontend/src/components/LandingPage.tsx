import { BarChart3, Building2, UsersRound } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

function WorkIllustration() {
  return (
    <svg
      className="landing-illustration"
      viewBox="0 0 520 360"
      role="img"
      aria-label="Облік робочого часу в TIMO"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="395" cy="320" rx="60" ry="17" fill="#e1e4e3" />
      <ellipse cx="165" cy="315" rx="105" ry="16" fill="#e4e7e6" />
      <path d="M75 100 305 10v187L75 286z" fill="#34454c" />
      <path d="m88 102 204-80v153L88 254z" fill="#f7faf7" />
      <path d="m75 100 230-90v12L75 112z" fill="#67b65e" />
      <circle cx="291" cy="18" r="2.5" fill="#fff" />
      <path d="M180 285h69l26 22c4 4 1 11-5 11h-74l-30-14z" fill="#35464d" />
      <path d="m101 129 36-14v19l-36 14zm0 30 36-14v19l-36 14zm0 30 36-14v19l-36 14z" fill="#5caf4f" />
      <path d="m108 139 5-2v8l-5 2zm9-4 5-2v8l-5 2zm-9 34 5-2v8l-5 2zm9-4 5-2v8l-5 2zm-9 34 5-2v8l-5 2zm9-4 5-2v8l-5 2z" fill="#fff" />
      <path d="m150 106 48-19v9l-48 19zm0 17 35-14v7l-35 14zm0 15 42-16v7l-42 17zm0 15 31-12v7l-31 13zm0 17 45-18v7l-45 18zm0 15 36-14v7l-36 14z" fill="#c8ddc4" />
      <path d="m209 82 66-26v94l-66 26z" fill="#3c5056" />
      <path d="m218 89 48-19v5l-48 19zm0 12 38-15v5l-38 15zm0 12 43-17v5l-43 17zm0 12 31-12v5l-31 12zm0 12 39-15v5l-39 15zm0 12 28-11v5l-28 11z" fill="#92d187" />
      <path d="m156 201 29-11v28l-29 12z" fill="#62b455" />
      <path d="m164 208 5-2v13l-5 2zm10-4 5-2v13l-5 2z" fill="#fff" />
      <path d="m330 139 12 12 21-31" fill="none" stroke="#e4f2e1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9" />
      <path d="m369 161 17 7 11 62-27 4z" fill="#6dbd60" />
      <path d="M386 169c-3-15 6-29 20-30 14-1 25 10 23 25l-4 26-35 1z" fill="#36474d" />
      <path d="M401 155c2-13 11-21 22-18 10 3 14 14 11 24l-4 14-26-4z" fill="#eaf1ed" />
      <path d="m393 193 33-4 11 89-28 5-17-62-4 62-28-1 6-83z" fill="#3f5055" />
      <path d="m373 279 17 3-4 25-28 4c-6 1-8-6-3-9l16-10zm42 4 17-2 8 24c2 6-4 10-9 6l-16-12z" fill="#34454c" />
      <path d="m376 174-27-12-8-17c-2-5 4-8 7-4l8 9 21 3zm35 7-36-16-8 12 27 22 17-5z" fill="#e5eeea" />
      <path d="m398 152 6-5 7 2-1 7-7 2z" fill="#35464d" />
      <circle cx="411" cy="150" r="1.5" fill="#35464d" />
      <path d="m456 89 19-9 7 13-19 9z" fill="#34454c" />
      <path d="m463 91 8-4m-5 9 8-4" stroke="#fff" strokeLinecap="round" strokeWidth="2" />
      <path d="M162 305c10-15 35-15 45 0" fill="none" stroke="#d7ddda" strokeLinecap="round" strokeWidth="8" />
    </svg>
  );
}

const features = [
  {
    icon: UsersRound,
    title: 'Додавайте проєкти',
    description: 'Зручно групуйте відпрацьовані години за клієнтами та окремими завданнями.',
  },
  {
    icon: Building2,
    title: 'Записуйте час за < 30 секунд',
    description: 'Проста форма без зайвих полів. Дата підставляється автоматично, щоб ви не відволікалися від роботи.',
  },
  {
    icon: BarChart3,
    title: 'Аналітика та експорт',
    description: 'Слідкуйте за розподілом навантаження на дашборді та вивантажуйте зведені звіти в CSV в один клік.',
  },
];

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <a className="landing-wordmark" href="/" aria-label="TIMO — на головну">TIMO</a>
        <nav className="landing-actions" aria-label="Обліковий запис">
          <button type="button" className="landing-action landing-action-primary" onClick={onRegister}>
            Реєстрація
          </button>
          <button type="button" className="landing-action" onClick={onLogin}>
            Вхід
          </button>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-content">
          <p className="landing-brand">TIMO</p>
          <h1 id="landing-title">Надійний асистент<br />для вашої роботи</h1>
        </div>
        <WorkIllustration />
      </section>

      <section className="landing-features" aria-labelledby="features-title">
        <h2 id="features-title">Все необхідне для простого обліку часу</h2>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="landing-feature-card" key={title}>
              <span className="landing-feature-icon"><Icon aria-hidden="true" size={23} strokeWidth={1.6} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
