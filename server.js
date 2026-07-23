const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const USER = 'mtriet';
const PASS = 'mtriet123';
const VIP_KEY = 'mihtriet1221';

let userModules = {};

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== ROUTE CÔNG KHAI CHO GAME LẤY CONFIG (KHÔNG CẦN LOGIN) =====
app.get('/config.json', (req, res) => {
    const configPath = path.join(__dirname, 'public', 'config.json');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (fs.existsSync(configPath)) {
        res.sendFile(configPath);
    } else {
        res.status(404).json({ error: 'config.json not found in public folder' });
    }
});

// ===== MIDDLEWARE CHECK LOGIN =====
function checkAuth(req, res, next) {
    if (req.cookies && req.cookies.loggedIn === 'true') {
        return next();
    }
    res.redirect('/');
}

// ===== TẠO THƯ MỤC CONFIG NẾU CHƯA CÓ =====
function ensureConfigDir() {
    const dir = path.join(__dirname, 'configs', 'modules', '1');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const dummy = path.join(dir, 'dummy.json');
    if (!fs.existsSync(dummy)) {
        fs.writeFileSync(dummy, '{}');
    }
}
ensureConfigDir();

// ===== TRANG ĐĂNG NHẬP =====
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

// ===== DASHBOARD =====
app.get('/dashboard', checkAuth, (req, res) => {
    const isUnlocked = (req.cookies && req.cookies.unlocked === 'true') || false;
    res.render('dashboard', {
        user: USER,
        version: 'v5.0',
        unlocked: isUnlocked,
        modules: userModules[USER] || {}
    });
});

// ===== UNLOCK VIP =====
app.post('/unlock', checkAuth, (req, res) => {
    const { username, key } = req.body;
    if (username === USER && key === VIP_KEY) {
        res.cookie('unlocked', 'true', { maxAge: 3600000, httpOnly: true, path: '/' });
        if (!userModules[USER]) {
            userModules[USER] = {
                aimlock: { head: false, neck: false, snap: false, sticky: false, magnetic: false },
                assistlock: { drag: false, stick: false, pull: false, smooth: false, brake: false },
                fpssmooth: { boost: false, adaptive: false, dynamic: false, lagfix: false, gpuboost: false },
                tagnhay: { aim: false, touch: false, vertical: false, swipe: false, scope: false },
                centerlock: { snap: false, stick: false, magnet: false, brake: false, prediction: false }
            };
        }
        res.status(200).send('UNLOCKED');
    } else {
        res.status(401).send('INVALID');
    }
});

// ===== TOGGLE MODULE =====
app.post('/toggle', checkAuth, (req, res) => {
    const { module, sub, enabled } = req.body;
    if (!userModules[USER]) userModules[USER] = {};
    if (!userModules[USER][module]) userModules[USER][module] = {};
    userModules[USER][module][sub] = enabled;
    res.status(200).send('OK');
});

// ===== MERGE CONFIG =====
function mergeAllConfigs(modules) {
    const result = {};
    const moduleMap = {
        aimlock: ['head', 'neck', 'snap', 'sticky', 'magnetic'],
        assistlock: ['drag', 'stick', 'pull', 'smooth', 'brake'],
        fpssmooth: ['boost', 'adaptive', 'dynamic', 'lagfix', 'gpuboost'],
        tagnhay: ['aim', 'touch', 'vertical', 'swipe', 'scope'],
        centerlock: ['snap', 'stick', 'magnet', 'brake', 'prediction']
    };
    for (let mod in moduleMap) {
        if (modules[mod]) {
            for (let sub of moduleMap[mod]) {
                if (modules[mod][sub] === true) {
                    const filePath = path.join(__dirname, 'configs', 'modules', '1', `${mod}_${sub}.json`);
                    if (fs.existsSync(filePath)) {
                        try {
                            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                            for (let key in data) {
                                if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
                                    result[key] = { ...result[key], ...data[key] };
                                } else {
                                    result[key] = data[key];
                                }
                            }
                        } catch(e) {}
                    }
                }
            }
        }
    }
    return result;
}

// ===== CONFIG TỔNG HỢP CHO WEB (CÓ CHECK LOGIN) =====
app.get('/config-web', checkAuth, (req, res) => {
    const modules = userModules[USER] || {};
    if (req.cookies.unlocked === 'true') {
        res.json(mergeAllConfigs(modules));
    } else {
        res.json({ status: 'locked', message: 'Chưa unlock VIP' });
    }
});

// ===== LOGOUT =====
app.get('/logout', (req, res) => {
    res.clearCookie('loggedIn');
    res.clearCookie('unlocked');
    res.redirect('/');
});

app.listen(PORT, () => console.log(`🔥 Server chạy tại http://localhost:${PORT}`));
