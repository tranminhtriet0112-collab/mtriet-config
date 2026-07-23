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

// =============================================
// ROUTE /config.json - CHỈ TRẢ VỀ FILE THẬT
// =============================================
app.get('/config.json', (req, res) => {
    const configPath = path.join(__dirname, 'public', 'config.json');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (fs.existsSync(configPath)) {
        return res.sendFile(configPath);
    } else {
        return res.status(404).json({ 
            error: 'config.json not found',
            message: 'Vui lòng upload file config.json vào thư mục public/'
        });
    }
});

// =============================================
// CÁC ROUTE CHỨC NĂNG CHÍNH
// =============================================
function checkAuth(req, res, next) {
    if (req.cookies && req.cookies.loggedIn === 'true') {
        return next();
    }
    res.redirect('/');
}

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

app.get('/', (req, res) => {
    if (req.cookies && req.cookies.loggedIn === 'true') return res.redirect('/dashboard');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (username === USER && password === PASS) {
        res.cookie('loggedIn', 'true', { maxAge: 3600000, httpOnly: true, path: '/' });
        res.cookie('username', username, { maxAge: 3600000, httpOnly: true, path: '/' });
        res.status(200).send('OK');
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/dashboard', checkAuth, (req, res) => {
    const username = req.cookies.username || USER;
    const isUnlocked = (req.cookies && req.cookies.unlocked === 'true') || false;
    res.render('dashboard', {
        user: username,
        version: 'v6.0',
        unlocked: isUnlocked,
        modules: userModules[username] || {}
    });
});

app.post('/unlock', checkAuth, (req, res) => {
    const username = req.cookies.username || USER;
    const { key } = req.body;
    if (key === VIP_KEY) {
        res.cookie('unlocked', 'true', { maxAge: 3600000, httpOnly: true, path: '/' });
        if (!userModules[username]) {
            userModules[username] = {
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

app.post('/toggle', checkAuth, (req, res) => {
    const username = req.cookies.username || USER;
    const { module, sub, enabled } = req.body;
    if (!userModules[username]) userModules[username] = {};
    if (!userModules[username][module]) userModules[username][module] = {};
    userModules[username][module][sub] = enabled;
    res.status(200).send('OK');
});

app.post('/activate-all', checkAuth, (req, res) => {
    const username = req.cookies.username || USER;
    const modules = ['aimlock', 'assistlock', 'fpssmooth', 'tagnhay', 'centerlock'];
    const subs = {
        aimlock: ['head', 'neck', 'snap', 'sticky', 'magnetic'],
        assistlock: ['drag', 'stick', 'pull', 'smooth', 'brake'],
        fpssmooth: ['boost', 'adaptive', 'dynamic', 'lagfix', 'gpuboost'],
        tagnhay: ['aim', 'touch', 'vertical', 'swipe', 'scope'],
        centerlock: ['snap', 'stick', 'magnet', 'brake', 'prediction']
    };
    if (!userModules[username]) userModules[username] = {};
    for (let mod of modules) {
        if (!userModules[username][mod]) userModules[username][mod] = {};
        for (let sub of subs[mod]) {
            userModules[username][mod][sub] = true;
        }
    }
    res.status(200).send('ALL_ACTIVATED');
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

app.get('/config-web', checkAuth, (req, res) => {
    const username = req.cookies.username || USER;
    const modules = userModules[username] || {};
    if (req.cookies.unlocked === 'true') {
        res.json(mergeAllConfigs(modules));
    } else {
        res.status(403).json({ status: 'locked', message: 'Chưa unlock VIP' });
    }
});

app.get('/done', checkAuth, (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Done - MTRIET DZ</title>
    <style>
        body { background: #0a0a0f; color: #fff; font-family: Arial; display: flex; justify-content
