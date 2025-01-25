import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userService from '../services/userService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'some_long_secret';

export async function registerUserHandler(req, res) {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const newUser = await userService.createUser({ email, name, password });

    return res.status(201).json({
      message: 'User registered successfully.',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[registerUserHandler] Error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error.', error });
  }
}

export async function loginUserHandler(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '2h',
    });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[loginUserHandler] Error:', error);
    return res.status(500).json({ message: 'Internal server error.', error });
  }
}

export async function getUserProfileHandler(req, res) {
  try {
    const { userId } = req.params;

    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('[getUserProfileHandler] Error:', error);
    return res.status(500).json({ message: 'Internal server error.', error });
  }
}
