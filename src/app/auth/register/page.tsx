'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { registerFormSchema, type RegisterFormValues } from '@/lib/validations/auth';
import { registerUser } from '@/lib/api/auth';
import { setAuthCookie } from '@/lib/auth/cookie';
import { useAuthStore } from '@/lib/auth/store';
import { ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthShell } from '@/components/auth-shell';

const ROLE_LABELS: Record<RegisterFormValues['role'], string> = {
  CUSTOMER: 'Customer',
  TECHNICIAN: 'Technician',
};

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', role: 'CUSTOMER' },
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: ({ user, token }) => {
      setAuthCookie(token);
      setAuth(user, token);
      toast.success('Account created');
      router.push(`/dashboard/${ROLE_DASHBOARD_PATH[user.role]}`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof RegisterFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    mutation.mutate({ ...values, phone: values.phone || undefined });
  };

  return (
    <AuthShell>
      <h1 className="font-heading text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Book services or start taking jobs.</p>
      <form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
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
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
                <Input id="phone" aria-invalid={!!errors.phone} {...register('phone')} />
                <FieldError errors={errors.phone ? [errors.phone] : undefined} />
              </Field>
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="role">I am a</FieldLabel>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select items={ROLE_LABELS} onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="role" aria-invalid={!!errors.role}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                        <SelectItem value="TECHNICIAN">Technician</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={errors.role ? [errors.role] : undefined} />
              </Field>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating account...' : 'Create account'}
              </Button>
        </FieldGroup>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
