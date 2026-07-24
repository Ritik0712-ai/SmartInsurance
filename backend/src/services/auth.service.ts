import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne, insert, update } from '../config/database.js';
import { JwtPayload } from '../types/index.js';
import { emailService } from './email.service.js';

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

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  customer?: any;
}

export const authService = {
  async register(data: RegisterData, createdById?: string) {
    const existing = await queryOne<User>('User', { eq: { email: data.email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const role = data.role || 'CUSTOMER';

    const user = await insert('User', {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      role,
      isActive: true,
    });

    if (role === 'CUSTOMER') {
      await insert('Customer', {
        userId: user.id,
        createdById: createdById || null,
        country: 'India',
      });
    }

    await insert('AuditLog', {
      userId: user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      description: `User registered with role: ${role}`,
    });

    const fullUser = await queryOne<User>('User', { eq: { id: user.id } });
    if (!fullUser) {
      throw new Error('Failed to create user');
    }
    const tokens = this.generateTokens(fullUser);

    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail(fullUser.email, fullUser.firstName, fullUser.role).catch(console.error);

    return { user: fullUser, ...tokens };
  },

  async login(data: LoginData) {
    const user = await queryOne<User>('User', { eq: { email: data.email } });

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

    await update('User', user.id, { lastLoginAt: new Date().toISOString() });

    await insert('AuditLog', {
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: 'User logged in',
    });

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
      const user = await queryOne<User>('User', { eq: { id: decoded.userId } });

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
    const user = await queryOne<User>('User', { eq: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateProfile(userId: string, data: Partial<RegisterData>) {
    const user = await update('User', userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    await insert('AuditLog', {
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      description: 'Profile updated',
    });

    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await queryOne<User>('User', { eq: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await update('User', userId, { password: hashedPassword });

    // Send password change notification email
    emailService.sendPasswordChangedEmail(user.email, user.firstName).catch(console.error);

    return { message: 'Password changed successfully' };
  },
};
