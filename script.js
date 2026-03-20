const grid = document.getElementById('content-grid');
const viewer = document.getElementById('viewer');

// 데이터 불러오기
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const grouped = {};

    // 카테고리 그룹화
    data.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    renderCategories(grouped);
  });

// 카테고리 렌더링
function renderCategories(grouped) {
  grid.innerHTML = '';

  Object.keys(grouped).forEach(category => {
    const section = document.createElement('div');

    section.innerHTML = `<h2>${category}</h2>`;

    grouped[category].forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';

      card.innerHTML = `<h3>${item.title}</h3>`;

      card.onclick = () => openMarkdown(item.path);

      section.appendChild(card);
    });

    grid.appendChild(section);
  });
}

// markdown 열기
function openMarkdown(path) {
  fetch(path)
    .then(res => res.text())
    .then(md => {
      grid.style.display = 'none';
      viewer.style.display = 'block';

      viewer.innerHTML = `
        <button onclick="goBack()">← 뒤로</button>
        <div class="markdown-body">
          ${marked.parse(md)}
        </div>
      `;
    });
}

// 뒤로가기
function goBack() {
  viewer.style.display = 'none';
  grid.style.display = 'grid';
}