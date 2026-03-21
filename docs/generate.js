const fs = require('fs');
const path = require('path');

// 현재 프로세스가 실행되는 루트 디렉토리를 기준으로 설정
const baseDir = process.cwd(); 

let result = [];
const categories = fs.readdirSync(baseDir);

// 제외할 폴더 목록
const exclude = ['node_modules', '.git', '.github', 'scripts', 'docs']; 

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
        path: `${category}/${file}`.replace(/\\/g, '/') // 윈도우 경로 호환성
      });
    }
  });
});

// 루트에 data.json 저장
fs.writeFileSync(path.join(baseDir, 'data.json'), JSON.stringify(result, null, 2));
console.log('✅ data.json 생성 완료 (Root 디렉토리)');