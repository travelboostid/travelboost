export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type SharedData = {
  name: string;
  auth: Auth;
  sidebarOpen: boolean;
  company: {
    id: number;
    name: string;
    username: string;
    photo_url: string | null;
    [key: string]: any;
  };
  [key: string]: any;
};
