import express, { Request, Response, NextFunction } from 'express';

const app = express();
app.use(express.json());

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
    
    res.status(201).json({ token: `mock_jwt_token_${newUser.id}` });
});

app.post('/auth/login', (req, res) => {
    const { email, pass } = req.body;
    const user = users.get(email);
    
    if (!user || user.password !== pass) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.status(200).json({ token: `mock_jwt_token_${user.id}` });
});

// Dummy auth middleware to extract token
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer mock_jwt_token_')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = authHeader.replace('Bearer mock_jwt_token_', '');
    
    let foundUser = null;
    for (const [email, u] of users.entries()) {
        if (u.id === userId) {
            foundUser = u;
            break;
        }
    }
    
    if (!foundUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    (req as any).user = foundUser;
    next();
};

app.get('/me', authMiddleware, (req, res) => {
    res.status(200).json({ user: (req as any).user });
});

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

const PORT = 4000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Minimal Orbit backend listening on http://${HOST}:${PORT}`);
});
