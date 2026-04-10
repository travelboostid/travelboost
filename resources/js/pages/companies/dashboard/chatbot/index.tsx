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
import SelectAiModel from './components/select-ai-model';

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

              {/* AI Model Selection */}
              <FieldSet className="w-full">
                <FieldLegend variant="label">AI Model</FieldLegend>
                <FieldDescription>
                  Select the AI model that powers your chatbot. Different models
                  may have different capabilities, response styles, and
                  performance characteristics. Choose the one that best fits
                  your business needs and customer interaction style.
                </FieldDescription>
                <SelectAiModel
                  defaultValue={settings.chatbot_model_id}
                  name="chatbot_model_id"
                />
                <InputError message={errors.chatbot_model_id} />
              </FieldSet>

              {/* Tone */}
              <FieldSet className="w-full">
                <FieldLegend variant="label">Tone</FieldLegend>
                <FieldDescription>
                  Choose the tone of the chatbot responses. This setting allows
                  you to customize the personality of the chatbot to better
                  align with your brand and customer interactions.
                </FieldDescription>
                <RadioGroup
                  defaultValue={settings.chatbot_tone}
                  name="chatbot_tone"
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
                  <Field orientation="horizontal">
                    <RadioGroupItem id="enthusiastic" value="enthusiastic" />
                    <FieldLabel htmlFor="enthusiastic" className="font-normal">
                      Enthusiastic
                    </FieldLabel>
                  </Field>
                </RadioGroup>
                <InputError message={errors.tone} />
              </FieldSet>

              {/* Emoji Usage */}
              <FieldSet className="w-full">
                <FieldLegend variant="label">Emoji Usage</FieldLegend>
                <FieldDescription>
                  Control how frequently emojis are used in chatbot responses.
                  This helps set the visual tone and friendliness level of the
                  chatbot interactions.
                </FieldDescription>
                <RadioGroup
                  defaultValue={settings.chatbot_emoji_usage}
                  name="chatbot_emoji_usage"
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem id="emoji-none" value="none" />
                    <FieldLabel htmlFor="emoji-none" className="font-normal">
                      None
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="emoji-minimal" value="minimal" />
                    <FieldLabel htmlFor="emoji-minimal" className="font-normal">
                      Minimal
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="emoji-moderate" value="moderate" />
                    <FieldLabel
                      htmlFor="emoji-moderate"
                      className="font-normal"
                    >
                      Moderate
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="emoji-expressive" value="expressive" />
                    <FieldLabel
                      htmlFor="emoji-expressive"
                      className="font-normal"
                    >
                      Expressive
                    </FieldLabel>
                  </Field>
                </RadioGroup>
                <InputError message={errors.chatbot_emoji_usage} />
              </FieldSet>

              {/* Personality */}
              <FieldSet className="w-full">
                <FieldLegend variant="label">Personality</FieldLegend>
                <FieldDescription>
                  Select the personality type for your chatbot. Different
                  personalities are optimized for different use cases and
                  customer interaction styles.
                </FieldDescription>
                <RadioGroup
                  defaultValue={settings.chatbot_personality}
                  name="chatbot_personality"
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem
                      id="personality-assistant"
                      value="assistant"
                    />
                    <FieldLabel
                      htmlFor="personality-assistant"
                      className="font-normal"
                    >
                      Assistant
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="personality-sales" value="sales" />
                    <FieldLabel
                      htmlFor="personality-sales"
                      className="font-normal"
                    >
                      Sales
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem id="personality-support" value="support" />
                    <FieldLabel
                      htmlFor="personality-support"
                      className="font-normal"
                    >
                      Support
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem
                      id="personality-travel-consultant"
                      value="travel_consultant"
                    />
                    <FieldLabel
                      htmlFor="personality-travel-consultant"
                      className="font-normal"
                    >
                      Travel Consultant
                    </FieldLabel>
                  </Field>
                </RadioGroup>
                <InputError message={errors.chatbot_personality} />
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
                      Auto Detect
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
