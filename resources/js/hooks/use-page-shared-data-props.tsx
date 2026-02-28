import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function usePageSharedDataProps() {
  return usePage<SharedData>().props;
}
