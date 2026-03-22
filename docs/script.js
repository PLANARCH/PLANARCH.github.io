let mdCache = {};
let allData = [];
let currentPath = ""; 
let touchStartX = 0;
let touchEndX = 0;
const VERSION = Date.now();
const THEME_KEY = 'archive-theme';

const sidebar = document.getElementById('sidebar');
const contentGrid = document.getElementById('content-grid');
const breadcrumb = document.getElementById('breadcrumb');
const viewer = document.getElementById('viewer');
const mdContent = document.getElementById('md-content');
const searchInput = document.getElementById('search');
const SWIPE_THRESHOLD = 70; // 민감도 (px)


// --- 초기화 및 테마 ---
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
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
        allData = data;
        renderSidebar(data);
        handleInitialRoute();
    })
    .catch(err => {
        contentGrid.innerHTML = `<div style="text-align:center; padding:50px;"><h3>데이터 로드 실패</h3><p>${err}</p></div>`;
    });

// --- 라우팅 제어 ---
async function handleInitialRoute() {
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file');
    const folder = params.get('folder');

    // 뒤로가기 시 홈으로 오게 함
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

// --- 컨텐츠 그리드 (재귀 폴더 탐색) ---
function renderFolders(path = "", pushHistory = true) {
    currentPath = path;
    if (pushHistory) {
        const url = path ? `?folder=${encodeURIComponent(path)}` : window.location.pathname;
        history.pushState({view: 'folder', cat: path}, "", url);
    }

    // 브레드크럼 설정
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
            // 루트 경로 처리
            const parts = itemPath.split('/');
            if (parts.length > 1) subFolders.add(parts[0]);
            else filesInCurrent.push(item);
        } else if (itemPath.startsWith(path + '/')) {
            // 서브 폴더 처리
            const relative = itemPath.substring(path.length + 1);
            const parts = relative.split('/');
            if (parts.length > 1) subFolders.add(parts[0]);
            else filesInCurrent.push(item);
        }
    });

    // 폴더 카드 렌더링
    subFolders.forEach(folderName => {
        const fullNextPath = path ? `${path}/${folderName}` : folderName;
        const card = document.createElement('div');
        card.className = 'card folder-item';
        card.innerHTML = `<div class="icon">📁</div><strong>${folderName}</strong>`;
        card.onclick = () => renderFolders(fullNextPath);
        contentGrid.appendChild(card);
    });

    // 파일 카드 렌더링
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

// 터치 시작
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;

    // 왼쪽 30px 안에서 시작한 경우만 허용
    if (touchStartX > 30) touchStartX = null;
});

// 터치 이동 (선택)
document.addEventListener('touchmove', (e) => {
    touchEndX = e.changedTouches[0].screenX;
});

// 터치 끝
document.addEventListener('touchend', () => {
    if (touchStartX === null) return;

    const deltaX = touchEndX - touchStartX;

    if (deltaX > SWIPE_THRESHOLD) openSidebar();
    if (deltaX < -SWIPE_THRESHOLD) closeSidebar();
    if (deltaX < -SWIPE_THRESHOLD && sidebar.classList.contains('active')) {
        closeSidebar();
    }
});

function openSidebar() {
    sidebar.classList.add('active');
    document.querySelector('.overlay').classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    document.querySelector('.overlay').classList.remove('active');
}

// filesInCurrent.forEach(async file => {
//     const card = document.createElement('div');
//     card.className = 'card file-item';

//     let preview = '';

//     try {
//         let md = mdCache[file.path] || await fetch(`${file.path}?v=${VERSION}`).then(r => r.text());
//         mdCache[file.path] = md;

//         // 첫 줄 or 첫 문단 추출
//         preview = md.split('\n').find(line => line.trim() && !line.startsWith('#')) || '';
//         preview = preview.slice(0, 80);
//     } catch {}

//     card.innerHTML = `
//         <div class="icon">📄</div>
//         <strong>${file.title}</strong>
//         <small class="preview">${preview}</small>
//     `;

//     card.onclick = () => openMarkdown(file.path);
//     contentGrid.appendChild(card);
// });

// --- 사이드바 트리 구축 ---
function renderSidebar(data) {
    sidebar.innerHTML = "<h3 style='padding:10px 0;'>Archive Tree</h3>";
    const tree = {};

    // JSON 데이터를 중첩 객체(Tree)로 변환
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

        if (val.path) { // 파일인 경우
            li.innerHTML = `<span class="tree-file">📄 ${val.title}</span>`;
            li.onclick = (e) => { e.stopPropagation(); openMarkdown(val.path); };
        } else { // 폴더인 경우
            // tree-folder 클래스 부여
            li.innerHTML = `<span class="tree-folder">📁 ${key}</span>`;
            
            const subUl = document.createElement('ul');
            subUl.className = 'tree-sub'; // CSS 애니메이션 대상
            
            li.onclick = (e) => {
                e.stopPropagation();
                
                // 1. 애니메이션 클래스 토글
                const folderSpan = li.querySelector('.tree-folder');
                subUl.classList.toggle('open');
                folderSpan.classList.toggle('open');
                
                // 2. 그리드 영역 폴더 이동
                renderFolders(fullPath); 
            };
            
            buildTreeUI(val, subUl, fullPath);
            li.appendChild(subUl);
        }
        parentElement.appendChild(li);
    });
}

// --- 마크다운 뷰어 ---
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

        document.body.classList.add('viewer-open'); // 배경 효과용 클래스 추가        
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

// --- 검색 기능 ---
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

// --- 유틸리티 ---
function toggleSidebar(e) {
    e.stopPropagation();
    if (sidebar.classList.contains('active')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function closeAllPanels() {
    sidebar.classList.remove('active');
    document.querySelector('.overlay').classList.remove('active');
}

function copyLink() {
    const url = window.location.href;
    const btn = document.getElementById('copy-btn');
    navigator.clipboard.writeText(url).then(() => {
        const originalText = btn.textContent;
        btn.textContent = "✅ 복사됨!";
        btn.style.background = "#2ea44f";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "var(--primary)";
        }, 2000);
    });
}

window.onpopstate = (e) => {
    if (e.state?.view === 'file') openMarkdown(e.state.path, false);
    else if (e.state?.view === 'folder') renderFolders(e.state.cat, false);
    else renderFolders("", false);
    
    viewer.classList.remove('active');
    document.body.style.overflow = 'auto';
};

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
