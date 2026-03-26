// PLANARCH - Tech & News Hub JavaScript Logic
// Supports rendering both .md (Markdown) and .html files

document.addEventListener('DOMContentLoaded', function() {
    const newsContainer = document.getElementById('latest-news');
    if (!newsContainer) return;

    // List of content sources to load
    const contentSources = [
        'docs/march_2026_tech_news_report.html',
        'docs/latest_IT_뉴스_2026-03.md'
        // Add more paths as needed
    ];

    let loadedCount = 0;

    function renderContent(content, isHTML) {
        const item = document.createElement('div');
        item.className = 'news-item';
        
        if (isHTML) {
            // Directly inject HTML content for .html files
            item.innerHTML = content;
        } else {
            // Simple markdown to HTML conversion for basic rendering of .md files
            let html = content.replace(/\n/g, '<br>');
            html = html.replace(/^# (.*$)/gm, '<h3>$1</h3>');
            html = html.replace(/^## (.*$)/gm, '<h4>$1</h4>');
            item.innerHTML = html;
        }
        
        newsContainer.appendChild(item);
    }

    // Load content from sources
    contentSources.forEach(source => {
        const isHTML = source.endsWith('.html');
        fetch(source)
            .then(response => response.text())
            .then(data => {
                renderContent(data, isHTML);
                loadedCount++;
                if (loadedCount === contentSources.length) {
                    console.log('All news items loaded.');
                }
            })
            .catch(err => {
                console.error(`Error loading ${source}:`, err);
            });
    });
});

CONTENT: // PLANARCH - Tech & News Hub JavaScript Logic
// Supports rendering both .md (Markdown) and .html files

document.addEventListener('DOMContentLoaded', function() {
    const newsContainer = document.getElementById('latest-news');
    if (!newsContainer) return;

    // List of content sources to load
    const contentSources = [
        'docs/march_2026_tech_news_report.html',
        'docs/latest_IT_뉴스_2026-03.md'
        // Add more paths as needed
    ];

    let loadedCount = 0;

    function renderContent(content, isHTML) {
        const item = document.createElement('div');
        item.className = 'news-item';
        
        if (isHTML) {
            // Directly inject HTML content for .html files
            item.innerHTML = content;
        } else {
            // Simple markdown to HTML conversion for basic rendering of .md files
            let html = content.replace(/\n/g, '<br>');
            html = html.replace(/^# (.*$)/gm, '<h3>$1</h3>');
            html = html.replace(/^## (.*$)/gm, '<h4>$1</h4>');
            item.innerHTML = html;
        }
        
        newsContainer.appendChild(item);
    }

    // Load content from sources
    contentSources.forEach(source => {
        const isHTML = source.endsWith('.html');
        fetch(source)
            .then(response => response.text())
            .then(data => {
                renderContent(data, isHTML);
                loadedCount++;
                if (loadedCount === contentSources.length) {
                    console.log('All news items loaded.');
                }
            })
            .catch(err => {
                console.error(`Error loading ${source}:`, err);
            });
    });
});