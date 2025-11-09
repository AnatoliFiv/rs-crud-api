export interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

export type UserPayload = Omit<User, 'id'>;
export type UserUpdatePayload = Partial<UserPayload>;
