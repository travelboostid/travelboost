import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function usePageProps<T extends Record<string, unknown>>() {
  return usePage<T & SharedData>().props;
}
