    let mdCache = {};          
    let allData = [];
    let currentCategory = null;
    const VERSION = Date.now(); // 1. 앱 로드 시점의 타임스탬프 생성

    const sidebar = document.getElementById('sidebar');
    const contentGrid = document.getElementById('content-grid');
    const breadcrumb = document.getElementById('breadcrumb');
    const viewer = document.getElementById('viewer');
    const mdContent = document.getElementById('md-content');

    const savedTheme = localStorage.getItem('archive-theme') || 'dark';
    document.body.className = savedTheme;

    function toggleTheme() {
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        document.body.className = newTheme;
        localStorage.setItem('archive-theme', newTheme);
    }

    // 2. data.json 로드 시 캐시 방지
    fetch(`data.json?v=${VERSION}`)
    .then(r => {
        if (!r.ok) throw new Error(`HTTP 에러! 상태코드: ${r.status}`);
        return r.json();
    })
    .then(data => {
        allData = data;
        renderSidebar(data);
        handleInitialRoute(); 
    })
    .catch(err => {
        document.getElementById('content-grid').innerHTML = `<div style="text-align:center; padding:50px; color:var(--dim);"><h3>데이터를 불러올 수 없습니다.</h3><p>${err.message}</p></div>`;
    });

    async function handleInitialRoute() {
        const params = new URLSearchParams(window.location.search);
        const file = params.get('file');
        const folder = params.get('folder');

        // 1. [중요] 현재 페이지(파일)의 히스토리 위치를 '홈'으로 덮어씁니다.
        // 이제 뒤로 가기를 하면 구글로 가겠지만, 아직 스택을 더 쌓을 겁니다.
        history.replaceState({view: 'root'}, "", window.location.pathname);

        if (file) {
            const category = file.split('/')[0];
            
            // 2. '폴더' 상태를 히스토리에 한 층 쌓습니다.
            // 현재 스택: [구글] -> [홈] -> [폴더]
            history.pushState({view: 'folder', cat: category}, "", `?folder=${encodeURIComponent(category)}`);
            
            // 배경에 폴더 목록을 미리 그려둡니다. (파일 닫았을 때 보일 화면)
            renderCategoryFiles(category, false, false);
            
            // 3. 마지막으로 '파일' 상태를 쌓습니다.
            // 현재 스택: [구글] -> [홈] -> [폴더] -> [파일]
            // 이제 뒤로 스와이프하면 [폴더]로 이동하게 됩니다!
            openMarkdown(file, true); 

        } else if (folder) {
            // 폴더로 바로 온 경우: [구글] -> [홈] -> [폴더]
            history.pushState({view: 'folder', cat: folder}, "", `?folder=${encodeURIComponent(folder)}`);
            renderCategoryFiles(folder, false, false);
        } else {
            renderRootFolders(false);
        }
    }

    function renderRootFolders(pushHistory = true) {
        currentCategory = null;
        if (pushHistory) history.pushState({view: 'root'}, "", window.location.pathname);
        breadcrumb.style.display = 'none';
        contentGrid.innerHTML = '';
        const categories = [...new Set(allData.map(item => item.category))];
        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div class="icon">📁</div><strong>${cat}</strong>`;
            card.onclick = () => renderCategoryFiles(cat);
            contentGrid.appendChild(card);
        });
    }

    async function renderCategoryFiles(cat, keepSidebar = false, pushHistory = true) {
        currentCategory = cat;
        if (pushHistory) history.pushState({view: 'folder', cat: cat}, "", `?folder=${encodeURIComponent(cat)}`);
        breadcrumb.style.display = 'block';
        breadcrumb.textContent = `← 홈으로 (${cat})`;
        contentGrid.innerHTML = '';
        allData.filter(i => i.category === cat).forEach(i => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div class="icon">📄</div><strong>${i.title}</strong>`;
            card.onclick = () => openMarkdown(i.path);
            contentGrid.appendChild(card);
        });
        if (!keepSidebar) closeAllPanels();
    }

    // 3. 이미지 및 마크다운 내 리소스 캐시 방지 적용
    function fixImagePaths(md, path) {
        // 1. path: "TEST/react.md" -> folder: "TEST" 추출
        const folder = path.substring(0, path.lastIndexOf('/')); 
        
        return md.replace(/!\[(.*?)\]\((?!http|\/)(.*?)\)/g, (match, alt, src) => {
            // 2. folder가 있으면 "TEST/photo/photo.jpg", 없으면 그냥 "photo/photo.jpg"
            // 쿼리 스트링(?v=...)을 붙여 캐시 방지
            const fixedPath = folder ? `${folder}/${src}?v=${VERSION}` : `${src}?v=${VERSION}`;
            
            console.log("🛠️ 실제 이미지 요청 주소:", window.location.origin + "/" + fixedPath);
            return `![${alt}](${fixedPath})`;
        });
    }

    function fixHeaderSpacing(md) {
        // 줄 시작부분의 #...# 뒤에 공백이 없으면 공백을 추가
        // 예: #TEST -> # TEST, ###제목 -> ### 제목
        return md.replace(/^(#{1,6})([^#\s\d])/gm, '$1 $2');
    }

    async function openMarkdown(path, pushHistory = true) {
        // 🌟 [제목 복구] 데이터에서 찾거나 파일명에서 추출
        const item = allData.find(d => d.path === path);
        const title = item ? item.title : path.split('/').pop().replace('.md', '');
        
        const titleElement = document.getElementById('viewer-title');
        if (titleElement) titleElement.textContent = title;

        try {
            // 파일 로드 (캐시 방지 v= 포함)
            let md = mdCache[path] || await fetch(`${path}?v=${VERSION}`).then(r => r.text());
            mdCache[path] = md;

            // 2. 이미지 경로 보정 실행
            let processedMd = fixImagePaths(md, path);
            
            // 3. 🌟 [추가] 헤더 스페이싱 보정 실행 (#제목 -> # 제목)
            processedMd = fixHeaderSpacing(processedMd);
            
            // 4. 보정된 마크다운 파싱 및 렌더링
            mdContent.innerHTML = marked.parse(processedMd);
            
            viewer.classList.add('active'); 
            document.body.style.overflow = 'hidden';

            if (window.hljs) document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

            // 히스토리 관리 (뒤로가기 제스처 대응)
            if (pushHistory) {
                const currentFile = new URLSearchParams(window.location.search).get('file');
                if (currentFile !== path) {
                    history.pushState({view: 'file', path: path}, "", `?file=${encodeURIComponent(path)}`);
                }
            }
            closeAllPanels();
        } catch (e) {
            console.error("로드 에러:", e);
            mdContent.innerHTML = "<p style='padding:20px;'>문서를 불러오는 중 오류가 발생했습니다.</p>";
        }
    }

    function closeMarkdown() {
        if (new URLSearchParams(window.location.search).get('file')) history.back();
        else { viewer.classList.remove('active'); document.body.style.overflow = 'auto'; }
    }

    function renderSidebar(data) {
        const grouped = data.reduce((acc, obj) => {
            acc[obj.category] = acc[obj.category] || [];
            acc[obj.category].push(obj);
            return acc;
        }, {});
        sidebar.innerHTML = "<h3 style='margin-bottom:15px;'>카테고리</h3>";
        Object.keys(grouped).forEach(cat => {
            const group = document.createElement('div');
            group.className = 'cat-group';
            const header = document.createElement('div');
            header.className = 'cat-header';
            header.innerHTML = `<span>📁 ${cat}</span><small>▾</small>`;
            const list = document.createElement('div');
            list.className = 'sub-list';
            header.onclick = (e) => {
                const isOpen = list.style.display === 'block';
                list.style.display = isOpen ? 'none' : 'block';
                header.querySelector('small').textContent = isOpen ? '▾' : '▴';
                renderCategoryFiles(cat, true);
            };
            grouped[cat].forEach(file => {
                const item = document.createElement('div');
                item.className = 'sub-item';
                item.textContent = `📄 ${file.title}`;
                item.onclick = (e) => { e.stopPropagation(); openMarkdown(file.path); };
                list.appendChild(item);
            });
            group.appendChild(header); group.appendChild(list); sidebar.appendChild(group);
        });
    }

    function toggleSidebar(e) { e.stopPropagation(); sidebar.classList.toggle('active'); updateOverlay(); }
    function closeAllPanels() { sidebar.classList.remove('active'); updateOverlay(); }
    function updateOverlay() { document.body.classList.toggle('panel-open', sidebar.classList.contains('active')); }
    function copyLink() {
        const btn = event.target;
        const originalText = btn.textContent;
        
        navigator.clipboard.writeText(window.location.href).then(() => {
            btn.textContent = "✅ 복사됨!";
            btn.style.background = "#10b981"; // 초록색으로 변경
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = "var(--primary)";
            }, 2000);
        });
    }

    window.onpopstate = () => {
        const params = new URLSearchParams(window.location.search);
        const file = params.get('file');
        const folder = params.get('folder');
        if (!file) { viewer.classList.remove('active'); document.body.style.overflow = 'auto'; }
        if (file) openMarkdown(file, false);
        else if (folder) renderCategoryFiles(folder, false, false);
        else renderRootFolders(false);
    };

    document.getElementById('search').oninput = (e) => {
        const k = e.target.value.toLowerCase();
        if(!k) { renderRootFolders(); return; }
        breadcrumb.style.display = 'block';
        breadcrumb.textContent = `🔍 검색 결과: "${k}"`;
        contentGrid.innerHTML = '';
        allData.filter(i => i.title.toLowerCase().includes(k) || i.category.toLowerCase().includes(k)).forEach(i => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<div class="icon">📄</div><strong>${i.title}</strong><div style="font-size:0.75rem; color:var(--dim); margin-top:5px;">${i.category}</div>`;
            card.onclick = () => openMarkdown(i.path);
            contentGrid.appendChild(card);
        });
    };