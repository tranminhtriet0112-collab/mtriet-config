const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const USER = 'mtriet';
const PASS = 'mtriet123';

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function checkAuth(req, res, next) {
    if (req.cookies && req.cookies.loggedIn === 'true') return next();
    res.redirect('/');
}

// Trang đăng nhập
app.get('/', (req, res) => {
    if (req.cookies && req.cookies.loggedIn === 'true') return res.redirect('/dashboard');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (username === USER && password === PASS) {
        res.cookie('loggedIn', 'true', { maxAge: 3600000, httpOnly: true, path: '/' });
        res.status(200).send('OK');
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Dashboard
app.get('/dashboard', checkAuth, (req, res) => {
    res.render('dashboard', { user: USER, version: 'v5.0' });
});

// XR Panel
app.get('/xr-panel', checkAuth, (req, res) => {
    res.render('xrpanel', { panelStatus: 'ACTIVE', proxyCount: 47, lastUpdate: new Date().toLocaleString() });
});

// Logout
app.get('/logout', (req, res) => {
    res.clearCookie('loggedIn');
    res.redirect('/');
});

// Config.json
app.get('/config.json', checkAuth, (req, res) => {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) return res.sendFile(configPath);
    res.status(404).json({ error: 'config.json not found' });
});

app.listen(PORT, () => console.log(`🔥 Server chạy tại http://localhost:${PORT}`));
