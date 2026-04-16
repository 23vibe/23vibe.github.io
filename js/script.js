(function () {
    // --- State ---
    let sections = {};
    let sitesData = [];
    let currentSection = 'home';
    let glitchInterval = null;
    let originalHTML = '';
    const contentArea = document.getElementById('content-area');
    const orbitLinks = document.querySelectorAll('.orbit-link');

    // --- Load data ---
    async function loadData() {
        const [mdRes, sitesRes] = await Promise.all([
            fetch('content.md').then(r => r.text()),
            fetch('sites.json').then(r => r.json())
        ]);
        sections = parseMarkdown(mdRes);
        sitesData = sitesRes;
        showSection('home');
        startOrbit();
        startGlitch();
    }

    // --- Parse content.md into sections ---
    function parseMarkdown(md) {
        const result = {};
        const parts = md.split(/^## /m).filter(Boolean);
        for (const part of parts) {
            const lines = part.trim().split('\n');
            const key = lines[0].trim().toLowerCase();
            const body = lines.slice(1).join('\n').trim();
            result[key] = body;
        }
        return result;
    }

    // --- Simple markdown to HTML ---
    function mdToHTML(md) {
        return md
            .replace(/\r/g, '')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .split('\n')
            .map(line => {
                line = line.trim();
                if (!line || line.startsWith('<h')) return line;
                return '<p>' + line + '</p>';
            })
            .filter(Boolean)
            .join('\n');
    }

    // --- Random alignment for paragraphs ---
    function randomizeAlignment() {
        const elements = contentArea.querySelectorAll('p, h1, h2, h3, .tag-item, .page-item');
        const aligns = ['align-left', 'align-right', 'align-center'];
        elements.forEach(el => {
            el.classList.remove('align-left', 'align-right', 'align-center');
            el.classList.add(aligns[Math.floor(Math.random() * 3)]);
            const offset = Math.floor(Math.random() * 80) - 40;
            el.style.marginLeft = offset > 0 ? offset + 'px' : '0';
            el.style.marginRight = offset < 0 ? Math.abs(offset) + 'px' : '0';
        });
    }

    // --- Show a section ---
    function showSection(name) {
        currentSection = name;
        updateActiveLink();

        if (name === 'home' || name === 'terms') {
            const md = sections[name] || 'section not found.';
            contentArea.innerHTML = mdToHTML(md);
            randomizeAlignment();
        } else if (name === 'contact') {
            showContact();
        } else if (name === 'categories') {
            showCategories();
        } else if (name === 'pages') {
            showPages();
        } else if (name === 'search') {
            showSearch();
        }

        originalHTML = contentArea.innerHTML;
    }

    function updateActiveLink() {
        orbitLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === currentSection);
        });
    }

    // --- Contact ---
    function showContact() {
        const md = sections['contact'] || '';
        let html = mdToHTML(md);
        html += `
            <div class="form-container">
                <label>contact project author</label>
                <textarea id="contact-msg" placeholder="your message..."></textarea>
                <button id="contact-submit">submit</button>
            </div>`;
        contentArea.innerHTML = html;
        randomizeAlignment();

        document.getElementById('contact-submit').addEventListener('click', function () {
            const msg = document.getElementById('contact-msg').value.trim();
            if (!msg) return;
            // TODO: configure GitHub Actions workflow URL
            // fetch('https://api.github.com/repos/23vibe/23vibe.github.io/dispatches', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ event_type: 'contact', client_payload: { message: msg } })
            // });
            this.textContent = 'sent!';
            this.disabled = true;
        });
    }

    // --- Categories ---
    function showCategories() {
        const tags = new Set();
        sitesData.forEach(s => s.tags.forEach(t => tags.add(t)));
        const sorted = [...tags].sort();

        let html = '<h2>categories</h2>\n';
        sorted.forEach(tag => {
            html += `<div class="tag-item" data-tag="${tag}">${tag}</div>`;
        });
        contentArea.innerHTML = html;
        randomizeAlignment();

        contentArea.querySelectorAll('.tag-item').forEach(el => {
            el.addEventListener('click', function () {
                showSitesByTag(this.dataset.tag);
            });
        });
    }

    function showSitesByTag(tag) {
        const matches = sitesData
            .filter(s => s.tags.includes(tag))
            .sort((a, b) => a.name.localeCompare(b.name));

        let html = `<h2>${tag}</h2>\n`;
        if (matches.length === 0) {
            html += '<p>no pages found for this category.</p>';
        } else {
            matches.forEach(s => {
                html += `<a class="page-item" href="https://23vibe.github.io/${s.repo}" target="_blank" rel="noopener">${s.name}</a>`;
            });
        }
        html += `<p><br><span class="tag-item" id="back-to-categories">← back to categories</span></p>`;
        contentArea.innerHTML = html;
        randomizeAlignment();
        originalHTML = contentArea.innerHTML;

        document.getElementById('back-to-categories').addEventListener('click', function () {
            showCategories();
            originalHTML = contentArea.innerHTML;
        });
    }

    // --- Pages ---
    function showPages() {
        const sorted = [...sitesData].sort((a, b) => a.name.localeCompare(b.name));

        let html = '<h2>pages</h2>\n';
        if (sorted.length === 0) {
            html += '<p>no pages published yet.</p>';
        } else {
            sorted.forEach(s => {
                html += `<a class="page-item" href="https://23vibe.github.io/${s.repo}" target="_blank" rel="noopener">${s.name}</a>`;
            });
        }
        contentArea.innerHTML = html;
        randomizeAlignment();
    }

    // --- Search ---
    function showSearch() {
        const md = sections['search'] || '';
        let html = mdToHTML(md);
        html += `
            <div class="form-container">
                <input type="text" id="search-input" placeholder="search for music, pages, names...">
            </div>
            <div id="search-results"></div>`;
        contentArea.innerHTML = html;
        randomizeAlignment();

        document.getElementById('search-input').addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            const results = document.getElementById('search-results');
            if (!q) {
                results.innerHTML = '';
                return;
            }
            const matches = sitesData.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.tags.some(t => t.includes(q))
            ).sort((a, b) => a.name.localeCompare(b.name));

            if (matches.length === 0) {
                results.innerHTML = '<p>no results found.</p>';
            } else {
                results.innerHTML = matches.map(s =>
                    `<a class="page-item" href="https://23vibe.github.io/${s.repo}" target="_blank" rel="noopener">${s.name} <span style="color:var(--text-dim);font-size:12px">[${s.tags.join(', ')}]</span></a>`
                ).join('');
            }
            // re-randomize new results
            results.querySelectorAll('.page-item').forEach(el => {
                const aligns = ['align-left', 'align-right', 'align-center'];
                el.classList.add(aligns[Math.floor(Math.random() * 3)]);
                const offset = Math.floor(Math.random() * 60) - 30;
                el.style.marginLeft = offset > 0 ? offset + 'px' : '0';
                el.style.marginRight = offset < 0 ? Math.abs(offset) + 'px' : '0';
            });
        });
    }

    // --- Orbital navigation ---
    function startOrbit() {
        const count = orbitLinks.length;
        let orbitAngle = 0;

        function positionLinks() {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const radiusX = Math.min(vw * 0.46, 460);
            const radiusY = Math.min(vh * 0.44, 380);
            const centerX = vw / 2;
            const centerY = vh / 2;

            orbitLinks.forEach((link, i) => {
                const a = orbitAngle + (i / count) * Math.PI * 2;
                const x = centerX + Math.cos(a) * radiusX;
                const y = centerY + Math.sin(a) * radiusY;
                link.style.left = (x - link.offsetWidth / 2) + 'px';
                link.style.top = (y - link.offsetHeight / 2) + 'px';
            });

            orbitAngle += 0.0003; // ~60s per revolution
            requestAnimationFrame(positionLinks);
        }

        positionLinks();
    }

    // --- Glitch effect ---
    function startGlitch() {
        const glitchChars = '0123';

        function doGlitch() {
            originalHTML = contentArea.innerHTML;
            const textNodes = getTextNodes(contentArea);
            const originals = [];

            textNodes.forEach(node => {
                const text = node.textContent;
                if (text.trim().length < 2) return;
                const chars = text.split('');
                const count = Math.max(1, Math.floor(chars.length * 0.10));
                const positions = [];
                for (let i = 0; i < count; i++) {
                    let pos;
                    do {
                        pos = Math.floor(Math.random() * chars.length);
                    } while (chars[pos] === ' ' || chars[pos] === '\n');
                    positions.push({ pos, original: chars[pos] });
                    chars[pos] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }
                originals.push({ node, text });
                node.textContent = chars.join('');
            });

            // restore after 0.5-1s
            const glitchDuration = Math.floor(Math.random() * 500) + 500;
            setTimeout(function () {
                originals.forEach(({ node, text }) => {
                    if (node.parentNode) {
                        node.textContent = text;
                    }
                });
            }, glitchDuration);

            // schedule next glitch at random interval 4-9s
            const nextDelay = Math.floor(Math.random() * 5000) + 4000;
            setTimeout(doGlitch, nextDelay);
        }

        // initial delay
        const firstDelay = Math.floor(Math.random() * 5000) + 4000;
        setTimeout(doGlitch, firstDelay);
    }

    function getTextNodes(el) {
        const nodes = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.trim().length > 0) {
                nodes.push(walker.currentNode);
            }
        }
        return nodes;
    }

    // --- Navigation clicks ---
    orbitLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            showSection(this.dataset.section);
        });
    });

    // --- Init ---
    loadData();
})();
