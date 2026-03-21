const fs = require('fs');
const path = require('path');

// 스크립트 위치에 상관없이 프로젝트 루트를 기준으로 설정
const baseDir = process.cwd(); 

let result = [];

const categories = fs.readdirSync(baseDir);

// 제외할 목록
const exclude = ['node_modules', '.git', '.github', 'scripts'];

categories.forEach(category => {
  const categoryPath = path.join(baseDir, category);

  if (!fs.statSync(categoryPath).isDirectory()) return;
  if (category.startsWith('.') || exclude.includes(category)) return;

  const files = fs.readdirSync(categoryPath);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      result.push({
        category,
        title: file.replace('.md', '').replace(/-/g, ' '),
        // ✅ 웹 브라우저에서는 역슬래시(\)가 아닌 슬래시(/)를 써야 합니다.
        path: `${category}/${file}`.replace(/\\/g, '/') 
      });
    }
  });
});

fs.writeFileSync(path.join(baseDir, 'data.json'), JSON.stringify(result, null, 2));
console.log('✅ data.json 생성 완료!');