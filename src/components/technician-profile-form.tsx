'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateOwnProfile } from '@/lib/api/technicians';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { technicianProfileFormSchema, type TechnicianProfileFormValues } from '@/lib/validations/technician';
import { useAuthStore } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function TechnicianProfileForm() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const profile = user?.technicianProfile;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TechnicianProfileFormValues>({
    resolver: zodResolver(technicianProfileFormSchema),
    defaultValues: {
      bio: profile?.bio ?? '',
      experienceYears: profile?.experienceYears?.toString() ?? '',
      location: profile?.location ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: TechnicianProfileFormValues) =>
      updateOwnProfile({
        bio: values.bio || undefined,
        experienceYears: values.experienceYears ? Number(values.experienceYears) : undefined,
        location: values.location || undefined,
      }),
    onSuccess: (updatedProfile) => {
      if (user && token) {
        setAuth({ ...user, technicianProfile: updatedProfile }, token);
      }
      toast.success('Profile updated');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof TechnicianProfileFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Could not update profile');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <FieldGroup>
            <Field data-invalid={!!errors.bio}>
              <FieldLabel htmlFor="bio">Bio</FieldLabel>
              <Textarea id="bio" aria-invalid={!!errors.bio} {...register('bio')} />
              <FieldError errors={errors.bio ? [errors.bio] : undefined} />
            </Field>
            <Field data-invalid={!!errors.experienceYears}>
              <FieldLabel htmlFor="experienceYears">Years of experience</FieldLabel>
              <Input
                id="experienceYears"
                inputMode="numeric"
                aria-invalid={!!errors.experienceYears}
                {...register('experienceYears')}
              />
              <FieldError errors={errors.experienceYears ? [errors.experienceYears] : undefined} />
            </Field>
            <Field data-invalid={!!errors.location}>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input id="location" aria-invalid={!!errors.location} {...register('location')} />
              <FieldError errors={errors.location ? [errors.location] : undefined} />
            </Field>
            <Button type="submit" disabled={mutation.isPending} className="self-start">
              {mutation.isPending ? 'Saving...' : 'Save profile'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
