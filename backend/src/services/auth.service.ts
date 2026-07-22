import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { JwtPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'ADMIN' | 'AGENT' | 'CUSTOMER';
}

interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData, createdById?: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const role = data.role || 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role,
        customer: role === 'CUSTOMER' ? {
          create: {
            createdById: createdById || null,
          },
        } : undefined,
      },
      include: {
        customer: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        description: `User registered with role: ${role}`,
      },
    });

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  },

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { customer: true },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        description: 'User logged in',
      },
    });

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { customer: true },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  },

  generateTokens(user: any) {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
      omit: { password: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  async updateProfile(userId: string, data: Partial<RegisterData>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      omit: { password: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        description: 'Profile updated',
      },
    });

    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  },
};
