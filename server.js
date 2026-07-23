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

function checkAuth(req, res, next) {
    if (req.cookies && req.cookies.loggedIn === 'true') return next();
    res.redirect('/');
}

// Tạo thư mục config nếu chưa có (không cần thư mục con 1)
function ensureConfigDir() {
    const dir = path.join(__dirname, 'configs', 'modules');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
ensureConfigDir();

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

app.get('/dashboard', checkAuth, (req, res) => {
    const isUnlocked = (req.cookies && req.cookies.unlocked === 'true') || false;
    res.render('dashboard', {
        user: USER,
        version: 'v5.0',
        unlocked: isUnlocked,
        modules: userModules[USER] || {}
    });
});

app.post('/unlock', checkAuth, (req, res) => {
    const { username, key } = req.body;
    if (username === USER && key === VIP_KEY) {
        res.cookie('unlocked', 'true', { maxAge: 3600000, httpOnly: true, path: '/' });
        userModules[USER] = {
            aimlock: { head: false, neck: false, snap: false, sticky: false, magnetic: false },
            assistlock: { drag: false, stick: false, pull: false, smooth: false, brake: false },
            fpssmooth: { boost: false, adaptive: false, dynamic: false, lagfix: false, gpuboost: false },
            tagnhay: { aim: false, touch: false, vertical: false, swipe: false, scope: false },
            centerlock: { snap: false, stick: false, magnet: false, brake: false, prediction: false }
        };
        res.status(200).send('UNLOCKED');
    } else {
        res.status(401).send('INVALID');
    }
});

app.post('/toggle', checkAuth, (req, res) => {
    const { module, sub, enabled } = req.body;
    if (!userModules[USER]) userModules[USER] = {};
    if (!userModules[USER][module]) userModules[USER][module] = {};
    userModules[USER][module][sub] = enabled;
    res.status(200).send('OK');
});

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
                    // SỬA ĐƯỜNG DẪN: KHÔNG CÓ THƯ MỤC CON '1/'
                    const filePath = path.join(__dirname, 'configs', 'modules', `${mod}_${sub}.json`);
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
                        } catch (e) {
                            console.log('Lỗi đọc file:', filePath);
                        }
                    }
                }
            }
        }
    }
    return result;
}

app.get('/config.json', checkAuth, (req, res) => {
    const modules = userModules[USER] || {};
    if (req.cookies.unlocked === 'true') {
        const finalConfig = mergeAllConfigs(modules);
        res.json(finalConfig);
    } else {
        res.json({ status: 'locked', message: 'Chưa unlock VIP' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('loggedIn');
    res.clearCookie('unlocked');
    res.redirect('/');
});

app.use((req, res) => res.status(404).send('Không tìm thấy trang'));
app.use((err, req, res, next) => {
    console.error('Lỗi server:', err);
    res.status(500).send('Lỗi server, vui lòng thử lại sau');
});

app.listen(PORT, () => {
    console.log(`🔥 Server chạy tại http://localhost:${PORT}`);
    console.log(`📁 Config dir: ${path.join(__dirname, 'configs', 'modules')}`);
});
