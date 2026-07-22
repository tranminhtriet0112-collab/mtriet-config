const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const USER = 'mtriet';
const PASS = 'mtriet123';

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

app.get('/config.json', (req, res) => {
    res.sendFile(__dirname + '/config.json');
});

app.listen(PORT, () => console.log('Server running on port', PORT));
