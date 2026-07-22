const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const USER = 'mtriet';
const PASS = 'mtriet123';

// Basic Auth
app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
        return res.status(401).send('Unauthorized');
    }
    const base64 = auth.split(' ')[1];
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
    if (user === USER && pass === PASS) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
        res.status(401).send('Unauthorized');
    }
});

// Route config.json
app.get('/config.json', (req, res) => {
    const filePath = path.join(__dirname, 'config.json');
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found');
        }
    });
});

// Route mặc định (kiểm tra server chạy)
app.get('/', (req, res) => {
    res.send('Server is running. Use /config.json');
});

app.listen(PORT, () => console.log('Server running on port', PORT));
