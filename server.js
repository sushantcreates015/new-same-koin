const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static assets EXCEPT public direct routing to admin.html or index.html files
app.use(express.static(__dirname, { index: false }));

/* -------------------------------
   MongoDB Connection & Schema
--------------------------------*/
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected Successfully");
})
.catch((err) => {
    console.log("❌ MongoDB Connection Error:", err.message);
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    durationMs: { type: Number, required: true }, 
    durationLabel: { type: String, required: true },
    startTime: { type: Date, default: null },     
    sessionToken: { type: String, default: '' },  
    isOnline: { type: Boolean, default: false },
    createdDate: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

/* -------------------------------
   TikTok Username Lookup API
--------------------------------*/
app.get("/api/tiktok", async (req, res) => {
    let username = req.query.username;
    if (!username) {
        return res.status(400).json({ success: false, message: "Username missing" });
    }
    username = username.replace("@", "");

    try {
        const response = await fetch(`https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(username)}`);
        const data = await response.json();

        if (!data || !data.data || !data.data.user) {
            return res.json({ success: false });
        }

        const user = data.data.user;
        const stats = data.data.stats;

        res.json({
            success: true,
            username: user.uniqueId,
            nickname: user.nickname,
            avatar: user.avatarLarger,
            followers: stats.followerCount,
            following: stats.followingCount,
            likes: stats.heartCount
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

/* -------------------------------
   Authentication & Session System
--------------------------------*/

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'crazzyadmin015') {
        // Return verification tokens so the frontend can append it to the admin URL securely
        return res.json({ success: true, isAdmin: true, token: 'crazzyadmin015' });
    }

    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials!" });
        }

        const now = Date.now();
        if (!user.startTime) {
            user.startTime = new Date(now);
        } else {
            const elapsed = now - user.startTime.getTime();
            if (elapsed >= user.durationMs) {
                return res.status(403).json({ success: false, message: "This account has expired!" });
            }
        }

        const newSessionToken = 'tkn_' + Math.random().toString(36).substr(2, 9);
        user.sessionToken = newSessionToken;
        user.isOnline = true;
        await user.save();

        res.json({
            success: true,
            isAdmin: false,
            userId: user._id,
            token: newSessionToken
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Database server error." });
    }
});

app.post('/api/session/verify', async (req, res) => {
    const { userId, token } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.json({ valid: false, reason: "deleted" });

        if (!user.startTime) {
            return res.json({ valid: true, msRemaining: user.durationMs });
        }

        const now = Date.now();
        const elapsed = now - user.startTime.getTime();
        const msRemaining = user.durationMs - elapsed;

        if (msRemaining <= 0) {
            user.isOnline = false;
            user.sessionToken = '';
            await user.save();
            return res.json({ valid: false, reason: "expired" });
        }

        if (user.sessionToken !== token) {
            return res.json({ valid: false, reason: "multi-device" });
        }

        res.json({ valid: true, msRemaining });
    } catch (err) {
        res.json({ valid: false, reason: "error" });
    }
});

/* -------------------------------
   Admin Operations Control Center
--------------------------------*/
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}).sort({ _id: -1 });
        const now = Date.now();

        const calculatedUsers = users.map(user => {
            let msRemaining = user.durationMs;
            let isExpired = false;
            if (user.startTime) {
                const elapsed = now - user.startTime.getTime();
                msRemaining = Math.max(0, user.durationMs - elapsed);
                if (msRemaining <= 0) isExpired = true;
            }

            return {
                id: user._id,
                username: user.username,
                password: user.password,
                isOnline: user.isOnline,
                createdDate: user.createdDate,
                durationLabel: user.durationLabel,
                startTime: user.startTime,
                msRemaining: msRemaining,
                isExpired: isExpired
            };
        });

        res.json({ success: true, users: calculatedUsers });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/admin/create', async (req, res) => {
    const { username, password, durationMs, durationLabel } = req.body;
    try {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ success: false, message: "Username already exists!" });

        const newUser = new User({
            username,
            password,
            durationMs,
            durationLabel,
            createdDate: new Date().toLocaleDateString()
        });

        await newUser.save();
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to store user account." });
    }
});

app.delete('/api/admin/delete/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/admin/clear-expired', async (req, res) => {
    try {
        const users = await User.find({});
        const now = Date.now();
        let deletedCount = 0;

        for (let user of users) {
            if (user.startTime) {
                const elapsed = now - user.startTime.getTime();
                if (elapsed >= user.durationMs) {
                    await User.findByIdAndDelete(user._id);
                    deletedCount++;
                }
            }
        }
        res.json({ success: true, deletedCount });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

/* -------------------------------
   SECURE STRIP-DOWN ROUTING INTERFACES
--------------------------------*/

// Protect admin.html from public access
app.get("/admin.html", (req, res) => {
    const token = req.query.auth;
    if (token === 'crazzyadmin015') {
        res.sendFile(path.join(__dirname, "admin.html"));
    } else {
        // Instantly bounce unauthorized lookups back to login interface
        res.redirect("/");
    }
});

// Protect index.html from direct user access without matching structural payload token parameters
app.get("/index.html", (req, res) => {
    const hasToken = req.query.user || req.query.token;
    if (hasToken) {
        res.sendFile(path.join(__dirname, "index.html"));
    } else {
        res.redirect("/");
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Server running on http://localhost:${PORT}`);
});