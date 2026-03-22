/**
 * Archive Project - Integrated Script
 */

// --- 1. 상수 및 상태 관리 ---
const VERSION = Date.now();
const THEME_KEY = 'archive-theme';
const EDGE_MARGIN = 30;      // 엣지 감지 영역 (px)
const SWIPE_THRESHOLD = 70;  // 스와이프 인정 거리 (px)
const MAX_VERTICAL = 120;    // 수직 이동 허용치 (px)

let mdCache = {};
let allData = [];
let currentPath = ""; 

// 스와이프 및 포인터 상태
let swipe = { active: false, startX: 0, startY: 0, currentX: 0 };
let pointerState = { down: false, startX: 0, startY: 0 };

// DOM 요소
const sidebar = document.getElementById('sidebar');
const contentGrid = document.getElementById('content-grid');
const breadcrumb = document.getElementById('breadcrumb');
const viewer = document.getElementById('viewer');
const mdContent = document.getElementById('md-content');
const searchInput = document.getElementById('search');
const overlay = document.querySelector('.overlay');

// --- 2. 초기화 및 테마 ---
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

// 데이터 로드
fetch(`data.json?v=${VERSION}`)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
        allData = data;
        renderSidebar(data);
        handleInitialRoute();
    })
    .catch(err => {
        contentGrid.innerHTML = `<div style="text-align:center; padding:50px;"><h3>데이터 로드 실패</h3><p>${err}</p></div>`;
    });

// 라우팅 제어
async function handleInitialRoute() {
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file');
    const folder = params.get('folder');

    history.replaceState({view: 'root'}, "", window.location.pathname);

    if (file) {
        const folderPath = file.substring(0, file.lastIndexOf('/'));
        renderFolders(folderPath, false);
        openMarkdown(file, true);
    } else if (folder) {
        renderFolders(folder);
    } else {
        renderFolders("");
    }
}

// --- 3. 핵심 렌더링 기능 (그리드 & 트리) ---

// 컨텐츠 그리드 렌더링
function renderFolders(path = "", pushHistory = true) {
    currentPath = path;
    if (pushHistory) {
        const url = path ? `?folder=${encodeURIComponent(path)}` : window.location.pathname;
        history.pushState({view: 'folder', cat: path}, "", url);
    }

    breadcrumb.style.display = path ? 'block' : 'none';
    breadcrumb.innerHTML = path ? `<span>← 상위 폴더로</span> <small style="opacity:0.6">(${path})</small>` : '';
    breadcrumb.onclick = () => {
        const parts = path.split('/');
        parts.pop();
        renderFolders(parts.join('/'));
    };

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
        card.innerHTML = `<div class="icon">📄</div><strong>${file.title}</strong><small class="preview">${file.summary || ''}</small>`;
        card.onclick = () => openMarkdown(file.path);
        contentGrid.appendChild(card);
    });
}

// 사이드바 트리 구축
function renderSidebar(data) {
    sidebar.innerHTML = "<h3 style='padding:10px 0;'>Archive Tree</h3>";
    const tree = {};
    data.forEach(item => {
        const parts = item.path.split('/');
        let current = tree;
        parts.forEach((part, idx) => {
            if (idx === parts.length - 1) current[part] = item;
            else {
                current[part] = current[part] || {};
                current = current[part];
            }
        });
    });
    const rootUl = document.createElement('ul');
    rootUl.className = 'tree-root';
    buildTreeUI(tree, rootUl);
    sidebar.appendChild(rootUl);
}

function buildTreeUI(obj, parentElement, pathAccumulator = "") {
    Object.keys(obj).sort().forEach(key => {
        const val = obj[key];
        const fullPath = pathAccumulator ? `${pathAccumulator}/${key}` : key;
        const li = document.createElement('li');

        if (val.path) {
            li.innerHTML = `<span class="tree-file">📄 ${val.title}</span>`;
            li.onclick = (e) => { e.stopPropagation(); openMarkdown(val.path); closeSidebar(); };
        } else {
            li.innerHTML = `<span class="tree-folder">📁 ${key}</span>`;
            const subUl = document.createElement('ul');
            subUl.className = 'tree-sub';
            li.onclick = (e) => {
                e.stopPropagation();
                const folderSpan = li.querySelector('.tree-folder');
                subUl.classList.toggle('open');
                folderSpan.classList.toggle('open');
                renderFolders(fullPath); 
            };
            buildTreeUI(val, subUl, fullPath);
            li.appendChild(subUl);
        }
        parentElement.appendChild(li);
    });
}

// --- 4. 마크다운 뷰어 ---
async function openMarkdown(path, pushHistory = true) {
    const item = allData.find(d => d.path === path);
    document.getElementById('viewer-title').textContent = item ? item.title : path;

    try {
        let md = mdCache[path] || await fetch(`${path}?v=${VERSION}`).then(r => r.text());
        mdCache[path] = md;

        const folder = path.substring(0, path.lastIndexOf('/'));
        let processedMd = md.replace(/!\[(.*?)\]\((?!http|\/)(.*?)\)/g, (m, alt, src) => {
            const fixedPath = folder ? `${folder}/${src}?v=${VERSION}` : `${src}?v=${VERSION}`;
            return `![${alt}](${fixedPath})`;
        });

        processedMd = processedMd.replace(/^(#{1,6})([^#\s\d])/gm, '$1 $2');
        mdContent.innerHTML = marked.parse(processedMd);

        document.body.classList.add('viewer-open');
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (window.hljs) document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

        if (pushHistory) {
            history.pushState({view: 'file', path: path}, "", `?file=${encodeURIComponent(path)}`);
        }
    } catch (e) {
        mdContent.innerHTML = "<p>문서를 불러오지 못했습니다.</p>";
    }
}

function closeMarkdown() {
    document.body.classList.remove('viewer-open'); 
    if (new URLSearchParams(window.location.search).get('file')) {
        history.back();
    } else {
        viewer.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// --- 5. 검색 및 유틸리티 ---
searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    if (!term) return renderFolders(currentPath, false);

    contentGrid.innerHTML = '';
    const filtered = allData.filter(i => 
        i.title.toLowerCase().includes(term) || i.path.toLowerCase().includes(term)
    );

    filtered.forEach(file => {
        const card = document.createElement('div');
        card.className = 'card file-item';
        card.innerHTML = `<div class="icon">📄</div><strong>${file.title}</strong><br><small>${file.path}</small>`;
        card.onclick = () => openMarkdown(file.path);
        contentGrid.appendChild(card);
    });
};

function openSidebar() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

function toggleSidebar(e) {
    if (e) e.stopPropagation();
    if (sidebar.classList.contains('active')) closeSidebar();
    else openSidebar();
}

function copyLink() {
    const btn = document.getElementById('copy-btn');
    navigator.clipboard.writeText(window.location.href).then(() => {
        const originalText = btn.textContent;
        btn.textContent = "✅ 복사됨!";
        btn.style.background = "#2ea44f";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "var(--primary)";
        }, 2000);
    });
}

// --- 6. 이벤트 리스너 (스와이프 & 포인터) ---

// 터치 이벤트 (스와이프)
document.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (t.clientX <= EDGE_MARGIN || sidebar.classList.contains('active')) {
        swipe.active = true;
        swipe.startX = t.clientX;
        swipe.startY = t.clientY;
        swipe.currentX = t.clientX;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!swipe.active) return;
    const t = e.changedTouches[0];
    if (Math.abs(t.clientY - swipe.startY) > MAX_VERTICAL) {
        swipe.active = false;
        return;
    }
    swipe.currentX = t.clientX;
}, { passive: true });

document.addEventListener('touchend', () => {
    if (!swipe.active) return;
    const delta = swipe.currentX - swipe.startX;
    if (!sidebar.classList.contains('active') && swipe.startX <= EDGE_MARGIN && delta > SWIPE_THRESHOLD) openSidebar();
    if (sidebar.classList.contains('active') && delta < -SWIPE_THRESHOLD) closeSidebar();
    swipe.active = false;
}, { passive: true });

// 마우스 포인터 (데스크탑 보조)
document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.clientX <= EDGE_MARGIN || sidebar.classList.contains('active')) {
        pointerState.down = true;
        pointerState.startX = e.clientX;
        pointerState.startY = e.clientY;
    }
});

document.addEventListener('pointermove', (e) => {
    if (!pointerState.down) return;
    if (Math.abs(e.clientY - pointerState.startY) > MAX_VERTICAL) pointerState.down = false;
});

document.addEventListener('pointerup', (e) => {
    if (!pointerState.down) return;
    const deltaX = e.clientX - pointerState.startX;
    if (!sidebar.classList.contains('active') && pointerState.startX <= EDGE_MARGIN && deltaX > SWIPE_THRESHOLD) openSidebar();
    if (sidebar.classList.contains('active') && deltaX < -SWIPE_THRESHOLD) closeSidebar();
    pointerState.down = false;
});

// 기타 전역 리스너
overlay.addEventListener('click', closeSidebar);
window.onpopstate = (e) => {
    if (e.state?.view === 'file') openMarkdown(e.state.path, false);
    else if (e.state?.view === 'folder') renderFolders(e.state.cat, false);
    else renderFolders("", false);
    
    viewer.classList.remove('active');
    document.body.style.overflow = 'auto';
};

// 초기 테마 적용
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');