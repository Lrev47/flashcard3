import prisma from '../../../config/prismaClient.js';
import bcrypt from 'bcrypt';

export default {
  createUser,
  findByEmail,
  findById,
  updateUser,
};

async function createUser({ email, name, password }) {
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('User with this email already exists.');
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });
}

async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

async function updateUser(id, updates) {
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: updates,
  });
}
