import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { DEFAULT_PHOTO } from '@/config';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff, UserIcon } from 'lucide-react';
import { useState } from 'react';

type AcceptTeamInvitationPageProps = {
  team: any;
};

export default function AcceptTeamInvitationPage({
  team,
}: AcceptTeamInvitationPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <AuthLayout
      title="Accept Team Invitation"
      description="Enter your details below to accept your team invitation."
    >
      <Head title="Accept Invitation" />
      <Form
        {...store.form()}
        resetOnSuccess={['password', 'password_confirmation']}
        disableWhileProcessing
        className="flex flex-col gap-6"
      >
        {({ processing, errors }) => (
          <>
            <Alert className="flex items-center gap-4">
              <Avatar className="h-12 w-12 rounded-lg">
                <AvatarImage
                  src={team.company.photo_url || DEFAULT_PHOTO}
                  alt={team.company.name}
                />
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex-col justify-center gap-2">
                <AlertTitle className="flex-1">
                  <strong>{team.company.name}</strong> is inviting you to join.
                </AlertTitle>
                <AlertDescription className="text-xs">
                  If you are not intended to join, you can safely ignore this
                  invitation.
                </AlertDescription>
              </div>
            </Alert>
            <input type="hidden" name="intent" value="register-as-team" />
            <input
              type="hidden"
              name="invite_token"
              value={team.invite_token}
            />
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="name"
                  name="name"
                  placeholder="Full name"
                />
                <InputError message={errors.name} className="mt-2" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  tabIndex={2}
                  autoComplete="email"
                  name="email"
                  placeholder="email@example.com"
                  value={team.invite_email}
                  readOnly
                />
                <InputError message={errors.email} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  tabIndex={1}
                  autoComplete="username"
                  name="username"
                  placeholder="Username"
                />
                <InputError message={errors.username} className="mt-2" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    tabIndex={3}
                    autoComplete="new-password"
                    name="password"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <InputError message={errors.password} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    tabIndex={4}
                    autoComplete="new-password"
                    name="password_confirmation"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                <InputError message={errors.password_confirmation} />
              </div>

              <Button
                type="submit"
                className="mt-2 w-full"
                tabIndex={5}
                data-test="register-user-button"
                disabled={processing}
              >
                {processing && <Spinner />}
                Accept Invitation
              </Button>
            </div>
          </>
        )}
      </Form>
    </AuthLayout>
  );
}
