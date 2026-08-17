// ===========================================================
// Portal Ofițer Evidență – Logica aplicației
// Include: dark mode, căutare cu evidențiere, secțiuni pliabile
// ===========================================================

window.appData = {
    legislation: [],
    examMethodologies: [],
    duties: []
};

// Variabilă globală pentru termenul curent de căutare (folosită la evidențiere)
let currentSearchQuery = '';

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
// Evidențiere termeni
// ===========================================================
function highlightText(text, query) {
    if (!text) return '';
    if (!query) return escapeHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map(part => {
        if (part.toLowerCase() === query.toLowerCase()) {
            return `<mark>${escapeHtml(part)}</mark>`;
        }
        return escapeHtml(part);
    }).join('');
}

// ===========================================================
// Formatare specială pentru spețe
// ===========================================================
function formatSpețăArticle(art) {
    if (!art.fullText) {
        return '<div class="placeholder">Textul integral urmează să fie adăugat.</div>';
    }

    const text = art.fullText;
    const qMarker = 'ÎNTREBARE:';
    const aMarker = 'SUGESTIE RĂSPUNS:';
    const qIndex = text.indexOf(qMarker);
    const aIndex = text.indexOf(aMarker);

    if (qIndex === -1 || aIndex === -1) {
        return `<div class="article-fulltext">${highlightText(text, currentSearchQuery)}</div>`;
    }

    const questionText = text.substring(qIndex + qMarker.length, aIndex).trim();
    const answerText = text.substring(aIndex + aMarker.length).trim();

    return `
        <div class="speta-block">
            <div class="speta-question">
                <strong>ÎNTREBARE</strong>
                <p style="margin-top:0.3rem; white-space:pre-wrap;">${highlightText(questionText, currentSearchQuery)}</p>
            </div>
            <details class="speta-answer-details">
                <summary>Afișează răspuns</summary>
                <div class="speta-answer">
                    <strong>SUGESTIE RĂSPUNS</strong>
                    <p style="margin-top:0.3rem; white-space:pre-wrap;">${highlightText(answerText, currentSearchQuery)}</p>
                </div>
            </details>
        </div>
    `;
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
            currentSearchQuery = '';  // reset la navigarea normală
            renderModules(app);
            break;
        case 'module':
            currentSearchQuery = '';
            renderModuleDetail(app, param);
            break;
        case 'article':
            renderArticle(app, param);
            break;
        case 'duties':
            currentSearchQuery = '';
            renderDuties(app);
            break;
        case 'search':
            renderSearch(app);
            break;
        default:
            currentSearchQuery = '';
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
            <h2>📚 Legislație</h2>
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
// Randare: Modul (afișează toate articolele, cu secțiuni pliabile)
// ===========================================================
function renderModuleDetail(container, moduleId) {
    const mod = getAllModules().find(m => m.id === moduleId);
    if (!mod) {
        container.innerHTML = `<div class="card">Modul inexistent. <button class="btn" onclick="navigate('modules')">Înapoi</button></div>`;
        return;
    }

    let html = `
        <div class="card">
            <h2>${escapeHtml(mod.name)}</h2>
            <p class="muted">${escapeHtml(mod.description || '')}</p>
            <button class="btn" onclick="navigate('modules')">← Înapoi la legislație</button>
        </div>
    `;

    if (!mod.sections || mod.sections.length === 0) {
        html += `<div class="card"><div class="placeholder">Acest modul nu conține încă articole.</div></div>`;
    } else {
        // Butoane globale pentru secțiuni pliabile
        html += `
            <div class="card" style="padding:0.75rem 1rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn btn-small" onclick="toggleAllSections(true)">Extinde tot</button>
                <button class="btn btn-small" onclick="toggleAllSections(false)">Închide tot</button>
            </div>
        `;

        mod.sections.forEach(section => {
            html += `<div class="card"><h3>${escapeHtml(section.title)}</h3>`;
            if (!section.subsections || section.subsections.length === 0) {
                html += `<div class="placeholder">Nicio subsecțiune definită.</div>`;
            } else {
                section.subsections.forEach(sub => {
                    // Secțiune pliabilă pentru fiecare subsecțiune
                    html += `<details class="collapse-section">`;
                    html += `<summary>${escapeHtml(sub.title)}</summary>`;
                    html += `<div class="collapse-content">`;

                    if (!sub.articles || sub.articles.length === 0) {
                        html += `<div class="placeholder">📌 Articolele urmează să fie adăugate.</div>`;
                    } else {
                        sub.articles.forEach(art => {
                            const artId = generateArticleId(mod.id, art.num);
                            const isSpeta = mod.id === 'spete';
                            const contentHtml = isSpeta
                                ? formatSpețăArticle(art)
                                : (art.fullText
                                    ? `<div class="article-fulltext">${highlightText(art.fullText, currentSearchQuery)}</div>`
                                    : `<div class="placeholder">Textul integral urmează să fie adăugat.</div>`);

                            html += `
                                <div id="${artId}" style="padding-top:1rem; margin-top:1rem; border-top:1px solid var(--border);">
                                    <h4 style="color:var(--accent); font-weight:600; margin-bottom:0.5rem;">Art. ${escapeHtml(art.num)} – ${escapeHtml(art.title)}</h4>
                                    ${contentHtml}
                                </div>
                            `;
                        });
                    }

                    html += `</div></details>`;
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
function renderArticle(container, articleParam) {
    // articleParam poate fi "id?q=termen"
    const [articleId, queryPart] = articleParam.split('?');
    const query = queryPart ? decodeURIComponent(queryPart.replace('q=', '')) : '';
    currentSearchQuery = query;

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
        const nav = document.getElementById('mainNav');
        if (nav) {
            const navHeight = nav.getBoundingClientRect().height;
            window.scrollBy({ top: -navHeight - 10, behavior: 'smooth' });
        }
    }
}

// ===========================================================
// Funcții globale pentru secțiuni pliabile
// ===========================================================
window.toggleAllSections = function(expand) {
    document.querySelectorAll('details.collapse-section').forEach(d => {
        d.open = expand;
    });
};

// ===========================================================
// Randare: Atribuții post
// ===========================================================
function renderDuties(container) {
    const duties = window.appData.duties;
    if (!duties || duties.length === 0) {
        container.innerHTML = `<div class="card"><h2>📋 Fișa postului</h2><div class="placeholder">Fișa postului nu a fost încă adăugată.</div></div>`;
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
        <div class="list-item" onclick="navigate('article','${a.id}?q=${encodeURIComponent(q)}')" style="cursor:pointer;">
            <strong>${highlightText(a.moduleName + ' – Art. ' + a.articleNum, q)}</strong>
            <p class="muted">${highlightText(a.title, q)}</p>
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
    // --- Dark mode ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        themeToggle.addEventListener('click', () => {
            const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    }

    // --- Butonul „Înapoi sus” ---
    const backToTop = document.createElement('button');
    backToTop.id = 'backToTop';
    backToTop.className = 'back-to-top';
    backToTop.setAttribute('aria-label', 'Înapoi sus');
    backToTop.innerHTML = '↑';
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(backToTop);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // --- Navigare prin butoane ---
    document.querySelectorAll('#mainNav button').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            navigate(view);
        });
    });

    // --- Gestionare hashchange ---
    window.addEventListener('hashchange', () => {
        const hash = location.hash.slice(2);
        const [view, param] = hash.split('/');
        // param poate conține "?" pentru query; dar aici îl pasăm ca întreg,
        // iar renderView îl va gestiona.
        // Pentru view-urile simple, param poate fi undefined.
        const cleanParam = param ? param : undefined;
        renderView(view || 'modules', cleanParam);
    });

    // --- Randare inițială ---
    const initialHash = location.hash.slice(2);
    if (initialHash) {
        const [view, param] = initialHash.split('/');
        renderView(view || 'modules', param ? param : undefined);
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