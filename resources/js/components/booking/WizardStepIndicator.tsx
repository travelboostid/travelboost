import { WIZARD_STEPS, type WizardStepId } from '@/constants/booking';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  BedDoubleIcon,
  CheckIcon,
  FileTextIcon,
  ReceiptIcon,
  UserIcon,
} from 'lucide-react';

const iconMap = {
  User: UserIcon,
  BedDouble: BedDoubleIcon,
  FileText: FileTextIcon,
  Receipt: ReceiptIcon,
};

export default function WizardStepIndicator({
  currentStep,
}: {
  currentStep: WizardStepId;
}) {
  return (
    <nav aria-label="Booking progress">
      {/* Mobile */}
      <p className="text-center text-sm font-semibold text-foreground sm:hidden">
        Step {currentStep} of {WIZARD_STEPS.length} -{' '}
        {WIZARD_STEPS.find((s) => s.id === currentStep)?.label}
      </p>

      {/* Desktop */}
      <ol className="hidden w-full max-w-lg items-center justify-between sm:flex mx-auto">
        {WIZARD_STEPS.map((step, idx) => {
          const Icon = iconMap[step.icon];
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <li
              key={step.id}
              className="flex flex-1 items-center"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted
                      ? 'border-primary bg-primary text-white'
                      : isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30 bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </div>
                <span
                  className={cn(
                    'hidden text-xs font-semibold lg:block',
                    currentStep >= step.id
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {idx < WIZARD_STEPS.length - 1 && (
                <div className="relative mx-3 h-0.5 flex-1 bg-border overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary"
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
