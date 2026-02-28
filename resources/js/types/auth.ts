export type User = {
  id: number;
  name: string;
  email: string;
  username: string;
  email_verified_at: string | null;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
  photo_url: string;
  companies: {
    id: number;
    name: string;
    username: string;
    photo_url: string | null;
    [key: string]: any;
  }[];
  [key: string]: unknown;
};

export type Auth = {
  user: User;
};

export type TwoFactorSetupData = {
  svg: string;
  url: string;
};

export type TwoFactorSecretKey = {
  secretKey: string;
};
