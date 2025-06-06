import prisma from "../config/database";
import { Users } from "@prisma/client";

export type User = Users;

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.users.findUnique({ where: { email } });
};

export const createUser = async (userData: Omit<User, 'id_user' | 'created_at' | 'token'>): Promise<User> => {
    return prisma.users.create({ data: { ...userData, token: null } });
};

export const updateUser = async (email: string, data: Partial<Omit<User, 'id_user' | 'created_at'>>): Promise<User> => {
  return prisma.users.update({ where: { email }, data });
};