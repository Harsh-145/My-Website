/* ============================================
   THE WIZARDING HUB — Main JavaScript
   Firebase-powered real-time fan community
   ============================================ */

// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// SETUP: To enable shared data across all visitors:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g., "wizarding-hub")
// 3. Go to Build > Realtime Database > Create Database > Start in TEST mode
// 4. Go to Project Settings > General > Your apps > Add Web App
// 5. Copy your config values below and replace the placeholders
var FIREBASE_CONFIG = {
 apiKey: "AIzaSyBVJ-aZmf-6fge4_RYbUywcDMUMYSdYPzI",
  authDomain: "blogbyharsh-d2b90.firebaseapp.com",
  databaseURL: "https://blogbyharsh-d2b90-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "blogbyharsh-d2b90",
  storageBucket: "blogbyharsh-d2b90.firebasestorage.app",
  messagingSenderId: "1071043804200",
  appId: "1:1071043804200:web:0bdc6f9a7505586003891d",
  measurementId: "G-96S0YNVSG7"
};

// Admin usernames - these users get access to the Admin Panel
var ADMIN_USERS = ['Harsh Yadav'];

var useFirebase = false;
var fbDB = null;
var firebaseBootstrapStarted = false;

bootstrapFirebase();

function bootstrapFirebase() {
    if (firebaseBootstrapStarted) return;
    firebaseBootstrapStarted = true;

    try {
        if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === "YOUR_API_KEY" || typeof firebase === 'undefined') {
            return;
        }

        firebase.initializeApp(FIREBASE_CONFIG);
        fbDB = firebase.database();

        if (firebase.auth) {
            firebase.auth().signInAnonymously().then(function() {
                useFirebase = true;
                console.log('Firebase connected with anonymous auth - data is shared in real-time!');
                seedSampleData();
                setupFirebaseListeners();
                refreshFirebaseViews();
            }).catch(function(err) {
                console.warn('Firebase anonymous auth failed, using localStorage fallback:', err);
            });
        } else {
            useFirebase = true;
            console.log('Firebase connected - data is shared in real-time!');
        }
    } catch (err) {
        console.warn('Firebase init failed, using localStorage fallback:', err);
    }
}

function refreshFirebaseViews() {
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') return;
    renderBlogs();
    renderVideos();
    renderMemes();
    renderChatMessages();
}

// ==========================================
// DATA LAYER - Firebase + localStorage
// ==========================================
var dataCache = {};
var LOCAL_ONLY_KEYS = ['currentUser', 'seeded'];

var DB = {
    get: function(key, fallback) {
        var fb = fallback !== undefined ? fallback : [];
        if (dataCache[key] !== undefined) return dataCache[key];
        try {
            var data = localStorage.getItem('wh_' + key);
            return data ? JSON.parse(data) : fb;
        } catch (e) { return fb; }
    },
    set: function(key, value) {
        dataCache[key] = value;
        try { localStorage.setItem('wh_' + key, JSON.stringify(value)); } catch (e) {}
        if (useFirebase && fbDB && LOCAL_ONLY_KEYS.indexOf(key) === -1) {
            var fbPath = key.replace(/_/g, '/');
            fbDB.ref(fbPath).set(value).catch(function(err) { console.error('Firebase write error:', err); });
        }
    },
    remove: function(key) {
        delete dataCache[key];
        localStorage.removeItem('wh_' + key);
        if (useFirebase && fbDB && LOCAL_ONLY_KEYS.indexOf(key) === -1) {
            var fbPath = key.replace(/_/g, '/');
            fbDB.ref(fbPath).remove().catch(function(e) { console.error(e); });
        }
    }
};

// Real-time Firebase listeners
var listenersSetup = false;
function setupFirebaseListeners() {
    if (!useFirebase || !fbDB || listenersSetup) return;
    listenersSetup = true;

    ['blogs', 'videos', 'memes', 'users'].forEach(function(key) {
        fbDB.ref(key).on('value', function(snap) {
            var val = snap.val();
            var arr = [];
            if (val) {
                arr = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
            }
            dataCache[key] = arr;
            try { localStorage.setItem('wh_' + key, JSON.stringify(arr)); } catch (e) {}
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                if (key === 'blogs') renderBlogs();
                else if (key === 'videos') renderVideos();
                else if (key === 'memes') renderMemes();
            }
        });
    });

    ['general', 'gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'].forEach(function(room) {
        fbDB.ref('chat/' + room).on('value', function(snap) {
            var val = snap.val();
            var arr = [];
            if (val) {
                arr = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
            }
            dataCache['chat_' + room] = arr;
            try { localStorage.setItem('wh_chat_' + room, JSON.stringify(arr)); } catch (e) {}
            if (currentRoom === room) renderChatMessages();
        });
    });
}

// ==========================================
// AUTH SYSTEM
// ==========================================
var currentUser = DB.get('currentUser', null);

function getUsers() { return DB.get('users', []); }

// Simple hash for passwords — NOT cryptographic, but prevents plain-text storage
function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash = hash & hash; // Convert to 32-bit int
    }
    return 'wh_' + Math.abs(hash).toString(36);
}

function isAdmin() {
    if (!currentUser) return false;
    if (ADMIN_USERS.indexOf(currentUser.username) !== -1) return true;
    var users = getUsers();
    var user = users.find(function(u) { return u.username === currentUser.username; });
    return user && user.role === 'admin';
}

function canModify(authorName) {
    if (!currentUser) return false;
    if (isAdmin()) return true;
    if (authorName === 'Anonymous Wizard') return false;
    return currentUser.username === authorName;
}

function openAuthModal() {
    document.getElementById('auth-modal').classList.add('open');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    }
}

function handleRegister(e) {
    e.preventDefault();
    var username = document.getElementById('reg-username').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var house = document.getElementById('reg-house').value;
    var password = document.getElementById('reg-password').value;

    if (!username || username.length < 3) {
        showToast('Username must be at least 3 characters!', 'error');
        return;
    }
    if (!password || password.length < 4) {
        showToast('Password must be at least 4 characters!', 'error');
        return;
    }

    var users = getUsers();
    if (users.find(function(u) { return u.username.toLowerCase() === username.toLowerCase(); })) {
        showToast('Username already taken!', 'error');
        return;
    }
    if (users.find(function(u) { return u.email && u.email.toLowerCase() === email.toLowerCase(); })) {
        showToast('Email already registered! Try signing in.', 'error');
        return;
    }

    var user = {
        username: username, email: email, house: house,
        password: simpleHash(password),
        joinedAt: Date.now(),
        role: ADMIN_USERS.indexOf(username) !== -1 ? 'admin' : 'user',
        status: 'active'
    };
    users.push(user);
    DB.set('users', users);

    currentUser = { username: username, house: house, email: email };
    DB.set('currentUser', currentUser);

    document.getElementById('register-form').reset();
    closeAuthModal();
    updateAuthUI();
    renderBlogs(); renderVideos(); renderMemes();
    showToast('Welcome to the Order, ' + username + '!', 'success');
}

function handleLogin(e) {
    e.preventDefault();
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value;

    if (!username || !password) {
        showToast('Please fill in all fields!', 'error');
        return;
    }

    var users = getUsers();
    // Case-insensitive username match
    var user = users.find(function(u) {
        return u.username.toLowerCase() === username.toLowerCase();
    });

    if (!user) {
        showToast('No account found with that username!', 'error');
        document.getElementById('login-password').value = '';
        return;
    }

    // Support both hashed and legacy plain-text passwords
    var passwordMatch = false;
    if (user.password && user.password.indexOf('wh_') === 0) {
        // Hashed password
        passwordMatch = (simpleHash(password) === user.password);
    } else {
        // Legacy plain-text — migrate to hashed on successful login
        passwordMatch = (user.password === password);
        if (passwordMatch) {
            user.password = simpleHash(password);
            DB.set('users', users);
        }
    }

    if (!passwordMatch) {
        showToast('Incorrect password!', 'error');
        document.getElementById('login-password').value = '';
        return;
    }

    if (user.status === 'banned') {
        showToast('This account has been banned.', 'error');
        return;
    }

    currentUser = { username: user.username, house: user.house, email: user.email };
    DB.set('currentUser', currentUser);

    document.getElementById('login-form').reset();
    closeAuthModal();
    updateAuthUI();
    renderBlogs(); renderVideos(); renderMemes();
    showToast('Welcome back, ' + user.username + '!', 'success');
}

function logout() {
    currentUser = null;
    DB.set('currentUser', null);
    updateAuthUI();
    navigateTo('hero');
    renderBlogs(); renderVideos(); renderMemes();
    showToast('Logged out. Mischief managed!', 'info');
}

function updateAuthUI() {
    var authBtn = document.getElementById('auth-btn');
    var adminNavItem = document.getElementById('admin-nav-item');

    // Validate session — if currentUser exists but not found in users DB, clear it
    if (currentUser) {
        var users = getUsers();
        var found = users.find(function(u) { return u.username === currentUser.username; });
        if (users.length > 0 && !found) {
            // User was deleted or data was wiped
            currentUser = null;
            DB.set('currentUser', null);
        }
    }

    if (currentUser) {
        var houseEmoji = { gryffindor: '\u{1F981}', slytherin: '\u{1F40D}', ravenclaw: '\u{1F985}', hufflepuff: '\u{1F9A1}' };
        authBtn.innerHTML = (houseEmoji[currentUser.house] || '\u26A1') + ' ' + escapeHtml(currentUser.username);
        authBtn.onclick = function() { if (confirm('Sign out?')) logout(); };

        if (adminNavItem) {
            adminNavItem.style.display = isAdmin() ? '' : 'none';
        }
    } else {
        authBtn.textContent = 'Sign In';
        authBtn.onclick = openAuthModal;
        if (adminNavItem) adminNavItem.style.display = 'none';
    }
}

function getAuthorName(isAnonymous) {
    if (isAnonymous) return 'Anonymous Wizard';
    return currentUser ? currentUser.username : 'Guest Muggle';
}

function getAuthorInitials(name) {
    if (name === 'Anonymous Wizard') return '?';
    return name.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(sectionId) {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active-section'); });
    var target = document.getElementById(sectionId);
    if (target) target.classList.add('active-section');

    document.querySelectorAll('.nav-link').forEach(function(l) {
        l.classList.toggle('active', l.dataset.section === sectionId);
    });

    var footer = document.getElementById('site-footer');
    footer.classList.toggle('visible', sectionId !== 'hero');

    document.getElementById('nav-links').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sectionId === 'admin' && isAdmin()) {
        refreshAdminPanel();
    }
}

document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        navigateTo(link.dataset.section);
    });
});

document.querySelector('.nav-logo').addEventListener('click', function(e) {
    e.preventDefault();
    navigateTo('hero');
});

document.getElementById('hamburger').addEventListener('click', function() {
    document.getElementById('hamburger').classList.toggle('open');
    document.getElementById('nav-links').classList.toggle('open');
});

window.addEventListener('scroll', function() {
    document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 20);
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3500);
}

// ==========================================
// CONFIRM DIALOG
// ==========================================
function showConfirm(title, message) {
    return new Promise(function(resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML =
            '<div class="confirm-box">' +
            '<h4>' + title + '</h4>' +
            '<p>' + message + '</p>' +
            '<div class="confirm-actions">' +
            '<button class="btn btn-outline btn-sm confirm-cancel">Cancel</button>' +
            '<button class="btn btn-danger btn-sm confirm-ok">Delete</button>' +
            '</div></div>';
        document.body.appendChild(overlay);

        overlay.querySelector('.confirm-cancel').onclick = function() { overlay.remove(); resolve(false); };
        overlay.querySelector('.confirm-ok').onclick = function() { overlay.remove(); resolve(true); };
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) { overlay.remove(); resolve(false); }
        });
    });
}

// ==========================================
// MUSIC CONTROLLER
// ==========================================
var musicToggle = document.getElementById('music-toggle');
var musicIcon = document.getElementById('music-icon');
var musicLoading = document.getElementById('music-loading');
var bgMusic = document.getElementById('bg-music');
var isPlaying = false;
var musicAttempted = false;

function setMusicUI(state) {
    if (state === 'loading') {
        musicIcon.style.display = 'none';
        musicLoading.style.display = 'inline-block';
    } else {
        musicLoading.style.display = 'none';
        musicIcon.style.display = 'inline';
        musicIcon.textContent = state === 'playing' ? '\u{1F50A}' : '\u{1F507}';
    }
}

function tryPlayMusic() {
    if (musicAttempted) return;
    musicAttempted = true;
    setMusicUI('loading');
    bgMusic.volume = 0.3;
    bgMusic.play().then(function() {
        isPlaying = true;
        setMusicUI('playing');
    }).catch(function() {
        setMusicUI('paused');
    });
}

document.addEventListener('click', tryPlayMusic, { once: true });
document.addEventListener('touchstart', tryPlayMusic, { once: true });

musicToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
        setMusicUI('paused');
    } else {
        setMusicUI('loading');
        bgMusic.volume = 0.3;
        bgMusic.play().then(function() {
            isPlaying = true;
            setMusicUI('playing');
        }).catch(function() {
            setMusicUI('paused');
            showToast('Could not play audio', 'error');
        });
    }
});

bgMusic.addEventListener('canplaythrough', function() {
    if (isPlaying) setMusicUI('playing');
});
bgMusic.addEventListener('waiting', function() {
    if (isPlaying) setMusicUI('loading');
});

// ==========================================
// SNOW EFFECT
// ==========================================
var snowCanvas = document.getElementById('snow-canvas');
var snowCtx = snowCanvas.getContext('2d');

function resizeCanvas() {
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

var mouse = { x: null, y: null };

function Snowflake() { this.reset(true); }
Snowflake.prototype.reset = function(init) {
    this.x = Math.random() * snowCanvas.width;
    this.y = init ? Math.random() * snowCanvas.height : -5;
    this.radius = Math.random() * 2.5 + 0.5;
    this.speed = Math.random() * 1 + 0.3;
    this.wind = Math.random() * 0.4 - 0.2;
    this.opacity = Math.random() * 0.6 + 0.3;
    this.vx = 0;
    this.vy = 0;
};
Snowflake.prototype.update = function() {
    // Mouse interaction - repel from cursor
    if (mouse.x !== null && mouse.y !== null) {
        var dx = this.x - mouse.x;
        var dy = this.y - mouse.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var repelRadius = 100;
        
        if (distance < repelRadius) {
            var force = (1 - distance / repelRadius) * 0.8;
            this.vx += (dx / distance) * force * 2;
            this.vy += (dy / distance) * force * 2;
        }
    }
    
    // Damping on interaction velocity
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Base movement (constant) + interaction velocity
    this.x += this.wind + Math.sin(this.y * 0.01) * 0.3 + this.vx;
    this.y += this.speed + this.vy;
    
    if (this.y > snowCanvas.height || this.x < -10 || this.x > snowCanvas.width + 10) this.reset(false);
};
Snowflake.prototype.draw = function() {
    snowCtx.beginPath();
    snowCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    snowCtx.fillStyle = 'rgba(255, 255, 255, ' + this.opacity + ')';
    snowCtx.fill();
};

var snowflakes = [];
for (var si = 0; si < 120; si++) snowflakes.push(new Snowflake());

// Track mouse position for interactive snow
document.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

document.addEventListener('mouseleave', function() {
    mouse.x = null;
    mouse.y = null;
});

// Click to create wind burst
document.addEventListener('click', function(e) {
    if (!snowEnabled || snowPaused) return;
    for (var b = 0; b < snowflakes.length; b++) {
        var flake = snowflakes[b];
        var dx = flake.x - e.clientX;
        var dy = flake.y - e.clientY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var burstRadius = 150;
        
        if (distance < burstRadius) {
            var force = (1 - distance / burstRadius) * 1.5;
            flake.vx += (dx / distance) * force * 5;
            flake.vy += (dy / distance) * force * 5;
        }
    }
});

var snowPaused = false;
document.addEventListener('visibilitychange', function() { snowPaused = document.hidden; if (!snowPaused) animateSnow(); });

function animateSnow() {
    if (snowPaused) return;
    snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    for (var sj = 0; sj < snowflakes.length; sj++) { snowflakes[sj].update(); snowflakes[sj].draw(); }
    requestAnimationFrame(animateSnow);
}
animateSnow();

// ==========================================
// SNOW TOGGLE
// ==========================================
var snowEnabled = localStorage.getItem('wh_snowEnabled') !== 'false';
var snowToggleBtn = document.getElementById('snow-toggle');
var snowIconEl = document.getElementById('snow-icon');

function setSnowState(enabled) {
    snowEnabled = enabled;
    localStorage.setItem('wh_snowEnabled', enabled);
    snowCanvas.style.display = enabled ? '' : 'none';
    snowToggleBtn.classList.toggle('off', !enabled);
    snowIconEl.textContent = enabled ? '\u2744\uFE0F' : '\u2744';
    if (enabled && snowPaused) {
        snowPaused = false;
        animateSnow();
    } else if (!enabled) {
        snowPaused = true;
        snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    }
}

// Apply saved preference on load
if (!snowEnabled) setSnowState(false);

snowToggleBtn.addEventListener('click', function() {
    setSnowState(!snowEnabled);
    showToast(snowEnabled ? 'Snow enabled \u2744\uFE0F' : 'Snow disabled', 'info');
});

// ==========================================
// LIGHT / DARK MODE TOGGLE
// ==========================================
var themeToggleBtn = document.getElementById('theme-toggle');
var themeIconEl = document.getElementById('theme-icon');
var isLightMode = localStorage.getItem('wh_theme') === 'light';

function setTheme(light) {
    isLightMode = light;
    localStorage.setItem('wh_theme', light ? 'light' : 'dark');
    document.body.classList.toggle('light-mode', light);
    themeIconEl.textContent = light ? '\uD83C\uDF19' : '\u2600\uFE0F';
    themeToggleBtn.title = light ? 'Switch to dark mode' : 'Switch to light mode';
    // Adjust snow opacity for light mode
    snowflakes.forEach(function(s) {
        s.lightMode = light;
    });
}

// Override draw for light mode snowflakes
var originalDraw = Snowflake.prototype.draw;
Snowflake.prototype.draw = function() {
    snowCtx.beginPath();
    snowCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    if (this.lightMode) {
        snowCtx.fillStyle = 'rgba(120, 100, 60, ' + (this.opacity * 0.5) + ')';
    } else {
        snowCtx.fillStyle = 'rgba(255, 255, 255, ' + this.opacity + ')';
    }
    snowCtx.fill();
};

// Apply saved preference on load
if (isLightMode) setTheme(true);

themeToggleBtn.addEventListener('click', function() {
    setTheme(!isLightMode);
    showToast(isLightMode ? 'Light mode \u2600\uFE0F' : 'Dark mode \uD83C\uDF19', 'info');
});

// ==========================================
// BLOG SYSTEM
// ==========================================
function getBlogs() { return DB.get('blogs', []); }

function openBlogEditor() {
    document.getElementById('blog-editor-modal').classList.add('open');
}
function closeBlogEditor() {
    document.getElementById('blog-editor-modal').classList.remove('open');
    document.getElementById('blog-form').reset();
}

function formatText(type) {
    var textarea = document.getElementById('blog-body');
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var selected = textarea.value.substring(start, end);
    var replacement = '';

    switch (type) {
        case 'bold': replacement = '**' + (selected || 'bold text') + '**'; break;
        case 'italic': replacement = '*' + (selected || 'italic text') + '*'; break;
        case 'heading': replacement = '\n## ' + (selected || 'Heading') + '\n'; break;
        case 'quote': replacement = '\n> ' + (selected || 'quote') + '\n'; break;
        case 'list': replacement = '\n- ' + (selected || 'list item') + '\n'; break;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
}

function submitBlog(e) {
    e.preventDefault();
    var submitBtn = e.target.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; setTimeout(function() { submitBtn.disabled = false; }, 2000); }

    var blog = {
        id: Date.now(),
        title: document.getElementById('blog-title').value.trim(),
        category: document.getElementById('blog-category').value,
        cover: document.getElementById('blog-cover').value.trim(),
        body: document.getElementById('blog-body').value,
        anonymous: document.getElementById('blog-anonymous').checked,
        author: getAuthorName(document.getElementById('blog-anonymous').checked),
        authorHouse: currentUser ? currentUser.house : null,
        createdAt: Date.now(),
        likes: 0,
        likedBy: [],
        comments: []
    };

    var blogs = getBlogs();
    blogs.unshift(blog);
    DB.set('blogs', blogs);

    closeBlogEditor();
    renderBlogs();
    showToast('Blog post published!', 'success');
}

function deleteBlog(id) {
    showConfirm('Delete Post?', 'This blog post will be permanently removed.').then(function(confirmed) {
        if (!confirmed) return;
        var blogs = getBlogs().filter(function(b) { return b.id !== id; });
        DB.set('blogs', blogs);
        renderBlogs();
        showToast('Blog post deleted.', 'info');
    });
}

function renderBlogs(filter) {
    if (!filter) {
        var activeChip = document.querySelector('.filter-chip.active');
        filter = activeChip ? activeChip.dataset.filter : 'all';
    }

    var grid = document.getElementById('blog-grid');
    var empty = document.getElementById('blogs-empty');
    var blogs = getBlogs();

    if (filter !== 'all') blogs = blogs.filter(function(b) { return b.category === filter; });

    if (blogs.length === 0) {
        grid.innerHTML = '';
        empty.classList.add('visible');
        return;
    }

    empty.classList.remove('visible');
    var categoryLabels = { theory: 'Fan Theory', review: 'Review', character: 'Character', general: 'General' };
    var categoryIcons = { theory: '\u{1F52E}', review: '\u{1F4D6}', character: '\u{1F9D9}', general: '\u2728' };

    grid.innerHTML = blogs.map(function(blog) {
        var excerpt = blog.body.replace(/[#*>\-]/g, '').substring(0, 140) + '...';
        var date = new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        var icon = categoryIcons[blog.category] || '\u{1F4DC}';
        var coverHTML = blog.cover
            ? '<div class="blog-card-cover"><img src="' + escapeHtml(blog.cover) + '" alt="" onerror="this.parentElement.innerHTML=\'' + icon + '\'"></div>'
            : '<div class="blog-card-cover">' + icon + '</div>';

        var deleteBtn = canModify(blog.author)
            ? '<div class="card-actions"><button class="card-action-btn" onclick="event.stopPropagation(); deleteBlog(' + blog.id + ')" title="Delete">\u{1F5D1}\uFE0F</button></div>'
            : '';

        var commentCount = blog.comments ? blog.comments.length : 0;

        return '<article class="blog-card" onclick="openBlogDetail(' + blog.id + ')">' +
            deleteBtn +
            coverHTML +
            '<div class="blog-card-body">' +
                '<span class="blog-card-category">' + (categoryLabels[blog.category] || blog.category) + '</span>' +
                '<h3 class="blog-card-title">' + escapeHtml(blog.title) + '</h3>' +
                '<p class="blog-card-excerpt">' + escapeHtml(excerpt) + '</p>' +
                '<div class="blog-card-meta">' +
                    '<span class="blog-card-author">' + (blog.anonymous ? '\u{1F3AD}' : '\u{1F9D9}') + ' ' + escapeHtml(blog.author) + '</span>' +
                    '<div class="blog-card-stats">' +
                        '<span class="stat-item" onclick="event.stopPropagation(); likeBlog(' + blog.id + ')">\u2764\uFE0F ' + blog.likes + '</span>' +
                        '<span>\u{1F4AC} ' + commentCount + '</span>' +
                        '<span>' + date + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</article>';
    }).join('');
}

function filterBlogs(filter) {
    document.querySelectorAll('.filter-chip').forEach(function(c) {
        c.classList.toggle('active', c.dataset.filter === filter);
    });
    renderBlogs(filter);
}

function likeBlog(id) {
    var blogs = getBlogs();
    var blog = blogs.find(function(b) { return b.id === id; });
    if (!blog) return;

    var userId = currentUser ? currentUser.username : 'guest_' + navigator.userAgent.slice(0, 20);
    if (!blog.likedBy) blog.likedBy = [];
    if (blog.likedBy.indexOf(userId) !== -1) {
        blog.likes = Math.max(0, blog.likes - 1);
        blog.likedBy = blog.likedBy.filter(function(u) { return u !== userId; });
    } else {
        blog.likes++;
        blog.likedBy.push(userId);
    }
    DB.set('blogs', blogs);
    renderBlogs();
}

function openBlogDetail(id) {
    var blogs = getBlogs();
    var blog = blogs.find(function(b) { return b.id === id; });
    if (!blog) return;

    var date = new Date(blog.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    var categoryLabels = { theory: 'Fan Theory', review: 'Review', character: 'Character Analysis', general: 'General' };
    var bodyHTML = markdownToHTML(blog.body);

    var comments = blog.comments || [];
    var commentsHTML = comments.map(function(c) {
        return '<div class="comment-item">' +
            '<div class="comment-avatar">' + getAuthorInitials(c.author) + '</div>' +
            '<div class="comment-content">' +
                '<div class="comment-author">' + escapeHtml(c.author) + '</div>' +
                '<div class="comment-text">' + escapeHtml(c.text) + '</div>' +
                '<div class="comment-time">' + new Date(c.createdAt).toLocaleString() + '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    var deleteAction = canModify(blog.author)
        ? '<button class="btn btn-danger btn-sm" onclick="deleteBlog(' + blog.id + '); closeBlogDetail();">\u{1F5D1}\uFE0F Delete</button>'
        : '';

    document.getElementById('blog-detail-content').innerHTML =
        '<div class="blog-detail-header">' +
            '<span class="blog-detail-category">' + (categoryLabels[blog.category] || blog.category) + '</span>' +
            '<h2 class="blog-detail-title">' + escapeHtml(blog.title) + '</h2>' +
            '<div class="blog-detail-meta">' +
                '<span>' + (blog.anonymous ? '\u{1F3AD}' : '\u{1F9D9}') + ' ' + escapeHtml(blog.author) + '</span>' +
                '<span>\u{1F4C5} ' + date + '</span>' +
                '<span>\u2764\uFE0F ' + blog.likes + ' likes</span>' +
            '</div>' +
        '</div>' +
        (blog.cover ? '<img src="' + escapeHtml(blog.cover) + '" class="blog-detail-cover" alt="" onerror="this.style.display=\'none\'">' : '') +
        '<div class="blog-detail-body">' + bodyHTML + '</div>' +
        '<div class="blog-detail-actions">' +
            '<button class="btn btn-outline btn-sm" onclick="likeBlog(' + blog.id + '); openBlogDetail(' + blog.id + ');">\u2764\uFE0F Like (' + blog.likes + ')</button>' +
            '<button class="btn btn-outline btn-sm" onclick="shareBlog(' + blog.id + ')">\u{1F4E4} Share</button>' +
            deleteAction +
        '</div>' +
        '<div class="blog-comments">' +
            '<h4>\u{1F4AC} Comments (' + comments.length + ')</h4>' +
            '<form class="comment-form" onsubmit="addComment(event, ' + blog.id + ')">' +
                '<input type="text" placeholder="Write a comment..." id="comment-input-' + blog.id + '" required>' +
                '<button type="submit" class="btn btn-gold btn-sm">Post</button>' +
            '</form>' +
            (commentsHTML || '<p style="color:var(--text-muted);font-size:0.9rem;">No comments yet. Be the first!</p>') +
        '</div>';

    document.getElementById('blog-detail-modal').classList.add('open');
}

function closeBlogDetail() {
    document.getElementById('blog-detail-modal').classList.remove('open');
}

function addComment(e, blogId) {
    e.preventDefault();
    var input = document.getElementById('comment-input-' + blogId);
    var text = input.value.trim();
    if (!text) return;

    var blogs = getBlogs();
    var blog = blogs.find(function(b) { return b.id === blogId; });
    if (!blog) return;

    if (!blog.comments) blog.comments = [];
    blog.comments.push({
        author: getAuthorName(false),
        text: text,
        createdAt: Date.now()
    });

    DB.set('blogs', blogs);
    openBlogDetail(blogId);
    renderBlogs();
    showToast('Comment added!', 'success');
}

function shareBlog(id) {
    var text = 'Check out this post on The Wizarding Hub!';
    if (navigator.share) {
        navigator.share({ title: 'The Wizarding Hub', text: text, url: window.location.href });
    } else {
        navigator.clipboard.writeText(text + ' ' + window.location.href);
        showToast('Link copied to clipboard!', 'success');
    }
}

// ==========================================
// VIDEO SYSTEM
// ==========================================
function getVideos() { return DB.get('videos', []); }

function openVideoUploader() {
    document.getElementById('video-upload-modal').classList.add('open');
}
function closeVideoUploader() {
    document.getElementById('video-upload-modal').classList.remove('open');
    document.getElementById('video-form').reset();
}

function submitVideo(e) {
    e.preventDefault();
    var submitBtn = e.target.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; setTimeout(function() { submitBtn.disabled = false; }, 2000); }

    var video = {
        id: Date.now(),
        title: document.getElementById('video-title').value.trim(),
        description: document.getElementById('video-desc').value.trim(),
        url: document.getElementById('video-url').value.trim(),
        thumbnail: document.getElementById('video-thumb').value.trim(),
        anonymous: document.getElementById('video-anonymous').checked,
        author: getAuthorName(document.getElementById('video-anonymous').checked),
        createdAt: Date.now(),
        views: 0
    };

    var videos = getVideos();
    videos.unshift(video);
    DB.set('videos', videos);

    closeVideoUploader();
    renderVideos();
    showToast('Video uploaded!', 'success');
}

function getYouTubeId(url) {
    var match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
}

function getYouTubeThumb(url) {
    var id = getYouTubeId(url);
    return id ? 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg' : null;
}

function deleteVideo(id) {
    showConfirm('Delete Video?', 'This video will be permanently removed.').then(function(confirmed) {
        if (!confirmed) return;
        var videos = getVideos().filter(function(v) { return v.id !== id; });
        DB.set('videos', videos);
        renderVideos();
        showToast('Video deleted.', 'info');
    });
}

function renderVideos() {
    var grid = document.getElementById('video-grid');
    var empty = document.getElementById('videos-empty');
    var videos = getVideos();

    if (videos.length === 0) {
        grid.innerHTML = '';
        empty.classList.add('visible');
        return;
    }

    empty.classList.remove('visible');

    grid.innerHTML = videos.map(function(v) {
        var thumb = v.thumbnail || getYouTubeThumb(v.url) || '';
        var date = new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        var thumbContent = thumb ? '<img src="' + escapeHtml(thumb) + '" alt="" onerror="this.style.display=\'none\'">' : '';

        var deleteBtn = canModify(v.author)
            ? '<div class="card-actions"><button class="card-action-btn" onclick="event.stopPropagation(); deleteVideo(' + v.id + ')" title="Delete">\u{1F5D1}\uFE0F</button></div>'
            : '';

        return '<div class="video-card" onclick="openVideoPlayer(' + v.id + ')">' +
            deleteBtn +
            '<div class="video-card-thumb">' +
                thumbContent +
                '<div class="video-play-btn">\u25B6</div>' +
            '</div>' +
            '<div class="video-card-body">' +
                '<h3 class="video-card-title">' + escapeHtml(v.title) + '</h3>' +
                '<p class="video-card-desc">' + escapeHtml(v.description || '') + '</p>' +
                '<div class="video-card-meta">' +
                    '<span>' + (v.anonymous ? '\u{1F3AD}' : '\u{1F9D9}') + ' ' + escapeHtml(v.author) + '</span>' +
                    '<span>' + date + ' \u00B7 ' + v.views + ' views</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function openVideoPlayer(id) {
    var videos = getVideos();
    var video = videos.find(function(v) { return v.id === id; });
    if (!video) return;

    video.views++;
    DB.set('videos', videos);

    var ytId = getYouTubeId(video.url);
    var playerHTML;
    if (ytId) {
        playerHTML = '<div class="video-player-wrapper"><iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1" allowfullscreen allow="autoplay"></iframe></div>';
    } else {
        playerHTML = '<div class="video-player-wrapper"><video src="' + escapeHtml(video.url) + '" controls autoplay></video></div>';
    }

    document.getElementById('video-player-content').innerHTML =
        playerHTML +
        '<h3 class="video-detail-title">' + escapeHtml(video.title) + '</h3>' +
        '<p class="video-detail-desc">' + escapeHtml(video.description || '') + '</p>' +
        '<div class="video-detail-meta">' +
            '<span>' + (video.anonymous ? '\u{1F3AD}' : '\u{1F9D9}') + ' ' + escapeHtml(video.author) + '</span> \u00B7 ' +
            '<span>' + video.views + ' views</span> \u00B7 ' +
            '<span>' + new Date(video.createdAt).toLocaleDateString() + '</span>' +
        '</div>';

    document.getElementById('video-player-modal').classList.add('open');
}

function closeVideoPlayer() {
    var modal = document.getElementById('video-player-modal');
    var content = document.getElementById('video-player-content');
    // Stop video/iframe before removing
    var iframe = content.querySelector('iframe');
    var video = content.querySelector('video');
    if (iframe) iframe.src = '';
    if (video) { video.pause(); video.src = ''; }
    modal.classList.remove('open');
    content.innerHTML = '';
}

// ==========================================
// MEME SYSTEM
// ==========================================
function getMemes() { return DB.get('memes', []); }
var currentMemeData = null;

function openMemeUploader() {
    document.getElementById('meme-upload-modal').classList.add('open');
}
function closeMemeUploader() {
    document.getElementById('meme-upload-modal').classList.remove('open');
    document.getElementById('meme-form').reset();
    currentMemeData = null;
    document.getElementById('meme-preview').style.display = 'none';
    document.getElementById('meme-upload-placeholder').style.display = 'block';
}

var memeUploadArea = document.getElementById('meme-upload-area');
var memeFileInput = document.getElementById('meme-file');
var memePreview = document.getElementById('meme-preview');
var memeUploadPlaceholder = document.getElementById('meme-upload-placeholder');

memeUploadArea.addEventListener('click', function() { memeFileInput.click(); });

memeUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    memeUploadArea.classList.add('dragover');
});
memeUploadArea.addEventListener('dragleave', function() { memeUploadArea.classList.remove('dragover'); });
memeUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    memeUploadArea.classList.remove('dragover');
    var file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processImageFile(file);
});

memeFileInput.addEventListener('change', function() {
    var file = memeFileInput.files[0];
    if (file) processImageFile(file);
});

function processImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB', 'error');
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        currentMemeData = e.target.result;
        memePreview.src = currentMemeData;
        memePreview.style.display = 'block';
        memeUploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function submitMeme(e) {
    e.preventDefault();
    var submitBtn = e.target.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; setTimeout(function() { submitBtn.disabled = false; }, 2000); }

    var imageUrl = document.getElementById('meme-url').value.trim();
    var imageData = currentMemeData || imageUrl;

    if (!imageData) {
        showToast('Please upload or link an image!', 'error');
        return;
    }

    if (currentMemeData && currentMemeData.length > 500000) {
        showToast('Tip: Use image URLs for better performance', 'info');
    }

    var tagsRaw = document.getElementById('meme-tags').value.trim();
    var meme = {
        id: Date.now(),
        caption: document.getElementById('meme-caption').value.trim(),
        image: imageData,
        tags: tagsRaw ? tagsRaw.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [],
        anonymous: document.getElementById('meme-anonymous').checked,
        author: getAuthorName(document.getElementById('meme-anonymous').checked),
        createdAt: Date.now(),
        likes: 0,
        likedBy: []
    };

    var memes = getMemes();
    memes.unshift(meme);
    DB.set('memes', memes);

    closeMemeUploader();
    renderMemes();
    showToast('Meme posted!', 'success');
}

function deleteMeme(id) {
    showConfirm('Delete Meme?', 'This meme will be permanently removed.').then(function(confirmed) {
        if (!confirmed) return;
        var memes = getMemes().filter(function(m) { return m.id !== id; });
        DB.set('memes', memes);
        renderMemes();
        showToast('Meme deleted.', 'info');
    });
}

function renderMemes() {
    var grid = document.getElementById('meme-grid');
    var empty = document.getElementById('memes-empty');
    var memes = getMemes();

    if (memes.length === 0) {
        grid.innerHTML = '';
        empty.classList.add('visible');
        return;
    }

    empty.classList.remove('visible');

    grid.innerHTML = memes.map(function(m) {
        var date = new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        var tags = m.tags || [];
        var tagsHTML = tags.map(function(t) { return '<span class="meme-tag">#' + escapeHtml(t) + '</span>'; }).join('');

        var deleteBtn = canModify(m.author)
            ? '<div class="card-actions"><button class="card-action-btn" onclick="event.stopPropagation(); deleteMeme(' + m.id + ')" title="Delete">\u{1F5D1}\uFE0F</button></div>'
            : '';

        return '<div class="meme-card">' +
            deleteBtn +
            '<img src="' + escapeHtml(m.image) + '" alt="' + escapeHtml(m.caption) + '" class="meme-card-img" loading="lazy">' +
            '<div class="meme-card-body">' +
                '<p class="meme-card-caption">' + escapeHtml(m.caption) + '</p>' +
                (tagsHTML ? '<div class="meme-card-tags">' + tagsHTML + '</div>' : '') +
                '<div class="meme-card-meta">' +
                    '<span>' + (m.anonymous ? '\u{1F3AD}' : '\u{1F9D9}') + ' ' + escapeHtml(m.author) + '</span>' +
                    '<div>' +
                        '<span class="stat-item" onclick="likeMeme(' + m.id + ')">\u2764\uFE0F ' + m.likes + '</span>' +
                        ' \u00B7 ' + date +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function likeMeme(id) {
    var memes = getMemes();
    var meme = memes.find(function(m) { return m.id === id; });
    if (!meme) return;

    var userId = currentUser ? currentUser.username : 'guest_' + navigator.userAgent.slice(0, 20);
    if (!meme.likedBy) meme.likedBy = [];
    if (meme.likedBy.indexOf(userId) !== -1) {
        meme.likes = Math.max(0, meme.likes - 1);
        meme.likedBy = meme.likedBy.filter(function(u) { return u !== userId; });
    } else {
        meme.likes++;
        meme.likedBy.push(userId);
    }
    DB.set('memes', memes);
    renderMemes();
}

// ==========================================
// LIVE CHAT SYSTEM (Real-time with Firebase)
// ==========================================
var currentRoom = 'general';
var chatPollInterval = null;

function getChatMessages(room) { return DB.get('chat_' + (room || currentRoom), []); }

function switchRoom(room) {
    currentRoom = room;
    document.querySelectorAll('.chat-room').forEach(function(r) { r.classList.toggle('active', r.dataset.room === room); });
    renderChatMessages();
}

function sendMessage(e) {
    e.preventDefault();
    var input = document.getElementById('chat-input');
    var text = input.value.trim();
    if (!text) return;

    var isAnonymous = document.getElementById('chat-anonymous').checked;

    var message = {
        id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        text: text,
        author: getAuthorName(isAnonymous),
        anonymous: isAnonymous,
        house: currentUser ? currentUser.house : null,
        timestamp: Date.now()
    };

    var messages = getChatMessages(currentRoom);
    messages.push(message);
    if (messages.length > 200) messages.splice(0, messages.length - 200);
    DB.set('chat_' + currentRoom, messages);

    input.value = '';
    renderChatMessages(); // Always render locally for instant feedback
}

function renderChatMessages() {
    var container = document.getElementById('chat-messages');
    var messages = getChatMessages(currentRoom);

    if (messages.length === 0) {
        var roomNames = { general: 'The Great Hall', gryffindor: 'Gryffindor Common Room', slytherin: 'Slytherin Dungeon', ravenclaw: 'Ravenclaw Tower', hufflepuff: 'Hufflepuff Basement' };
        container.innerHTML = '<div class="chat-system-msg">Welcome to ' + (roomNames[currentRoom] || currentRoom) + '! Be the first to send a message. \u2728</div>';
        return;
    }

    var currentUsername = currentUser ? currentUser.username : null;

    container.innerHTML = messages.map(function(m) {
        var time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var initials = getAuthorInitials(m.author);
        var isOwn = currentUsername && m.author === currentUsername;
        var avatarClass = m.anonymous ? 'chat-avatar anon' : 'chat-avatar';
        var nameClass = m.anonymous ? 'chat-bubble-name anon' : 'chat-bubble-name';
        var ownClass = isOwn ? ' own-message' : '';

        return '<div class="chat-message' + ownClass + '">' +
            '<div class="' + avatarClass + '">' + initials + '</div>' +
            '<div class="chat-bubble">' +
                '<div class="' + nameClass + '">' + escapeHtml(m.author) + ' <span class="chat-bubble-time">' + time + '</span></div>' +
                '<div class="chat-bubble-text">' + escapeHtml(m.text) + '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function startChatPolling() {
    if (useFirebase) return;
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(function() {
        var chatSection = document.getElementById('chat');
        if (chatSection.classList.contains('active-section')) {
            renderChatMessages();
        }
    }, 2000);
}

// ==========================================
// ADMIN PANEL
// ==========================================
var currentAdminTab = 'users';

function refreshAdminPanel() {
    document.getElementById('stat-users').textContent = getUsers().length;
    document.getElementById('stat-blogs').textContent = getBlogs().length;
    document.getElementById('stat-videos').textContent = getVideos().length;
    document.getElementById('stat-memes').textContent = getMemes().length;
    switchAdminTab(currentAdminTab);
}

function switchAdminTab(tab) {
    currentAdminTab = tab;

    var tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    if (tab === 'users' && tabs[0]) tabs[0].classList.add('active');
    else if (tab === 'content' && tabs[1]) tabs[1].classList.add('active');
    else if (tab === 'chat-mod' && tabs[2]) tabs[2].classList.add('active');

    document.getElementById('admin-users-panel').style.display = tab === 'users' ? '' : 'none';
    document.getElementById('admin-content-panel').style.display = tab === 'content' ? '' : 'none';
    document.getElementById('admin-chat-panel').style.display = tab === 'chat-mod' ? '' : 'none';

    if (tab === 'users') renderAdminUsers();
    else if (tab === 'content') renderAdminContent();
    else if (tab === 'chat-mod') renderAdminChat();
}

function renderAdminUsers() {
    var searchInput = document.getElementById('user-search');
    var searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
    var tbody = document.getElementById('admin-users-body');
    var users = getUsers();

    if (searchTerm) {
        users = users.filter(function(u) {
            return u.username.toLowerCase().indexOf(searchTerm) !== -1 ||
                (u.email && u.email.toLowerCase().indexOf(searchTerm) !== -1);
        });
    }

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;">No users found</td></tr>';
        return;
    }

    var houseEmoji = { gryffindor: '\u{1F981}', slytherin: '\u{1F40D}', ravenclaw: '\u{1F985}', hufflepuff: '\u{1F9A1}' };

    tbody.innerHTML = users.map(function(u) {
        var date = new Date(u.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        var roleClass = u.role === 'admin' ? 'badge-admin' : (u.status === 'banned' ? 'badge-banned' : 'badge-user');
        var roleName = u.role === 'admin' ? 'Admin' : (u.status === 'banned' ? 'Banned' : 'User');
        var isSelf = currentUser && currentUser.username === u.username;

        var actions = '';
        if (!isSelf && ADMIN_USERS.indexOf(u.username) === -1) {
            if (u.status === 'banned') {
                actions = '<button class="btn btn-outline btn-sm" onclick="unbanUser(\'' + escapeAttr(u.username) + '\')">Unban</button>';
            } else {
                actions = '<button class="btn btn-danger btn-sm" onclick="banUser(\'' + escapeAttr(u.username) + '\')">Ban</button>';
            }
            if (u.role !== 'admin') {
                actions += ' <button class="btn btn-outline btn-sm" onclick="promoteUser(\'' + escapeAttr(u.username) + '\')">Promote</button>';
            }
        } else if (isSelf) {
            actions = '<span style="color:var(--text-muted);font-size:0.8rem;">You</span>';
        }

        return '<tr>' +
            '<td><strong>' + escapeHtml(u.username) + '</strong></td>' +
            '<td>' + escapeHtml(u.email || '\u2014') + '</td>' +
            '<td>' + (houseEmoji[u.house] || '\u26A1') + ' ' + (u.house ? u.house.charAt(0).toUpperCase() + u.house.slice(1) : '\u2014') + '</td>' +
            '<td>' + date + '</td>' +
            '<td><span class="badge ' + roleClass + '">' + roleName + '</span></td>' +
            '<td class="actions-cell">' + actions + '</td>' +
        '</tr>';
    }).join('');
}

function banUser(username) {
    var users = getUsers();
    var user = users.find(function(u) { return u.username === username; });
    if (user) {
        user.status = 'banned';
        DB.set('users', users);
        renderAdminUsers();
        showToast(username + ' has been banned.', 'info');
    }
}

function unbanUser(username) {
    var users = getUsers();
    var user = users.find(function(u) { return u.username === username; });
    if (user) {
        user.status = 'active';
        DB.set('users', users);
        renderAdminUsers();
        showToast(username + ' has been unbanned.', 'success');
    }
}

function promoteUser(username) {
    var users = getUsers();
    var user = users.find(function(u) { return u.username === username; });
    if (user) {
        user.role = 'admin';
        DB.set('users', users);
        renderAdminUsers();
        showToast(username + ' promoted to admin.', 'success');
    }
}

function renderAdminContent() {
    var typeFilter = document.getElementById('content-type-filter').value;
    var tbody = document.getElementById('admin-content-body');
    var items = [];

    if (typeFilter === 'blogs') {
        items = getBlogs().map(function(b) {
            return { id: b.id, title: b.title, author: b.author, date: b.createdAt, likes: b.likes || 0, type: 'blog' };
        });
    } else if (typeFilter === 'videos') {
        items = getVideos().map(function(v) {
            return { id: v.id, title: v.title, author: v.author, date: v.createdAt, likes: v.views || 0, type: 'video' };
        });
    } else if (typeFilter === 'memes') {
        items = getMemes().map(function(m) {
            return { id: m.id, title: m.caption, author: m.author, date: m.createdAt, likes: m.likes || 0, type: 'meme' };
        });
    }

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">No content found</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(function(item) {
        var date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return '<tr>' +
            '<td><strong>' + escapeHtml(item.title) + '</strong></td>' +
            '<td>' + escapeHtml(item.author) + '</td>' +
            '<td>' + date + '</td>' +
            '<td>' + item.likes + '</td>' +
            '<td class="actions-cell">' +
                '<button class="btn btn-danger btn-sm" onclick="adminDeleteContent(\'' + item.type + '\', ' + item.id + ')">Delete</button>' +
            '</td>' +
        '</tr>';
    }).join('');
}

function adminDeleteContent(type, id) {
    showConfirm('Delete Content?', 'Are you sure you want to delete this ' + type + '?').then(function(confirmed) {
        if (!confirmed) return;

        if (type === 'blog') {
            DB.set('blogs', getBlogs().filter(function(b) { return b.id !== id; }));
            renderBlogs();
        } else if (type === 'video') {
            DB.set('videos', getVideos().filter(function(v) { return v.id !== id; }));
            renderVideos();
        } else if (type === 'meme') {
            DB.set('memes', getMemes().filter(function(m) { return m.id !== id; }));
            renderMemes();
        }

        renderAdminContent();
        refreshAdminPanel();
        showToast(type.charAt(0).toUpperCase() + type.slice(1) + ' deleted.', 'info');
    });
}

function renderAdminChat() {
    var room = document.getElementById('chat-room-filter').value;
    var chatList = document.getElementById('admin-chat-list');
    var messages = getChatMessages(room);

    if (messages.length === 0) {
        chatList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;">No messages in this room</p>';
        return;
    }

    chatList.innerHTML = messages.map(function(m) {
        var time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var initials = getAuthorInitials(m.author);
        return '<div class="admin-chat-item">' +
            '<div class="chat-avatar' + (m.anonymous ? ' anon' : '') + '">' + initials + '</div>' +
            '<div style="flex:1;">' +
                '<div class="chat-bubble-name' + (m.anonymous ? ' anon' : '') + '">' + escapeHtml(m.author) + ' <span style="color:var(--text-muted);font-size:0.72rem;">' + time + '</span></div>' +
                '<div class="chat-bubble-text">' + escapeHtml(m.text) + '</div>' +
            '</div>' +
            '<button class="delete-msg-btn" onclick="deleteMessage(\'' + room + '\', \'' + m.id + '\')" title="Delete message">\u2715</button>' +
        '</div>';
    }).join('');
}

function deleteMessage(room, msgId) {
    var messages = getChatMessages(room).filter(function(m) { return String(m.id) !== String(msgId); });
    DB.set('chat_' + room, messages);
    renderAdminChat();
    if (currentRoom === room) renderChatMessages();
}

function clearChatRoom() {
    var room = document.getElementById('chat-room-filter').value;
    var roomNames = { general: 'General', gryffindor: 'Gryffindor', slytherin: 'Slytherin', ravenclaw: 'Ravenclaw', hufflepuff: 'Hufflepuff' };
    showConfirm('Clear Chat Room?', 'All messages in "' + (roomNames[room] || room) + '" will be permanently deleted.').then(function(confirmed) {
        if (!confirmed) return;
        DB.set('chat_' + room, []);
        renderAdminChat();
        if (currentRoom === room) renderChatMessages();
        showToast((roomNames[room] || room) + ' chat cleared.', 'info');
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function markdownToHTML(md) {
    if (!md) return '';
    var html = escapeHtml(md);
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    return html;
}

// Close modals on overlay click (with video cleanup)
function closeAllModals() {
    var videoModal = document.getElementById('video-player-modal');
    if (videoModal.classList.contains('open')) closeVideoPlayer();
    document.querySelectorAll('.modal-overlay.open').forEach(function(m) { m.classList.remove('open'); });
}

document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
        if (e.target !== overlay) return;
        if (overlay.id === 'video-player-modal') { closeVideoPlayer(); return; }
        overlay.classList.remove('open');
    });
});

// Close modals on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAllModals();
});

// ==========================================
// SEED DATA
// ==========================================
function seedSampleData() {
    if (useFirebase && fbDB) {
        fbDB.ref('blogs').once('value', function(snap) {
            if (!snap.val() || (Array.isArray(snap.val()) && snap.val().length === 0)) {
                doSeed();
            }
        });
    } else {
        if (DB.get('seeded', false)) return;
        doSeed();
    }
}

function doSeed() {
    var sampleBlogs = [
        {
            id: 1,
            title: 'Why Severus Snape is the Most Complex Character in Fiction',
            category: 'character',
            cover: '',
            body: '## The Half-Blood Prince\n\nSnape remains one of the most debated characters in literary history. Was he truly a hero, or simply a man driven by guilt?\n\n> "After all this time?" "Always."\n\nHis journey from Death Eater to Dumbledore\'s most trusted spy is a masterclass in character development.\n\n**Key moments that define Snape:**\n- The Unbreakable Vow with Narcissa\n- His memories in the Pensieve\n- Protecting Harry while despising his resemblance to James\n\nWhat are your thoughts? Drop a comment below!',
            anonymous: false,
            author: 'Harsh Yadav',
            authorHouse: 'gryffindor',
            createdAt: Date.now() - 86400000 * 3,
            likes: 14,
            likedBy: [],
            comments: [
                { author: 'Luna Lovegood', text: 'Snape was brave, but also deeply flawed. That\'s what makes him human.', createdAt: Date.now() - 86400000 * 2 },
                { author: 'Anonymous Wizard', text: 'The "Always" scene still makes me cry every time.', createdAt: Date.now() - 86400000 }
            ]
        },
        {
            id: 2,
            title: 'Top 10 Spells Every Potterhead Should Know',
            category: 'general',
            cover: '',
            body: '## Essential Spells for Daily Wizard Life\n\nEver wished you could cast spells in real life? Here are the top 10:\n\n**1. Accio** - Summon anything from across the room\n**2. Lumos** - Never search for a flashlight again\n**3. Reparo** - Fix anything that breaks\n**4. Expecto Patronum** - Ward off negativity\n**5. Obliviate** - Selectively forget embarrassing moments\n**6. Alohomora** - Never get locked out\n**7. Wingardium Leviosa** - It\'s levi-OH-sa!\n**8. Protego** - Shield yourself from drama\n**9. Nox** - Perfect for sleeping\n**10. Riddikulus** - Turn fears into laughter\n\nWhich spell would you choose?',
            anonymous: false,
            author: 'The Sorting Hat',
            authorHouse: 'ravenclaw',
            createdAt: Date.now() - 86400000,
            likes: 8,
            likedBy: [],
            comments: []
        },
        {
            id: 3,
            title: 'Fan Theory: Was Dumbledore a Time Traveler?',
            category: 'theory',
            cover: '',
            body: '## A Wild Theory\n\nWhat if Dumbledore\'s seemingly all-knowing nature wasn\'t just wisdom \u2014 but actual knowledge of the future?\n\nConsider these clues:\n\n- He always seemed to know exactly what would happen\n- His possession of powerful magical artifacts\n- The Time-Turner existed at Hogwarts\n- His cryptic statements that only made sense later\n\n> "It does not do to dwell on dreams and forget to live."\n\nCould this be a warning from someone who\'s experienced the consequences of time travel firsthand?\n\n*This is just a fun theory \u2014 what do you think?*',
            anonymous: true,
            author: 'Anonymous Wizard',
            authorHouse: null,
            createdAt: Date.now() - 86400000 * 5,
            likes: 21,
            likedBy: [],
            comments: [
                { author: 'Hermione Granger', text: 'Interesting theory, but I think his knowledge came from his brilliant mind and the portraits of past headmasters.', createdAt: Date.now() - 86400000 * 4 }
            ]
        }
    ];

    var sampleChat = [
        { id: 1, text: 'Welcome to The Wizarding Hub! Feel free to chat about all things Harry Potter.', author: 'Dumbledore Bot', anonymous: false, house: 'gryffindor', timestamp: Date.now() - 3600000 * 2 },
        { id: 2, text: 'Just finished re-reading Prisoner of Azkaban. Still the best book in the series!', author: 'Harsh Yadav', anonymous: false, house: 'gryffindor', timestamp: Date.now() - 3600000 },
        { id: 3, text: 'Goblet of Fire fans unite! The Triwizard Tournament was peak HP', author: 'Anonymous Wizard', anonymous: true, house: null, timestamp: Date.now() - 1800000 }
    ];

    DB.set('blogs', sampleBlogs);
    DB.set('chat_general', sampleChat);
    DB.set('seeded', true);
}

// ==========================================
// SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(reg) {
                console.log('[PWA] Service Worker registered, scope:', reg.scope);
            })
            .catch(function(err) {
                console.log('[PWA] Service Worker registration failed:', err);
            });
    });
}

// PWA Install Prompt
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    const existing = document.getElementById('pwa-install-btn');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.className = 'nav-icon-btn';
    btn.title = 'Install App';
    btn.innerHTML = '📲';
    btn.style.cssText = 'font-size:1.2rem;cursor:pointer;';
    btn.addEventListener('click', async function() {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const result = await deferredInstallPrompt.userChoice;
        console.log('[PWA] Install prompt result:', result.outcome);
        deferredInstallPrompt = null;
        btn.remove();
    });

    const navActions = document.querySelector('.nav-actions');
    if (navActions) navActions.prepend(btn);
}

window.addEventListener('appinstalled', function() {
    console.log('[PWA] App installed successfully');
    deferredInstallPrompt = null;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
    showToast('App installed successfully! ⚡', 'success');
});

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    seedSampleData();
    updateAuthUI();
    renderBlogs();
    renderVideos();
    renderMemes();
    renderChatMessages();
    startChatPolling();
    setupFirebaseListeners();

    if (useFirebase) {
        console.log('The Wizarding Hub is running with Firebase - data syncs across all visitors in real-time!');
    } else {
        console.log('The Wizarding Hub is running in local mode. To enable shared data, configure Firebase in script.js');
    }
});
