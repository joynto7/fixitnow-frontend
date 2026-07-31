'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { loginFormSchema, type LoginFormValues } from '@/lib/validations/auth';
import { loginUser } from '@/lib/api/auth';
import { setAuthCookie } from '@/lib/auth/cookie';
import { useAuthStore } from '@/lib/auth/store';
import { ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { AuthShell } from '@/components/auth-shell';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: ({ user, token }) => {
      setAuthCookie(token);
      setAuth(user, token);
      toast.success('Welcome back');
      router.push(`/dashboard/${ROLE_DASHBOARD_PATH[user.role]}`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof LoginFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Login failed');
    },
  });

  return (
    <AuthShell>
      <h1 className="font-heading text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Log in to manage your bookings.</p>
      <form className="mt-6" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" aria-invalid={!!errors.password} {...register('password')} />
            <FieldError errors={errors.password ? [errors.password] : undefined} />
          </Field>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
