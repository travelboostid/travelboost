import { CircleAlertIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from '@inertiajs/react';

export default function AiCreditsInfo() {
  return (
    <Alert className="border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400">
      <CircleAlertIcon />
      <AlertTitle>This AI credit is required for chatbot</AlertTitle>
      <AlertDescription className="text-sky-600/80 dark:text-sky-400/80">
        <span>
          Credit usage of the feature depends on the selected model and your
          settings. Click{' '}
          <Link href="/pricing" className="underline inline" target="_blank">
            here
          </Link>{' '}
          for more details about the pricing of the models.
        </span>
      </AlertDescription>
    </Alert>
  );
}
