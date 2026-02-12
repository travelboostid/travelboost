import { update } from '@/actions/App/Http/Controllers/DashboardSettingsPreferencesController';
import { edit } from '@/actions/App/Http/Controllers/PersonalPageController';
import InputError from '@/components/input-error';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type { SharedData } from '@/types';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Preferences({ preference }: { preference: any }) {
  const { auth } = usePage<SharedData>().props;
  const [useChatbot, setUseChatbot] = useState(preference.use_chatbot);
  return (
    <DashboardLayout
      openMenuIds={['settings']}
      activeMenuIds={[`settings.preferences`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Settings' },
        { title: 'Preferences' },
      ]}
    >
      <Head title="Preferences" />
      <div className="p-4">
        <Form
          {...update.form()}
          className="flex flex-col gap-6"
          setDefaultsOnSuccess
        >
          {({ processing, errors }) => (
            <>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
                  <Input
                    id="meta_pixel_id"
                    type="text"
                    name="meta_pixel_id"
                    autoComplete="meta_pixel_id"
                    placeholder="XXXXXXXX"
                    defaultValue={preference.meta_pixel_id}
                  />
                  <InputError message={errors.meta_pixel_id} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="landing_page_template_id">
                    Landing Page Theme
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      name="landing_page_template_id"
                      required
                      autoComplete="landing_page_template_id"
                      defaultValue={preference.landing_page_template_id || ''}
                    >
                      <SelectTrigger className="w-full max-w-48">
                        <SelectValue placeholder="Select Landing Page Theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Landing Page Theme</SelectLabel>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="unique">Unique</SelectItem>
                          <SelectItem value="cool">Cool</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Link href={edit({ username: auth.user.username })}>
                      <Button>Customize</Button>
                    </Link>
                  </div>

                  <InputError message={errors.landing_page_template_id} />
                </div>

                <FieldGroup className="w-full max-w-sm">
                  <FieldLabel htmlFor="switch-share">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Enable Chatbot</FieldTitle>
                        <FieldDescription>
                          Enable chatbot feature to automatically reply your
                          client messages
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        id="switch-share"
                        checked={useChatbot}
                        onCheckedChange={setUseChatbot}
                      />
                      <input
                        type="hidden"
                        name="use_chatbot"
                        value={useChatbot ? '1' : '0'}
                      />
                    </Field>
                  </FieldLabel>
                </FieldGroup>

                <Button
                  type="submit"
                  className="mt-4 w-full"
                  tabIndex={4}
                  disabled={processing}
                >
                  {processing && <Spinner />}
                  Update
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </DashboardLayout>
  );
}
