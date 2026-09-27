import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'fallback-local-secret' : null);
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}
if (process.env.NODE_ENV === 'development' && !process.env.JWT_SECRET) {
    console.warn('WARNING: Using fallback JWT_SECRET for local development.');
}

// Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// In-memory data store
const users = new Map<string, any>();

// Seed a test user
users.set('test@example.com', {
    id: 'user_1',
    email: 'test@example.com',
    password: 'password123', // plain text for mock
    name: 'Test User'
});

console.log('Seeded test user: test@example.com / password123');

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.post('/auth/signup', (req, res) => {
    const { email, pass, name } = req.body;
    if (!email || !pass) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    if (users.has(email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = {
        id: `user_${Date.now()}`,
        email,
        password: pass,
        name: name || 'New User'
    };
    users.set(email, newUser);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token });
});

app.post('/auth/login', (req, res) => {
    const { email, pass } = req.body;
    const user = users.get(email);
    
    if (!user || user.password !== pass) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token });
});

// Dummy auth middleware to extract token
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, email: string };
        const foundUser = users.get(decoded.email);
        
        if (!foundUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        (req as any).user = foundUser;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

app.get('/me', authMiddleware, (req, res) => {
    res.status(200).json({ user: (req as any).user });
});

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

app.listen(PORT as number, HOST, () => {
    console.log(`Server listening on port ${PORT}`);
});
