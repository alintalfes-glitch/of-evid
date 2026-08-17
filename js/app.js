// ===========================================================
// Pregătire Ofițer Evidență – Logica aplicației
// ===========================================================

window.appData = {
    legislation: [],
    examMethodologies: [],
    duties: []
};

// ===========================================================
// Utilitare
// ===========================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateArticleId(moduleId, articleNum) {
    return `${moduleId}-art${articleNum}`;
}

function getAllModules() {
    return [
        ...window.appData.legislation,
        ...window.appData.examMethodologies
    ];
}

function getAllArticles() {
    const all = [];
    getAllModules().forEach(mod => {
        if (!mod.sections) return;
        mod.sections.forEach(section => {
            if (!section.subsections) return;
            section.subsections.forEach(sub => {
                if (!sub.articles) return;
                sub.articles.forEach(art => {
                    all.push({
                        moduleId: mod.id,
                        moduleName: mod.name,
                        moduleType: mod.type || 'legislatie',
                        articleNum: art.num,
                        title: art.title,
                        fullText: art.fullText || '',
                        id: generateArticleId(mod.id, art.num)
                    });
                });
            });
        });
    });
    return all;
}

function getArticleById(id) {
    return getAllArticles().find(a => a.id === id);
}

// ===========================================================
// Navigare
// ===========================================================
function navigate(view, param) {
    const hash = param ? `#/${view}/${param}` : `#/${view}`;
    location.hash = hash;
    renderView(view, param);
}

function renderView(view, param) {
    document.querySelectorAll('#mainNav button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    const app = document.getElementById('app');
    app.innerHTML = '';

    switch (view) {
        case 'modules':
            renderModules(app);
            break;
        case 'module':
            renderModuleDetail(app, param);
            break;
        case 'article':
            renderArticle(app, param);
            break;
        case 'duties':
            renderDuties(app);
            break;
        case 'search':
            renderSearch(app);
            break;
        default:
            renderModules(app);
    }

    window.scrollTo(0, 0);
}

// ===========================================================
// Randare: Bibliotecă
// ===========================================================
function renderModules(container) {
    const modules = getAllModules();
    let html = `<div class="card card-intro">
        <div>
            <h2>📚 Bibliotecă</h2>
            <p class="muted">Selectează un act normativ pentru a citi articolele integral.</p>
        </div>
        <div class="intro-icon">📖</div>
    </div>`;

    modules.forEach(mod => {
        html += `
            <div class="card list-item" onclick="navigate('module','${mod.id}')" style="cursor:pointer;">
                <div>
                    <h3>${escapeHtml(mod.name)}</h3>
                    <p class="muted">${escapeHtml(mod.description || '')}</p>
                </div>
                <span class="badge">${mod.type === 'probă' ? 'Probă concurs' : 'Legislație'}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ===========================================================
// Randare: Modul (afișează toate articolele integral + cuprins sticky)
// ===========================================================
function renderModuleDetail(container, moduleId) {
    const mod = getAllModules().find(m => m.id === moduleId);
    if (!mod) {
        container.innerHTML = `<div class="card">Modul inexistent. <button class="btn" onclick="navigate('modules')">Înapoi</button></div>`;
        return;
    }

    // Construim cuprinsul sticky
    let tocHtml = '';
    if (mod.sections && mod.sections.length > 0) {
        tocHtml = `<nav class="toc" aria-label="Cuprins modul">
            <h4>📑 Cuprins</h4>`;
        let hasArticles = false;
        mod.sections.forEach(section => {
            if (!section.subsections) return;
            section.subsections.forEach(sub => {
                if (!sub.articles || sub.articles.length === 0) return;
                sub.articles.forEach(art => {
                    hasArticles = true;
                    const artId = generateArticleId(mod.id, art.num);
                    tocHtml += `<a href="#${artId}" class="toc-link" onclick="event.preventDefault(); scrollToArticle('${artId}');">Art. ${escapeHtml(art.num)} – ${escapeHtml(art.title)}</a>`;
                });
            });
        });
        tocHtml += `</nav>`;
    }

    let html = `
        <div class="card">
            <h2>${escapeHtml(mod.name)}</h2>
            <p class="muted">${escapeHtml(mod.description || '')}</p>
            <button class="btn" onclick="navigate('modules')">← Înapoi la bibliotecă</button>
        </div>
        ${tocHtml}
    `;

    if (!mod.sections || mod.sections.length === 0) {
        html += `<div class="card"><div class="placeholder">Acest modul nu conține încă articole.</div></div>`;
    } else {
        mod.sections.forEach(section => {
            html += `<div class="card"><h3>${escapeHtml(section.title)}</h3>`;
            if (!section.subsections || section.subsections.length === 0) {
                html += `<div class="placeholder">Nicio subsecțiune definită.</div>`;
            } else {
                section.subsections.forEach(sub => {
                    html += `<div class="mt-1 mb-1"><strong>${escapeHtml(sub.title)}</strong>`;
                    if (!sub.articles || sub.articles.length === 0) {
                        html += `<div class="placeholder">📌 Articolele urmează să fie adăugate.</div>`;
                    } else {
                        sub.articles.forEach(art => {
                            const artId = generateArticleId(mod.id, art.num);
                            html += `
                                <div id="${artId}" class="article-anchor" style="padding-top:1rem; margin-top:1rem; border-top:1px solid #e5e7eb;">
                                    <h4 style="color:var(--accent); font-weight:600; margin-bottom:0.5rem;">Art. ${escapeHtml(art.num)} – ${escapeHtml(art.title)}</h4>
                                    ${art.fullText ? `<div class="article-fulltext">${escapeHtml(art.fullText)}</div>` : `<div class="placeholder">Textul integral urmează să fie adăugat.</div>`}
                                </div>
                            `;
                        });
                    }
                    html += `</div>`;
                });
            }
            html += `</div>`;
        });
    }

    container.innerHTML = html;
}

// ===========================================================
// Randare: Articol individual (deschide modulul și derulează)
// ===========================================================
function renderArticle(container, articleId) {
    const article = getArticleById(articleId);
    if (!article) {
        container.innerHTML = `<div class="card">Articol inexistent. <button class="btn" onclick="navigate('modules')">Înapoi</button></div>`;
        return;
    }

    renderModuleDetail(container, article.moduleId);
    scrollToArticle(articleId);
}

function scrollToArticle(articleId) {
    const el = document.getElementById(articleId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Ajustează scroll sub nav-ul sticky, dacă este cazul
        const nav = document.getElementById('mainNav');
        if (nav) {
            const navHeight = nav.getBoundingClientRect().height;
            window.scrollBy({ top: -navHeight - 10, behavior: 'smooth' });
        }
    }
}

// ===========================================================
// Randare: Atribuții post
// ===========================================================
function renderDuties(container) {
    const duties = window.appData.duties;
    if (!duties || duties.length === 0) {
        container.innerHTML = `<div class="card"><h2>📋 Atribuții post</h2><div class="placeholder">Fișa postului nu a fost încă adăugată.</div></div>`;
        return;
    }

    let html = `<div class="card"><h2>📋 Atribuțiile postului – Ofițer Evidență</h2><p class="muted">Fiecare atribuție poate fi legată de articolele relevante.</p></div>`;

    duties.forEach(duty => {
        const links = duty.linkedArticles && duty.linkedArticles.length
            ? duty.linkedArticles.map(id => {
                const art = getArticleById(id);
                if (art) {
                    return `<button class="btn btn-small" onclick="navigate('article','${id}')">${escapeHtml(art.moduleName)} art. ${escapeHtml(art.articleNum)}</button>`;
                }
                return `<span class="muted">${escapeHtml(id)}</span>`;
            }).join(' ')
            : '<em>De completat</em>';

        html += `
            <div class="card">
                <p><strong>${escapeHtml(duty.id)}.</strong> ${escapeHtml(duty.text)}</p>
                <div class="muted mt-1">Articole relevante: ${links}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ===========================================================
// Randare: Căutare
// ===========================================================
function renderSearch(container) {
    container.innerHTML = `
        <div class="card">
            <h2>🔍 Căutare</h2>
            <input type="text" id="searchInput" placeholder="Caută în toate articolele..." oninput="performSearch(this.value)">
            <div id="searchResults"></div>
        </div>
    `;
    performSearch('');
}

function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    const q = query.toLowerCase().trim();
    const allArticles = getAllArticles();

    let filtered = allArticles;
    if (q) {
        filtered = allArticles.filter(a =>
            (a.title && a.title.toLowerCase().includes(q)) ||
            a.articleNum.includes(q) ||
            (a.fullText && a.fullText.toLowerCase().includes(q))
        );
    }

    if (filtered.length === 0) {
        resultsContainer.innerHTML = `<p class="muted">Niciun rezultat.</p>`;
        return;
    }

    resultsContainer.innerHTML = filtered.map(a => `
        <div class="list-item" onclick="navigate('article','${a.id}')" style="cursor:pointer;">
            <strong>${escapeHtml(a.moduleName)} – Art. ${escapeHtml(a.articleNum)}</strong>
            <p class="muted">${escapeHtml(a.title)}</p>
        </div>
    `).join('');
}

// ===========================================================
// Încărcarea dinamică a datelor
// ===========================================================
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Eroare la încărcarea ${src}`));
        document.body.appendChild(script);
    });
}

async function loadAllDataFiles() {
    const files = window.DATA_FILES || [];
    const promises = files.map(file => loadScript(`js/data/${file}`));
    await Promise.all(promises);
}

// ===========================================================
// Inițializare
// ===========================================================
function init() {
    // Adaugă stiluri pentru cuprins sticky și butonul "Înapoi sus"
    const style = document.createElement('style');
    style.textContent = `
        .toc {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 1rem 1.25rem;
            margin-bottom: 1.25rem;
            box-shadow: var(--shadow-sm);
            position: sticky;
            top: 65px;
            z-index: 5;
            max-height: 70vh;
            overflow-y: auto;
        }
        .toc h4 {
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
            color: var(--accent);
            font-weight: 600;
        }
        .toc-link {
            display: block;
            padding: 0.3rem 0;
            color: var(--accent);
            text-decoration: none;
            font-size: 0.88rem;
            border-bottom: 1px dashed var(--border);
        }
        .toc-link:last-child {
            border-bottom: none;
        }
        .toc-link:hover {
            text-decoration: underline;
            color: var(--accent-hover);
        }
        .back-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--accent);
            color: white;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
            display: none;
            align-items: center;
            justify-content: center;
            transition: background var(--transition), transform var(--transition);
            z-index: 20;
        }
        .back-to-top:hover {
            background: var(--accent-hover);
            transform: translateY(-2px);
        }
        .back-to-top.visible {
            display: flex;
        }
        @media (max-width: 700px) {
            .toc {
                top: 55px;
                max-height: 50vh;
                padding: 0.85rem 1rem;
            }
            .back-to-top {
                bottom: 1.25rem;
                right: 1.25rem;
                width: 42px;
                height: 42px;
                font-size: 1.3rem;
            }
        }
    `;
    document.head.appendChild(style);

    // Crează butonul "Înapoi sus"
    const backToTop = document.createElement('button');
    backToTop.id = 'backToTop';
    backToTop.className = 'back-to-top';
    backToTop.setAttribute('aria-label', 'Înapoi sus');
    backToTop.innerHTML = '↑';
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(backToTop);

    // Ascunde/afișează butonul în funcție de scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // Navigare prin butoane
    document.querySelectorAll('#mainNav button').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            navigate(view);
        });
    });

    // Gestionare hashchange
    window.addEventListener('hashchange', () => {
        const hash = location.hash.slice(2);
        const [view, param] = hash.split('/');
        renderView(view || 'modules', param);
    });

    // Randare inițială
    const initialHash = location.hash.slice(2);
    if (initialHash) {
        const [view, param] = initialHash.split('/');
        renderView(view || 'modules', param);
    } else {
        renderView('modules');
    }
}

// Pornire aplicație
loadAllDataFiles()
    .then(() => {
        init();
    })
    .catch(err => {
        console.error('Nu s-au putut încărca fișierele de date:', err);
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card">
                <h2>Eroare la încărcarea datelor</h2>
                <p class="muted">Verifică consola pentru detalii.</p>
            </div>
        `;
    });