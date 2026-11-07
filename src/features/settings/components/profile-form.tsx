'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { TextField } from '@/components/forms/text-field';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/features/auth/api';
import { profileSchema, type ProfileValues } from '@/features/auth/schemas';
import { useUpdateProfile } from '@/features/auth/use-auth';
import {
  formatTimeZone,
  getDeviceTimeZone,
  getTimeZones,
} from '@/lib/time-zones';

const BIO_MAX = 500;

function toFormValues(user: User): ProfileValues {
  return {
    displayName: user.displayName,
    bio: user.bio ?? '',
    timezone: user.timezone,
  };
}

export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const timeZones = useMemo(() => getTimeZones(user.timezone), [user.timezone]);
  const deviceTimeZone = useMemo(() => getDeviceTimeZone(), []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(user),
  });

  // useWatch re-renders this form when these fields change (for the counter and the hint).
  const bioLength = useWatch({ control, name: 'bio' })?.length ?? 0;
  const selectedTimeZone = useWatch({ control, name: 'timezone' });

  const onSubmit = handleSubmit((values) => {
    update.mutate(
      { ...values, bio: values.bio || null },
      {
        onSuccess: (saved) => {
          // The saved values become the new "unchanged" state of the form.
          reset(toFormValues(saved));
          toast.success('Profile saved');
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormErrorAlert error={update.error} />

        <TextField
          id="displayName"
          label="Name"
          autoComplete="name"
          error={errors.displayName}
          {...register('displayName')}
        />

        <TextField
          id="email"
          label="Email"
          value={user.email}
          readOnly
          disabled
          description="Your login email can't be changed yet."
        />

        <Field data-invalid={!!errors.bio}>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            rows={3}
            placeholder="A sentence about you or what you're working on (optional)"
            aria-invalid={!!errors.bio}
            aria-describedby="bio-count"
            {...register('bio')}
          />
          <FieldDescription id="bio-count" className="text-right tabular-nums">
            {bioLength}/{BIO_MAX}
          </FieldDescription>
          <FieldError errors={[errors.bio]} />
        </Field>

        <Field data-invalid={!!errors.timezone}>
          <FieldLabel htmlFor="timezone">Time zone</FieldLabel>
          <NativeSelect
            id="timezone"
            className="w-full"
            aria-invalid={!!errors.timezone}
            {...register('timezone')}
          >
            {timeZones.map((zone) => (
              <NativeSelectOption key={zone} value={zone}>
                {formatTimeZone(zone)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            Used for due dates and deciding when tasks are overdue.
            {deviceTimeZone && deviceTimeZone !== selectedTimeZone && (
              <>
                {' '}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() =>
                    setValue('timezone', deviceTimeZone, { shouldDirty: true })
                  }
                >
                  Use this device&apos;s time zone (
                  {formatTimeZone(deviceTimeZone)})
                </button>
              </>
            )}
          </FieldDescription>
          <FieldError errors={[errors.timezone]} />
        </Field>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={!isDirty || update.isPending}
            onClick={() => reset(toFormValues(user))}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending && <Spinner aria-hidden="true" />}
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
