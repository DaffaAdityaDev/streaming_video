import prisma from "../config/database";
import { Users } from "@prisma/client";

const findByEmail = async (email: string): Promise<Users | null> => {
  return prisma.users.findUnique({ where: { email } });
};

const create = async (userData: Omit<Users, 'id_user' | 'created_at' | 'token'>): Promise<Users> => {
  return prisma.users.create({ data: { ...userData, token: null } });
};

const update = async (email: string, data: Partial<Omit<Users, 'id_user' | 'created_at'>>): Promise<Users> => {
  return prisma.users.update({ where: { email }, data });
};

const updateUsername = async (email: string, newUsername: string): Promise<Users> => {
  return prisma.users.update({
    where: { email },
    data: { username: newUsername }
  });
};

const updateByUsername = async (username: string, data: Partial<Omit<Users, 'id_user' | 'created_at'>>): Promise<Users> => {
  return prisma.users.update({ where: { username }, data });
};

const findByUsername = async (username: string): Promise<Users | null> => {
  return prisma.users.findUnique({ where: { username } });
};


export default { findByEmail, create, update, updateByUsername, updateUsername, findByUsername };