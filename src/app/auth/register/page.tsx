'use client';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="mx-auto max-w-sm py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" {...register('name')} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" {...register('email')} />
                <FieldError errors={errors.email ? [errors.email] : undefined} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" {...register('password')} />
                <FieldError errors={errors.password ? [errors.password] : undefined} />
              </Field>
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
                <Input id="phone" {...register('phone')} />
                <FieldError errors={errors.phone ? [errors.phone] : undefined} />
              </Field>
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="role">I am a</FieldLabel>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="role">
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
        </CardContent>
      </Card>
    </div>
  );
}
