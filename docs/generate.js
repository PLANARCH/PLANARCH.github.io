const fs = require('fs');
const path = require('path');

const baseDir = './docs';

// 폴더 목록 가져오기 (카테고리)
const categories = fs.readdirSync(baseDir).filter(file => {
  return fs.statSync(path.join(baseDir, file)).isDirectory();
});

let result = [];

categories.forEach(category => {
  const categoryPath = path.join(baseDir, category);

  const files = fs.readdirSync(categoryPath);

  files.forEach(file => {
    // markdown 파일만
    if (file.endsWith('.md')) {
      result.push({
        category: category,
        title: file.replace('.md', ''),
        path: `${category}/${file}`
      });
    }
  });
});

// JSON 저장
fs.writeFileSync(
  path.join(baseDir, 'data.json'),
  JSON.stringify(result, null, 2)
);

console.log('✅ data.json 생성 완료');