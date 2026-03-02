/* ============================================
   THE WIZARDING HUB — Main JavaScript
   ============================================ */

// ==========================================
// DATA LAYER (localStorage persistence)
// ==========================================
const DB = {
    get(key, fallback = []) {
        try {
            const data = localStorage.getItem('wh_' + key);
            return data ? JSON.parse(data) : fallback;
        } catch { return fallback; }
    },
    set(key, value) {
        localStorage.setItem('wh_' + key, JSON.stringify(value));
    }
};

// ==========================================
// AUTH SYSTEM
// ==========================================
let currentUser = DB.get('currentUser', null);

function getUsers() { return DB.get('users', []); }

function openAuthModal() {
    document.getElementById('auth-modal').classList.add('open');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
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
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const house = document.getElementById('reg-house').value;
    const password = document.getElementById('reg-password').value;

    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        showToast('Username already taken!', 'error');
        return;
    }

    const user = { username, email, house, password, joinedAt: Date.now() };
    users.push(user);
    DB.set('users', users);

    currentUser = { username, house, email };
    DB.set('currentUser', currentUser);

    closeAuthModal();
    updateAuthUI();
    showToast(`Welcome to the Order, ${username}! ⚡`, 'success');
    document.getElementById('register-form').reset();
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        showToast('Invalid credentials! Try again.', 'error');
        return;
    }

    currentUser = { username: user.username, house: user.house, email: user.email };
    DB.set('currentUser', currentUser);

    closeAuthModal();
    updateAuthUI();
    showToast(`Welcome back, ${user.username}! 🧙`, 'success');
    document.getElementById('login-form').reset();
}

function logout() {
    currentUser = null;
    DB.set('currentUser', null);
    updateAuthUI();
    showToast('Logged out. Mischief managed! 🗺️', 'info');
}

function updateAuthUI() {
    const authBtn = document.getElementById('auth-btn');
    if (currentUser) {
        const houseEmoji = { gryffindor: '🦁', slytherin: '🐍', ravenclaw: '🦅', hufflepuff: '🦡' };
        authBtn.innerHTML = `${houseEmoji[currentUser.house] || '⚡'} ${currentUser.username}`;
        authBtn.onclick = () => {
            if (confirm('Sign out?')) logout();
        };
    } else {
        authBtn.textContent = 'Sign In';
        authBtn.onclick = openAuthModal;
    }
}

function getAuthorName(isAnonymous) {
    if (isAnonymous) return 'Anonymous Wizard';
    return currentUser ? currentUser.username : 'Guest Muggle';
}

function getAuthorInitials(name) {
    if (name === 'Anonymous Wizard') return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(sectionId) {
    // Update sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active-section');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.section === sectionId);
    });

    // Show/hide footer
    const footer = document.getElementById('site-footer');
    footer.classList.toggle('visible', sectionId !== 'hero');

    // Close mobile menu
    document.getElementById('nav-links').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.section);
    });
});

// Logo click
document.querySelector('.nav-logo').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('hero');
});

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('hamburger').classList.toggle('open');
    document.getElementById('nav-links').classList.toggle('open');
});

// Nav scroll effect
window.addEventListener('scroll', () => {
    document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 20);
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ==========================================
// MUSIC CONTROLLER
// ==========================================
const musicToggle = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
let isPlaying = false;

function tryPlayMusic() {
    if (!isPlaying) {
        bgMusic.volume = 0.3;
        bgMusic.play().then(() => {
            musicToggle.textContent = '🔊';
            isPlaying = true;
        }).catch(() => {});
    }
}

document.addEventListener('click', tryPlayMusic, { once: true });
document.addEventListener('touchstart', tryPlayMusic, { once: true });

musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPlaying) {
        bgMusic.pause();
        musicToggle.textContent = '🔇';
        isPlaying = false;
    } else {
        bgMusic.volume = 0.3;
        bgMusic.play().then(() => {
            musicToggle.textContent = '🔊';
            isPlaying = true;
        }).catch(() => showToast('Could not play audio', 'error'));
    }
});

// ==========================================
// SNOW EFFECT
// ==========================================
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Snowflake {
    constructor() { this.reset(true); }
    reset(init = false) {
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : -5;
        this.radius = Math.random() * 2.5 + 0.5;
        this.speed = Math.random() * 1 + 0.3;
        this.wind = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.6 + 0.3;
    }
    update() {
        this.y += this.speed;
        this.x += this.wind + Math.sin(this.y * 0.01) * 0.3;
        if (this.y > canvas.height || this.x < -10 || this.x > canvas.width + 10) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
    }
}

const snowflakes = Array.from({ length: 120 }, () => new Snowflake());

function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snowflakes.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animateSnow);
}
animateSnow();

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
    const textarea = document.getElementById('blog-body');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let replacement = '';

    switch (type) {
        case 'bold': replacement = `**${selected || 'bold text'}**`; break;
        case 'italic': replacement = `*${selected || 'italic text'}*`; break;
        case 'heading': replacement = `\n## ${selected || 'Heading'}\n`; break;
        case 'quote': replacement = `\n> ${selected || 'quote'}\n`; break;
        case 'list': replacement = `\n- ${selected || 'list item'}\n`; break;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
}

function submitBlog(e) {
    e.preventDefault();

    const blog = {
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

    const blogs = getBlogs();
    blogs.unshift(blog);
    DB.set('blogs', blogs);

    closeBlogEditor();
    renderBlogs();
    showToast('Blog post published! 📜', 'success');
}

function renderBlogs(filter = 'all') {
    const grid = document.getElementById('blog-grid');
    const empty = document.getElementById('blogs-empty');
    let blogs = getBlogs();

    if (filter !== 'all') blogs = blogs.filter(b => b.category === filter);

    if (blogs.length === 0) {
        grid.innerHTML = '';
        empty.classList.add('visible');
        return;
    }

    empty.classList.remove('visible');
    const categoryLabels = { theory: 'Fan Theory', review: 'Review', character: 'Character', general: 'General' };
    const categoryIcons = { theory: '🔮', review: '📖', character: '🧙', general: '✨' };

    grid.innerHTML = blogs.map(blog => {
        const excerpt = blog.body.replace(/[#*>\-]/g, '').substring(0, 140) + '...';
        const date = new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const coverHTML = blog.cover
            ? `<div class="blog-card-cover"><img src="${escapeHtml(blog.cover)}" alt="" onerror="this.parentElement.innerHTML='${categoryIcons[blog.category] || '📜'}'"></div>`
            : `<div class="blog-card-cover">${categoryIcons[blog.category] || '📜'}</div>`;

        return `
            <article class="blog-card" onclick="openBlogDetail(${blog.id})">
                ${coverHTML}
                <div class="blog-card-body">
                    <span class="blog-card-category">${categoryLabels[blog.category] || blog.category}</span>
                    <h3 class="blog-card-title">${escapeHtml(blog.title)}</h3>
                    <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>
                    <div class="blog-card-meta">
                        <span class="blog-card-author">${blog.anonymous ? '🎭' : '🧙'} ${escapeHtml(blog.author)}</span>
                        <div class="blog-card-stats">
                            <span class="stat-item" onclick="event.stopPropagation(); likeBlog(${blog.id})">
                                ❤️ ${blog.likes}
                            </span>
                            <span>💬 ${blog.comments.length}</span>
                            <span>${date}</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function filterBlogs(filter) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
    renderBlogs(filter);
}

function likeBlog(id) {
    const blogs = getBlogs();
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    const userId = currentUser ? currentUser.username : 'guest_' + navigator.userAgent.slice(0, 20);
    if (blog.likedBy.includes(userId)) {
        blog.likes--;
        blog.likedBy = blog.likedBy.filter(u => u !== userId);
    } else {
        blog.likes++;
        blog.likedBy.push(userId);
    }
    DB.set('blogs', blogs);
    renderBlogs();
}

function openBlogDetail(id) {
    const blogs = getBlogs();
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    const date = new Date(blog.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const categoryLabels = { theory: 'Fan Theory', review: 'Review', character: 'Character Analysis', general: 'General' };
    const bodyHTML = markdownToHTML(blog.body);

    const commentsHTML = blog.comments.map(c => `
        <div class="comment-item">
            <div class="comment-avatar">${getAuthorInitials(c.author)}</div>
            <div class="comment-content">
                <div class="comment-author">${escapeHtml(c.author)}</div>
                <div class="comment-text">${escapeHtml(c.text)}</div>
                <div class="comment-time">${new Date(c.createdAt).toLocaleString()}</div>
            </div>
        </div>
    `).join('');

    document.getElementById('blog-detail-content').innerHTML = `
        <div class="blog-detail-header">
            <span class="blog-detail-category">${categoryLabels[blog.category] || blog.category}</span>
            <h2 class="blog-detail-title">${escapeHtml(blog.title)}</h2>
            <div class="blog-detail-meta">
                <span>${blog.anonymous ? '🎭' : '🧙'} ${escapeHtml(blog.author)}</span>
                <span>📅 ${date}</span>
                <span>❤️ ${blog.likes} likes</span>
            </div>
        </div>
        ${blog.cover ? `<img src="${escapeHtml(blog.cover)}" class="blog-detail-cover" alt="" onerror="this.style.display='none'">` : ''}
        <div class="blog-detail-body">${bodyHTML}</div>
        <div class="blog-detail-actions">
            <button class="btn btn-outline btn-sm" onclick="likeBlog(${blog.id}); openBlogDetail(${blog.id});">❤️ Like (${blog.likes})</button>
            <button class="btn btn-outline btn-sm" onclick="shareBlog(${blog.id})">📤 Share</button>
        </div>
        <div class="blog-comments">
            <h4>💬 Comments (${blog.comments.length})</h4>
            <form class="comment-form" onsubmit="addComment(event, ${blog.id})">
                <input type="text" placeholder="Write a comment..." id="comment-input-${blog.id}" required>
                <button type="submit" class="btn btn-gold btn-sm">Post</button>
            </form>
            ${commentsHTML || '<p style="color:var(--text-muted);font-size:0.9rem;">No comments yet. Be the first!</p>'}
        </div>
    `;

    document.getElementById('blog-detail-modal').classList.add('open');
}

function closeBlogDetail() {
    document.getElementById('blog-detail-modal').classList.remove('open');
}

function addComment(e, blogId) {
    e.preventDefault();
    const input = document.getElementById('comment-input-' + blogId);
    const text = input.value.trim();
    if (!text) return;

    const blogs = getBlogs();
    const blog = blogs.find(b => b.id === blogId);
    if (!blog) return;

    blog.comments.push({
        author: getAuthorName(false),
        text,
        createdAt: Date.now()
    });

    DB.set('blogs', blogs);
    openBlogDetail(blogId);
    renderBlogs();
    showToast('Comment added!', 'success');
}

function shareBlog(id) {
    const text = `Check out this post on The Wizarding Hub!`;
    if (navigator.share) {
        navigator.share({ title: 'The Wizarding Hub', text, url: window.location.href });
    } else {
        navigator.clipboard.writeText(text + ' ' + window.location.href);
        showToast('Link copied to clipboard! 📋', 'success');
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

    const video = {
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

    const videos = getVideos();
    videos.unshift(video);
    DB.set('videos', videos);

    closeVideoUploader();
    renderVideos();
    showToast('Video uploaded! 🎬', 'success');
}

function getYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
}

function getYouTubeThumb(url) {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function renderVideos() {
    const grid = document.getElementById('video-grid');
    const empty = document.getElementById('videos-empty');
    const videos = getVideos();

    if (videos.length === 0) {
        grid.innerHTML = '';
        empty.classList.add('visible');
        return;
    }

    empty.classList.remove('visible');

    grid.innerHTML = videos.map(v => {
        const thumb = v.thumbnail || getYouTubeThumb(v.url) || '';
        const date = new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const thumbContent = thumb
            ? `<img src="${escapeHtml(thumb)}" alt="" onerror="this.style.display='none'">`
            : '';

        return `
            <div class="video-card" onclick="openVideoPlayer(${v.id})">
                <div class="video-card-thumb">
                    ${thumbContent}
                    <div class="video-play-btn">▶</div>
                </div>
                <div class="video-card-body">
                    <h3 class="video-card-title">${escapeHtml(v.title)}</h3>
                    <p class="video-card-desc">${escapeHtml(v.description || '')}</p>
                    <div class="video-card-meta">
                        <span>${v.anonymous ? '🎭' : '🧙'} ${escapeHtml(v.author)}</span>
                        <span>${date} · ${v.views} views</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openVideoPlayer(id) {
    const videos = getVideos();
    const video = videos.find(v => v.id === id);
    if (!video) return;

    // Increment views
    video.views++;
    DB.set('videos', videos);
    renderVideos();

    const ytId = getYouTubeId(video.url);
    let playerHTML;
    if (ytId) {
        playerHTML = `<div class="video-player-wrapper"><iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" allowfullscreen allow="autoplay"></iframe></div>`;
    } else {
        playerHTML = `<div class="video-player-wrapper"><video src="${escapeHtml(video.url)}" controls autoplay></video></div>`;
    }

    document.getElementById('video-player-content').innerHTML = `
        ${playerHTML}
        <h3 class="video-detail-title">${escapeHtml(video.title)}</h3>
        <p class="video-detail-desc">${escapeHtml(video.description || '')}</p>
        <div class="video-detail-meta">
            <span>${video.anonymous ? '🎭' : '🧙'} ${escapeHtml(video.author)}</span> ·
            <span>${video.views} views</span> ·
            <span>${new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
    `;

    document.getElementById('video-player-modal').classList.add('open');
}

function closeVideoPlayer() {
    document.getElementById('video-player-modal').classList.remove('open');
    document.getElementById('video-player-content').innerHTML = '';
}

// ==========================================
// MEME SYSTEM
// ==========================================
function getMemes() { return DB.get('memes', []); }
let currentMemeData = null;

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

// Meme image upload handling
const memeUploadArea = document.getElementById('meme-upload-area');
const memeFileInput = document.getElementById('meme-file');
const memePreview = document.getElementById('meme-preview');
const memeUploadPlaceholder = document.getElementById('meme-upload-placeholder');

memeUploadArea.addEventListener('click', () => memeFileInput.click());

memeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    memeUploadArea.classList.add('dragover');
});
memeUploadArea.addEventListener('dragleave', () => memeUploadArea.classList.remove('dragover'));
memeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    memeUploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processImageFile(file);
});

memeFileInput.addEventListener('change', () => {
    const file = memeFileInput.files[0];
    if (file) processImageFile(file);
});

function processImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        currentMemeData = e.target.result;
        memePreview.src = currentMemeData;
        memePreview.style.display = 'block';
        memeUploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function submitMeme(e) {
    e.preventDefault();

    const imageUrl = document.getElementById('meme-url').value.trim();
    const imageData = currentMemeData || imageUrl;

    if (!imageData) {
        showToast('Please upload or link an image!', 'error');
        return;
    }

    const tagsRaw = document.getElementById('meme-tags').value.trim();
    const meme = {
        id: Date.now(),
        caption: document.getElementById('meme-caption').value.trim(),
        image: imageData,
        tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
        anonymous: document.getElementById('meme-anonymous').checked,
        author: getAuthorName(document.getElementById('meme-anonymous').checked),
        createdAt: Date.now(),
        likes: 0,
        likedBy: []
    };

    const memes = getMemes();
    memes.unshift(meme);
    DB.set('memes', memes);

    closeMemeUploader();
    renderMemes();
    showToast('Meme posted! 😂', 'success');
}

function renderMemes() {
    const grid = document.getElementById('meme-grid');
    const empty = document.getElementById('memes-empty');
    const memes = getMemes();

    if (memes.length === 0) {
        grid.innerHTML = '';
        empty.classList.add('visible');
        return;
    }

    empty.classList.remove('visible');

    grid.innerHTML = memes.map(m => {
        const date = new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const tagsHTML = m.tags.map(t => `<span class="meme-tag">#${escapeHtml(t)}</span>`).join('');

        return `
            <div class="meme-card">
                <img src="${escapeHtml(m.image)}" alt="${escapeHtml(m.caption)}" class="meme-card-img" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 150%22><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>Image Error</text></svg>'">
                <div class="meme-card-body">
                    <p class="meme-card-caption">${escapeHtml(m.caption)}</p>
                    ${tagsHTML ? `<div class="meme-card-tags">${tagsHTML}</div>` : ''}
                    <div class="meme-card-meta">
                        <span>${m.anonymous ? '🎭' : '🧙'} ${escapeHtml(m.author)}</span>
                        <div>
                            <span class="stat-item" onclick="likeMeme(${m.id})">❤️ ${m.likes}</span>
                            · ${date}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function likeMeme(id) {
    const memes = getMemes();
    const meme = memes.find(m => m.id === id);
    if (!meme) return;

    const userId = currentUser ? currentUser.username : 'guest_' + navigator.userAgent.slice(0, 20);
    if (meme.likedBy.includes(userId)) {
        meme.likes--;
        meme.likedBy = meme.likedBy.filter(u => u !== userId);
    } else {
        meme.likes++;
        meme.likedBy.push(userId);
    }
    DB.set('memes', memes);
    renderMemes();
}

// ==========================================
// LIVE CHAT SYSTEM
// ==========================================
let currentRoom = 'general';

function getChatMessages(room) { return DB.get('chat_' + room, []); }

function switchRoom(room) {
    currentRoom = room;
    document.querySelectorAll('.chat-room').forEach(r => r.classList.toggle('active', r.dataset.room === room));
    renderChatMessages();
}

function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const isAnonymous = document.getElementById('chat-anonymous').checked;

    const message = {
        id: Date.now(),
        text,
        author: getAuthorName(isAnonymous),
        anonymous: isAnonymous,
        house: currentUser ? currentUser.house : null,
        timestamp: Date.now()
    };

    const messages = getChatMessages(currentRoom);
    messages.push(message);
    // Keep last 200 messages per room
    if (messages.length > 200) messages.splice(0, messages.length - 200);
    DB.set('chat_' + currentRoom, messages);

    input.value = '';
    renderChatMessages();
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    const messages = getChatMessages(currentRoom);

    if (messages.length === 0) {
        const roomNames = { general: 'The Great Hall', gryffindor: 'Gryffindor Common Room', slytherin: 'Slytherin Dungeon', ravenclaw: 'Ravenclaw Tower', hufflepuff: 'Hufflepuff Basement' };
        container.innerHTML = `<div class="chat-system-msg">Welcome to ${roomNames[currentRoom] || currentRoom}! Be the first to send a message. ✨</div>`;
        return;
    }

    container.innerHTML = messages.map(m => {
        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const initials = getAuthorInitials(m.author);
        const avatarClass = m.anonymous ? 'chat-avatar anon' : 'chat-avatar';
        const nameClass = m.anonymous ? 'chat-bubble-name anon' : 'chat-bubble-name';

        return `
            <div class="chat-message">
                <div class="${avatarClass}">${initials}</div>
                <div class="chat-bubble">
                    <div class="${nameClass}">${escapeHtml(m.author)}</div>
                    <div class="chat-bubble-text">${escapeHtml(m.text)}</div>
                    <div class="chat-bubble-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Poll for new messages every 2 seconds (simulates real-time)
setInterval(() => {
    const chatSection = document.getElementById('chat');
    if (chatSection.classList.contains('active-section')) {
        renderChatMessages();
    }
}, 2000);

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function markdownToHTML(md) {
    if (!md) return '';
    let html = escapeHtml(md);
    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold & italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    return html;
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
});

// ==========================================
// SEED DATA (first-time visitors get sample content)
// ==========================================
function seedSampleData() {
    if (DB.get('seeded', false)) return;

    const sampleBlogs = [
        {
            id: 1,
            title: 'Why Severus Snape is the Most Complex Character in Fiction',
            category: 'character',
            cover: '',
            body: '## The Half-Blood Prince\n\nSnape remains one of the most debated characters in literary history. Was he truly a hero, or simply a man driven by guilt?\n\n> "After all this time?" "Always."\n\nHis journey from Death Eater to Dumbledore\'s most trusted spy is a masterclass in character development. Every re-read reveals new layers of his sacrifice.\n\n**Key moments that define Snape:**\n- The Unbreakable Vow with Narcissa\n- His memories in the Pensieve\n- Protecting Harry while despising his resemblance to James\n\nWhat are your thoughts? Drop a comment below!',
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
            body: '## Essential Spells for Daily Wizard Life\n\nEver wished you could cast spells in real life? Here are the top 10 we\'d all love to use:\n\n**1. Accio** - Summon anything from across the room\n**2. Lumos** - Never search for a flashlight again\n**3. Reparo** - Fix anything that breaks\n**4. Expecto Patronum** - Ward off negativity\n**5. Obliviate** - Selectively forget embarrassing moments\n**6. Alohomora** - Never get locked out\n**7. Wingardium Leviosa** - It\'s levi-OH-sa!\n**8. Protego** - Shield yourself from drama\n**9. Nox** - Perfect for sleeping\n**10. Riddikulus** - Turn fears into laughter\n\nWhich spell would you choose? Let us know!',
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
            body: '## A Wild Theory\n\nWhat if Dumbledore\'s seemingly all-knowing nature wasn\'t just wisdom — but actual knowledge of the future?\n\nConsider these clues:\n\n- He always seemed to know exactly what would happen\n- His possession of powerful magical artifacts\n- The Time-Turner existed at Hogwarts\n- His cryptic statements that only made sense later\n\n> "It does not do to dwell on dreams and forget to live."\n\nCould this be a warning from someone who\'s experienced the consequences of time travel firsthand?\n\n*This is just a fun theory — what do you think?*',
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

    const sampleChat = [
        { id: 1, text: 'Welcome to The Wizarding Hub! ⚡ Feel free to chat about all things Harry Potter.', author: 'Dumbledore Bot', anonymous: false, house: 'gryffindor', timestamp: Date.now() - 3600000 * 2 },
        { id: 2, text: 'Just finished re-reading Prisoner of Azkaban. Still the best book in the series!', author: 'Harsh Yadav', anonymous: false, house: 'gryffindor', timestamp: Date.now() - 3600000 },
        { id: 3, text: 'Goblet of Fire fans unite! The Triwizard Tournament was peak HP', author: 'Anonymous Wizard', anonymous: true, house: null, timestamp: Date.now() - 1800000 },
    ];

    DB.set('blogs', sampleBlogs);
    DB.set('chat_general', sampleChat);
    DB.set('seeded', true);
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    seedSampleData();
    updateAuthUI();
    renderBlogs();
    renderVideos();
    renderMemes();
    renderChatMessages();
});
