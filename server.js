const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const USER = 'mtriet';
const PASS = 'mtriet123';

// Phục vụ file tĩnh (CSS, JS, ảnh) nếu có
app.use(express.static('public'));

// Middleware kiểm tra đăng nhập qua session ảo (dùng cookie đơn giản)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route trang đăng nhập
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MTRIET DZ ENGINE - Đăng Nhập</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            body {
                background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .login-box {
                background: rgba(255,255,255,0.05);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 30px;
                padding: 50px 40px;
                width: 380px;
                box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                text-align: center;
                transition: 0.3s;
            }
            .login-box:hover {
                transform: scale(1.02);
                box-shadow: 0 30px 60px rgba(0,0,0,0.7);
            }
            .logo {
                font-size: 48px;
                font-weight: 800;
                background: linear-gradient(90deg, #f7971e, #ffd200);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #aaa;
                font-size: 14px;
                margin-bottom: 30px;
                letter-spacing: 2px;
            }
            .input-group {
                position: relative;
                margin-bottom: 25px;
            }
            .input-group input {
                width: 100%;
                padding: 14px 20px;
                background: rgba(255,255,255,0.07);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 50px;
                color: #fff;
                font-size: 16px;
                outline: none;
                transition: 0.3s;
            }
            .input-group input:focus {
                border-color: #f7971e;
                background: rgba(255,255,255,0.12);
                box-shadow: 0 0 20px rgba(247, 151, 30, 0.2);
            }
            .input-group input::placeholder {
                color: #888;
            }
            .btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(90deg, #f7971e, #ffd200);
                border: none;
                border-radius: 50px;
                color: #1a1a2e;
                font-weight: 700;
                font-size: 18px;
                cursor: pointer;
                transition: 0.3s;
                letter-spacing: 1px;
            }
            .btn:hover {
                transform: scale(1.02);
                box-shadow: 0 10px 30px rgba(247, 151, 30, 0.3);
            }
            .error-msg {
                color: #ff6b6b;
                font-size: 14px;
                margin-top: 15px;
                display: none;
            }
            .footer {
                color: #555;
                font-size: 12px;
                margin-top: 20px;
            }
            .footer span {
                color: #f7971e;
            }
        </style>
    </head>
    <body>
        <div class="login-box">
            <div class="logo">✦ MTRIET DZ ✦</div>
            <div class="subtitle">🔐 SUPREME ENGINE</div>
            <form id="loginForm" onsubmit="return login(event)">
                <div class="input-group">
                    <input type="text" id="username" placeholder="👤 Tên đăng nhập" required>
                </div>
                <div class="input-group">
                    <input type="password" id="password" placeholder="🔑 Mật khẩu" required>
                </div>
                <button type="submit" class="btn">🚀 ĐĂNG NHẬP</button>
                <div id="errorMsg" class="error-msg">❌ Sai tên đăng nhập hoặc mật khẩu!</div>
            </form>
            <div class="footer">⚡ <span>MTRIET DZ</span> ENGINE v2.0</div>
        </div>

        <script>
            async function login(e) {
                e.preventDefault();
                const user = document.getElementById('username').value;
                const pass = document.getElementById('password').value;
                const errorMsg = document.getElementById('errorMsg');

                const response = await fetch('/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user, password: pass })
                });

                if (response.ok) {
                    window.location.href = '/config.json';
                } else {
                    errorMsg.style.display = 'block';
                }
            }
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

// Route xác thực (nhận JSON từ form)
app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (username === USER && password === PASS) {
        res.status(200).send('OK');
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Route /config.json – yêu cầu đăng nhập qua header Authorization
app.get('/config.json', (req, res) => {
    const auth = req.headers.authorization;
    if (auth) {
        const base64 = auth.split(' ')[1];
        const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
        if (user === USER && pass === PASS) {
            return res.sendFile(path.join(__dirname, 'config.json'));
        }
    }
    res.redirect('/');
});

// Route public cho ảnh, css nếu có
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log('Server running on port', PORT));
