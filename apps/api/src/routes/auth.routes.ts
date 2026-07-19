import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { LoginSchema } from 'shared';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

router.post('/login', async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
       res.status(400).json({ error: parsed.error.format() });
       return;
    }

    const { email, password } = parsed.data;

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee) {
       res.status(401).json({ error: 'Invalid credentials' });
       return;
    }

    if (employee.status !== 'ACTIVE') {
       res.status(403).json({ error: 'Account is inactive' });
       return;
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
       res.status(401).json({ error: 'Invalid credentials' });
       return;
    }

    const token = jwt.sign(
      { id: employee.id, role: employee.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Refresh token in httpOnly cookie
    const refreshToken = jwt.sign(
      { id: employee.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

export default router;
