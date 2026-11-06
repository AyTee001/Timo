import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ApiError, authApi, type AuthenticatedUser } from '../services/api';

interface AuthPageProps {
  onAuthenticated: (user: AuthenticatedUser) => Promise<void>;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = isRegistering
        ? await authApi.register(email, password)
        : await authApi.login(email, password);
      await onAuthenticated(user);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Не вдалося підключитися до сервера.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <p className="text-xl font-extrabold tracking-widest text-foreground">TIMO</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {isRegistering ? 'Створити обліковий запис' : 'Вхід до TIMO'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegistering ? 'Зареєструйтеся, щоб керувати проєктами.' : 'Увійдіть, щоб продовжити.'}
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={submit}>
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
