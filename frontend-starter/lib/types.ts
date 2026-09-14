export type Role = {
  id: string;
  name: string;
  permissions?: Permission[];
};

export type Permission = {
  id: string;
  entity: string;
  action: string;
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  profilePicture?: string | null;
  accountStatus?: string;
  roles: Role[];
  permissions?: string[];
};

export type ApiSuccess<T> = {
  statusCode: number;
  error: false;
  message: string;
  data?: T;
};

export type ApiError = {
  statusCode: number;
  error: true;
  message: string;
  type?: string;
};
