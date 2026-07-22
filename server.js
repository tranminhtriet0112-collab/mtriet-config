res.status(200).send('OK');
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Route /config.json – yêu cầu đăng nhập qua cookie/session ảo
app.get('/config.json', (req, res) => {
    // Kiểm tra header Authorization (dùng cho curl)
    const auth = req.headers.authorization;
    if (auth) {
        const base64 = auth.split(' ')[1];
        const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
        if (user === USER && pass === PASS) {
            return res.sendFile(path.join(__dirname, 'config.json'));
        }
    }

    // Nếu không có auth, chuyển về trang đăng nhập
    res.redirect('/');
});

// Route public cho ảnh, css nếu có
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(PORT, () => console.log('Server running on port', PORT));
