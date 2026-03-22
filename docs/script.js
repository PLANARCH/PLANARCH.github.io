let mdCache = {};
let allData = [];
let currentPath = ""; 
const VERSION = Date.now();
const THEME_KEY = 'archive-theme';

const sidebar = document.getElementById('sidebar');
const contentGrid = document.getElementById('content-grid');
const breadcrumb = document.getElementById('breadcrumb');
const viewer = document.getElementById('viewer');
const mdContent = document.getElementById('md-content');
const searchInput = document.getElementById('search');

// --- 테마 ---
function applyTheme(theme) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    const btn = document.getElementById("dark_mode");
    if (btn) btn.textContent = theme === 'dark' ? "🌓" : "🌗";
}

function toggleTheme() {
    const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}

// --- 데이터 로드 ---
fetch(`data.json?v=${VERSION}`)
    .then(r => r.json())
    .then(data => {
        allData = data;
        renderSidebar(data);
        renderFolders("");
    });

// --- 폴더 렌더 ---
function renderFolders(path = "") {
    currentPath = path;
    contentGrid.innerHTML = '';

    const subFolders = new Set();
    const filesInCurrent = [];

    allData.forEach(item => {
        const itemPath = item.path;

        if (path === "") {
            const parts = itemPath.split('/');
            if (parts.length > 1) subFolders.add(parts[0]);
            else filesInCurrent.push(item);
        } else if (itemPath.startsWith(path + '/')) {
            const relative = itemPath.substring(path.length + 1);
            const parts = relative.split('/');
            if (parts.length > 1) subFolders.add(parts[0]);
            else filesInCurrent.push(item);
        }
    });

    subFolders.forEach(folderName => {
        const fullNextPath = path ? `${path}/${folderName}` : folderName;
        const card = document.createElement('div');
        card.className = 'card folder-item';
        card.innerHTML = `<div class="icon">📁</div><strong>${folderName}</strong>`;
        card.onclick = () => renderFolders(fullNextPath);
        contentGrid.appendChild(card);
    });

    filesInCurrent.forEach(file => {
        const card = document.createElement('div');
        card.className = 'card file-item';
        card.innerHTML = `
            <div class="icon">📄</div>
            <strong>${file.title}</strong>
            <small class="preview">${file.summary || ''}</small>
        `;
        card.onclick = () => openMarkdown(file.path);
        contentGrid.appendChild(card);
    });
}

// --- 사이드바 ---
function renderSidebar(data) {
    sidebar.innerHTML = "<h3 style='padding:10px 0;'>Archive Tree</h3>";
}

// --- 마크다운 ---
async function openMarkdown(path) {
    const item = allData.find(d => d.path === path);

    let md = mdCache[path] || await fetch(path).then(r => r.text());
    mdCache[path] = md;

    mdContent.innerHTML = marked.parse(md);
    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMarkdown() {
    viewer.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// --- 사이드바 제어 ---
function openSidebar() {
    sidebar.classList.add('active');
    document.querySelector('.overlay').classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    document.querySelector('.overlay').classList.remove('active');
}

function toggleSidebar(e) {
    if (e) e.stopPropagation();
    if (sidebar.classList.contains('active')) closeSidebar();
    else openSidebar();
}

function closeAllPanels() {
    closeSidebar();
}

// ============================
// 🔥 스와이프 (완성 버전)
// ============================

let swipe = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0
};

const EDGE = 30;
const THRESHOLD = 70;

document.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];

    // 왼쪽 엣지 or 이미 열린 상태
    if (t.clientX < EDGE || sidebar.classList.contains('active')) {
        swipe.active = true;
        swipe.startX = t.clientX;
        swipe.startY = t.clientY;
        swipe.currentX = t.clientX;
    }
});

document.addEventListener('touchmove', (e) => {
    if (!swipe.active) return;
    const t = e.changedTouches[0];

    // 수직 스크롤 무시
    if (Math.abs(t.clientY - swipe.startY) > 100) {
        swipe.active = false;
        return;
    }

    swipe.currentX = t.clientX;
});

document.addEventListener('touchend', () => {
    if (!swipe.active) return;

    const delta = swipe.currentX - swipe.startX;

    // 👉 열기
    if (!sidebar.classList.contains('active') && swipe.startX < EDGE && delta > THRESHOLD) {
        openSidebar();
    }

    // 👉 닫기
    if (sidebar.classList.contains('active') && delta < -THRESHOLD) {
        closeSidebar();
    }

    swipe.active = false;
});

// --- 초기 테마 적용 ---
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');