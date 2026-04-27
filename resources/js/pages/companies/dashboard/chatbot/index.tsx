import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/company/chatbot';
import { Form, Head } from '@inertiajs/react';
import { toast } from 'sonner';

export default function Page({ settings }: { settings: any }) {
  const { company } = usePageSharedDataProps();

  console.log('Chatbot Settings:', settings);
  const handleSuccess = () => {
    toast.success('Success', {
      position: 'top-center',
      description: 'Chatbot settings updated successfully',
    });
  };

  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'Chatbot Settings' }]}
      openMenuIds={['settings']}
      activeMenuIds={['settings.chatbot']}
    >
      <Head title="Chatbot Settings" />
      <Form
        {...update.form({ company: company.username })}
        transform={(src) => ({
          ...src,
          chatbot_enabled: src.chatbot_enabled == 'on' ? true : false,
        })}
        className="space-y-4"
        onSuccess={handleSuccess}
      >
        {({ errors, processing }) => (
          <div className="container mx-auto space-y-4 p-4">
            {/* <div className="grid gap-6"> changed for show in 2 column */}
            <div className="grid grid-cols-1 gap-6">
              {/* Chatbot Enabled */}
              <div className="grid gap-2">
                <FieldGroup>
                  <FieldLabel htmlFor="chatbot_enabled">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Enable Chatbot</FieldTitle>
                        <FieldDescription>
                          Toggle to enable or disable the chatbot for your
                          company. When enabled, the chatbot will be active and
                          available to assist your customers with their
                          inquiries and support needs.
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        id="chatbot_enabled"
                        name="chatbot_enabled"
                        defaultChecked={settings.chatbot_enabled}
                      />
                    </Field>
                  </FieldLabel>
                </FieldGroup>
                <InputError message={errors.chatbot_enabled} />
              </div>

              {/* Tone */}
              <FieldSet className="w-full">
                <FieldLegend variant="label">Response Style</FieldLegend>
                <FieldDescription>
                  Choose how the chatbot should respond to customer inquiries.
                  The tone you select will influence the chatbot's language
                  style, formality, and overall personality in its interactions
                  with customers.
                </FieldDescription>
                <RadioGroup
                  defaultValue={settings.chatbot_response_style}
                  name="chatbot_response_style"
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem id="professional" value="professional" />
                    <FieldLabel htmlFor="professional" className="font-normal">
                      Professional
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="friendly" value="friendly" />
                    <FieldLabel htmlFor="friendly" className="font-normal">
                      Friendly
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="casual" value="casual" />
                    <FieldLabel htmlFor="casual" className="font-normal">
                      Casual
                    </FieldLabel>
                  </Field>
                </RadioGroup>
                <InputError message={errors.tone} />
              </FieldSet>

              {/* Default Language */}
              <FieldSet className="w-full">
                <FieldLegend variant="label">Default Language</FieldLegend>
                <FieldDescription>
                  Set the default language for chatbot responses. Select "Auto"
                  to automatically detect the user's language.
                </FieldDescription>
                <RadioGroup
                  defaultValue={settings.chatbot_default_language}
                  name="chatbot_default_language"
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem id="lang-auto" value="auto" />
                    <FieldLabel htmlFor="lang-auto" className="font-normal">
                      Auto (Detect language from user input)
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="lang-id" value="id" />
                    <FieldLabel htmlFor="lang-id" className="font-normal">
                      Indonesian
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="lang-en" value="en" />
                    <FieldLabel htmlFor="lang-en" className="font-normal">
                      English
                    </FieldLabel>
                  </Field>
                </RadioGroup>
                <InputError message={errors.chatbot_default_language} />
              </FieldSet>
            </div>
            <Button type="submit" disabled={processing}>
              {processing && <Spinner />}Update
            </Button>
          </div>
        )}
      </Form>
    </CompanyDashboardLayout>
  );
}
