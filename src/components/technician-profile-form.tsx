'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateOwnProfile, uploadOwnPhoto } from '@/lib/api/technicians';
import { getUploadUrl } from '@/lib/api/client';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoMutation = useMutation({
    mutationFn: uploadOwnPhoto,
    onSuccess: (updatedProfile) => {
      if (user && token) {
        setAuth({ ...user, technicianProfile: updatedProfile }, token);
      }
      toast.success('Photo updated');
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not upload photo'),
  });

  const photoUrl = getUploadUrl(profile?.photoUrl);

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
        <div className="mb-6 flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
            {photoUrl ? (
              // unoptimized: the API is on a different origin, and in local dev that
              // resolves to a loopback IP — Next's image optimizer refuses to fetch
              // those (SSRF protection) regardless of remotePatterns config.
              <Image src={photoUrl} alt="" fill sizes="64px" unoptimized className="object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) photoMutation.mutate(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={photoMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoMutation.isPending ? 'Uploading...' : 'Change photo'}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5MB.</p>
          </div>
        </div>
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
