import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import usePageProps from '@/hooks/use-page-props';
import { update } from '@/routes/companies/dashboard/chatbot';
import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ChatbotPageProps } from '..';

export default function ChatbotSettings() {
  const { settings, company } = usePageProps<ChatbotPageProps>();
  const [updating, setUpdating] = useState(false);

  const handleChange = (checked: boolean) => {
    router.put(
      update.url({ company: company.username }),
      {
        chatbot_enabled: checked,
      },
      {
        preserveScroll: true,
        onBefore: () => setUpdating(true),
        onFinish: () => setUpdating(false),
        onSuccess: () => {
          toast.success(
            `Chatbot ${checked ? 'enabled' : 'disabled'} successfully`,
          );
        },
        onError: () => {
          toast.error('Failed to update chatbot settings');
        },
      },
    );
  };

  return (
    <Form>
      <div className="grid gap-2">
        <FieldGroup>
          <FieldLabel htmlFor="chatbot_enabled">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Enable Chatbot</FieldTitle>
                <FieldDescription>
                  Toggle to enable or disable the chatbot for your company. When
                  enabled, the chatbot will be active and available to assist
                  your customers with their inquiries and support needs.
                </FieldDescription>
              </FieldContent>
              <Switch
                disabled={updating}
                defaultChecked={settings.chatbot_enabled}
                onCheckedChange={handleChange}
              />
            </Field>
          </FieldLabel>
        </FieldGroup>
      </div>
    </Form>
  );
}
