import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { authApi, getUserErrorMessage, type AuthenticatedUser } from '../services/api';

interface AuthPageProps {
  initialMode: 'login' | 'register';
  onAuthenticated: (user: AuthenticatedUser) => Promise<void>;
  onBack: () => void;
}

export function AuthPage({ initialMode, onAuthenticated, onBack }: AuthPageProps) {
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Введіть електронну адресу.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(normalizedEmail)) {
      setError('Вкажіть коректну електронну адресу.');
      return;
    }
    if (normalizedEmail.length > 256) {
      setError('Електронна адреса не може перевищувати 256 символів.');
      return;
    }
    if (!password) {
      setError('Введіть пароль.');
      return;
    }
    if (password.length < 8) {
      setError('Пароль має містити щонайменше 8 символів.');
      return;
    }
    if (password.length > 128) {
      setError('Пароль не може перевищувати 128 символів.');
      return;
    }

    setSubmitting(true);

    try {
      const user = isRegistering
        ? await authApi.register(normalizedEmail, password)
        : await authApi.login(normalizedEmail, password);
      await onAuthenticated(user);
    } catch (cause) {
      setError(getUserErrorMessage(
        cause,
        isRegistering
          ? 'Не вдалося створити обліковий запис. Перевірте з’єднання та спробуйте ще раз.'
          : 'Не вдалося увійти. Перевірте з’єднання та спробуйте ще раз.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <button type="button" className="text-sm text-muted-foreground underline underline-offset-4" onClick={onBack}>
            На головну
          </button>
          <p className="text-xl font-extrabold tracking-widest text-foreground">TIMO</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {isRegistering ? 'Створити обліковий запис' : 'Вхід до TIMO'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegistering ? 'Зареєструйтеся, щоб керувати проєктами.' : 'Увійдіть, щоб продовжити.'}
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-email">Електронна пошта</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              maxLength={256}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-password">Пароль</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Зачекайте…' : isRegistering ? 'Зареєструватися' : 'Увійти'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isRegistering ? 'Вже маєте обліковий запис?' : 'Ще не маєте облікового запису?'}{' '}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
            onClick={() => { setIsRegistering((value) => !value); setError(''); }}
          >
            {isRegistering ? 'Увійти' : 'Зареєструватися'}
          </button>
        </p>
      </Card>
    </main>
  );
}
