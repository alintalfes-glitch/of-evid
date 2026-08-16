// ===========================================================
// Pregătire Ofițer Evidență – Logica aplicației
// ===========================================================

// Obiect global pentru date (populat de fișierele din data/)
window.appData = {
    legislation: [],       // acte normative
    examMethodologies: [], // metodologii probe de concurs
    duties: []             // atribuții post
};

// ===========================================================
// Încărcarea dinamică a fișierelor de date
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
// Stare și persistență
// ===========================================================
const STORAGE_KEY = 'penitenciar_app_progress_v1';

let state = {
    viewedArticles: new Set(),
    flashcardProgress: {},   // { articleId: { known: bool, lastReview: timestamp } }
    quizHistory: [],         // { moduleId, score, total, wrongQuestions: [] }
    customFlashcards: [],
    customQuizQuestions: []
};

function saveState() {
    const serialized = {
        viewedArticles: [...state.viewedArticles],
        flashcardProgress: state.flashcardProgress,
        quizHistory: state.quizHistory,
        customFlashcards: state.customFlashcards,
        customQuizQuestions: state.customQuizQuestions
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function loadState() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    try {
        const parsed = JSON.parse(data);
        state.viewedArticles = new Set(parsed.viewedArticles || []);
        state.flashcardProgress = parsed.flashcardProgress || {};
        state.quizHistory = parsed.quizHistory || [];
        state.customFlashcards = parsed.customFlashcards || [];
        state.customQuizQuestions = parsed.customQuizQuestions || [];
    } catch (e) {
        console.warn('Nu am putut încărca progresul salvat.', e);
    }
}

// ===========================================================
// Utilitare pentru articole
// ===========================================================
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
                        summary: art.summary || '',
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

function markArticleViewed(id) {
    if (!state.viewedArticles.has(id)) {
        state.viewedArticles.add(id);
        saveState();
    }
}

function getModuleProgress(moduleId) {
    const articles = getAllArticles().filter(a => a.moduleId === moduleId);
    if (articles.length === 0) return 0;
    const viewed = articles.filter(a => state.viewedArticles.has(a.id)).length;
    return Math.round((viewed / articles.length) * 100);
}

function getOverallProgress() {
    const articles = getAllArticles();
    if (articles.length === 0) return 0;
    const viewed = articles.filter(a => state.viewedArticles.has(a.id)).length;
    return Math.round((viewed / articles.length) * 100);
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
    // Actualizează butoanele din nav
    document.querySelectorAll('#mainNav button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    const app = document.getElementById('app');
    app.innerHTML = '';

    switch (view) {
        case 'dashboard': renderDashboard(app); break;
        case 'modules': renderModules(app); break;
        case 'module': renderModuleDetail(app, param); break;
        case 'article': renderArticle(app, param); break;
        case 'flashcards': renderFlashcards(app); break;
        case 'quiz': renderQuiz(app); break;
        case 'duties': renderDuties(app); break;
        case 'search': renderSearch(app); break;
        case 'stats': renderStats(app); break;
        default: renderDashboard(app);
    }
    window.scrollTo(0, 0);
}

// ===========================================================
// Randare: Dashboard
// ===========================================================
function renderDashboard(container) {
    const totalArticles = getAllArticles().length;
    const viewedCount = state.viewedArticles.size;
    const progress = getOverallProgress();
    const lastQuiz = state.quizHistory.length ? state.quizHistory[state.quizHistory.length - 1] : null;

    container.innerHTML = `
        <div class="card">
            <h2>📊 Progres general</h2>
            <p class="muted">Articole vizualizate: ${viewedCount} din ${totalArticles}</p>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
            <p class="muted">Procent complet: ${progress}%</p>
            ${lastQuiz ? `<p class="muted">Ultimul scor la quiz: ${lastQuiz.score}/${lastQuiz.total} (${Math.round(lastQuiz.score/lastQuiz.total*100)}%)</p>` : ''}
        </div>
        <div class="grid">
            <div class="card">
                <h3>📚 Bibliotecă</h3>
                <p class="muted">${getAllModules().length} module disponibile</p>
                <button class="btn btn-primary btn-block" onclick="navigate('modules')">Deschide</button>
            </div>
            <div class="card">
                <h3>🃏 Flashcards</h3>
                <p class="muted">Revizuiește articolele</p>
                <button class="btn btn-primary btn-block" onclick="navigate('flashcards')">Începe</button>
            </div>
            <div class="card">
                <h3>📝 Quiz</h3>
                <p class="muted">Testează-ți cunoștințele</p>
                <button class="btn btn-primary btn-block" onclick="navigate('quiz')">Începe</button>
            </div>
            <div class="card">
                <h3>📋 Atribuții post</h3>
                <p class="muted">Fișa postului ofițer evidență</p>
                <button class="btn btn-primary btn-block" onclick="navigate('duties')">Vezi</button>
            </div>
            <div class="card">
                <h3>🔍 Căutare</h3>
                <p class="muted">Caută în tot conținutul</p>
                <button class="btn btn-primary btn-block" onclick="navigate('search')">Caută</button>
            </div>
            <div class="card">
                <h3>📈 Statistici</h3>
                <p class="muted">Progres pe module</p>
                <button class="btn btn-primary btn-block" onclick="navigate('stats')">Vezi</button>
            </div>
        </div>
    `;
}

// ===========================================================
// Randare: Bibliotecă (lista modulelor)
// ===========================================================
function renderModules(container) {
    const modules = getAllModules();
    let html = `<div class="card"><h2>📚 Bibliotecă</h2><p class="muted">Selectează un modul pentru a vedea articolele.</p></div>`;
    modules.forEach(mod => {
        const prog = getModuleProgress(mod.id);
        const typeLabel = mod.type === 'probă' ? 'Probă concurs' : 'Legislație';
        html += `
            <div class="card list-item" onclick="navigate('module','${mod.id}')">
                <div style="flex:1;">
                    <h3>${mod.name} <span class="badge">${typeLabel}</span></h3>
                    <p class="muted">${mod.description || ''}</p>
                </div>
                <div style="text-align:right; min-width:120px;">
                    <div class="progress-bar"><div class="progress-bar-fill" style="width:${prog}%"></div></div>
                    <span class="muted">${prog}%</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===========================================================
// Randare: Detaliu modul
// ===========================================================
function renderModuleDetail(container, moduleId) {
    const mod = getAllModules().find(m => m.id === moduleId);
    if (!mod) {
        container.innerHTML = `<div class="card">Modul inexistent. <button class="btn" onclick="navigate('modules')">Înapoi</button></div>`;
        return;
    }
    let html = `
        <div class="card">
            <h2>${mod.name}</h2>
            <p class="muted">${mod.description || ''}</p>
            <button class="btn" onclick="navigate('modules')">← Înapoi la bibliotecă</button>
        </div>
    `;
    if (!mod.sections || mod.sections.length === 0) {
        html += `<div class="card"><div class="placeholder">Acest modul nu conține încă secțiuni. Ele vor fi adăugate ulterior.</div></div>`;
    } else {
        mod.sections.forEach(section => {
            html += `<div class="card"><h3>${section.title}</h3>`;
            if (!section.subsections || section.subsections.length === 0) {
                html += `<div class="placeholder">Nicio subsecțiune definită.</div>`;
            } else {
                section.subsections.forEach(sub => {
                    html += `<div class="mt-1"><strong>${sub.title}</strong>`;
                    if (!sub.articles || sub.articles.length === 0) {
                        html += `<div class="placeholder">📌 Articolele urmează să fie adăugate.</div>`;
                    } else {
                        sub.articles.forEach(art => {
                            const artId = generateArticleId(mod.id, art.num);
                            const viewed = state.viewedArticles.has(artId);
                            html += `
                                <div class="list-item" onclick="navigate('article','${artId}')" style="border-bottom:1px solid #eee;">
                                    <div style="display:flex;justify-content:space-between;width:100%;">
                                        <span>📄 Art. ${art.num} – ${art.title} ${viewed ? '✅' : ''}</span>
                                        <span class="muted">›</span>
                                    </div>
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
// Randare: Articol
// ===========================================================
function renderArticle(container, articleId) {
    const article = getArticleById(articleId);
    if (!article) {
        container.innerHTML = `<div class="card">Articol inexistent.</div>`;
        return;
    }
    markArticleViewed(articleId);
    container.innerHTML = `
        <div class="card">
            <h2>${article.moduleName} – Art. ${article.articleNum}</h2>
            <h3>${article.title}</h3>
            <button class="btn" onclick="navigate('module','${article.moduleId}')">← Înapoi la modul</button>
        </div>
        <div class="card">
            <h3>Rezumat</h3>
            ${article.summary ? `<p>${article.summary}</p>` : `<div class="placeholder">Rezumatul urmează să fie completat.</div>`}
        </div>
        <div class="card">
            <h3>Text integral</h3>
            ${article.fullText ? `<pre style="white-space:pre-wrap;font-family:inherit;">${article.fullText}</pre>` : `<div class="placeholder">Textul integral urmează să fie adăugat.</div>`}
        </div>
    `;
}

// ===========================================================
// Randare: Flashcards
// ===========================================================
function renderFlashcards(container) {
    const allArticles = getAllArticles().filter(a => a.summary || a.fullText);
    container.innerHTML = `
        <div class="card">
            <h2>🃏 Flashcards</h2>
            <p class="muted">Selectează modulul și revizuiește articolele.</p>
            <select id="flashcardModuleSelect">
                <option value="all">Toate modulele</option>
                ${getAllModules().map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
            <button class="btn btn-primary" onclick="startFlashcards()">Începe</button>
            <div id="flashcardArea"></div>
        </div>
    `;
}

function startFlashcards() {
    const moduleId = document.getElementById('flashcardModuleSelect').value;
    let articles = getAllArticles().filter(a => a.summary || a.fullText);
    if (moduleId !== 'all') articles = articles.filter(a => a.moduleId === moduleId);
    if (articles.length === 0) {
        document.getElementById('flashcardArea').innerHTML = `<div class="placeholder">Nu există încă carduri disponibile. Adaugă conținut sau creează carduri personalizate.</div>`;
        return;
    }
    let currentIndex = 0;
    const area = document.getElementById('flashcardArea');

    function showCard() {
        const art = articles[currentIndex];
        const question = `Ce prevede art. ${art.articleNum} din ${art.moduleName}?`;
        const answer = art.summary || art.fullText || 'De completat';
        area.innerHTML = `
            <div class="flashcard" onclick="this.classList.toggle('flipped')">
                <div class="flashcard-inner">
                    <div class="flashcard-face">
                        <h3>Întrebare</h3>
                        <p>${question}</p>
                    </div>
                    <div class="flashcard-face flashcard-back">
                        <h3>Răspuns</h3>
                        <p>${answer}</p>
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:1rem;justify-content:center;margin-top:1rem;">
                <button class="btn" onclick="markFlashcard(${currentIndex}, false)">Nu știam</button>
                <button class="btn btn-primary" onclick="markFlashcard(${currentIndex}, true)">Știam</button>
            </div>
            <p class="muted">Card ${currentIndex + 1} din ${articles.length}</p>
        `;
    }

    window.markFlashcard = (idx, known) => {
        const art = articles[idx];
        state.flashcardProgress[art.id] = { known, lastReview: Date.now() };
        saveState();
        currentIndex++;
        if (currentIndex >= articles.length) {
            area.innerHTML = `<div class="card"><h3>Sesiune terminată!</h3><button class="btn btn-primary" onclick="startFlashcards()">Reîncepe</button></div>`;
        } else {
            showCard();
        }
    };

    showCard();
}

// ===========================================================
// Randare: Quiz
// ===========================================================
function renderQuiz(container) {
    container.innerHTML = `
        <div class="card">
            <h2>📝 Quiz</h2>
            <p class="muted">Testează-ți cunoștințele.</p>
            <select id="quizModuleSelect">
                <option value="all">Toate modulele</option>
                ${getAllModules().map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
            <button class="btn btn-primary" onclick="startQuiz()">Începe quiz</button>
            <div id="quizArea"></div>
        </div>
        <div class="card" id="quizHistory">
            <h3>Istoric scoruri</h3>
            ${state.quizHistory.length ? state.quizHistory.map((q,i) => `
                <div class="list-item">
                    <span>Quiz #${i+1}: ${q.moduleId === 'all' ? 'Toate' : q.moduleId} - Scor: ${q.score}/${q.total} (${Math.round(q.score/q.total*100)}%)</span>
                </div>
            `).join('') : '<p class="muted">Niciun quiz finalizat încă.</p>'}
        </div>
    `;
}

function startQuiz() {
    const moduleId = document.getElementById('quizModuleSelect').value;
    // Această funcție va fi extinsă când avem întrebări generate pe baza articolelor.
    document.getElementById('quizArea').innerHTML = `<div class="placeholder">Întrebările de quiz vor fi generate după adăugarea conținutului juridic complet.</div>`;
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
                    return `<button class="btn btn-small" onclick="navigate('article','${id}')">${art.moduleName} art. ${art.articleNum}</button>`;
                }
                return `<span class="muted">${id}</span>`;
            }).join(' ')
            : '<em>De completat</em>';
        html += `
            <div class="card">
                <p><strong>${duty.id}.</strong> ${duty.text}</p>
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
            a.title.toLowerCase().includes(q) ||
            a.articleNum.includes(q) ||
            (a.summary && a.summary.toLowerCase().includes(q)) ||
            (a.fullText && a.fullText.toLowerCase().includes(q))
        );
    }
    if (filtered.length === 0) {
        resultsContainer.innerHTML = `<p class="muted">Niciun rezultat.</p>`;
        return;
    }
    resultsContainer.innerHTML = filtered.map(a => `
        <div class="list-item" onclick="navigate('article','${a.id}')">
            <strong>${a.moduleName} – Art. ${a.articleNum}</strong>
            <p class="muted">${a.title}</p>
        </div>
    `).join('');
}

// ===========================================================
// Randare: Statistici
// ===========================================================
function renderStats(container) {
    const modules = getAllModules();
    let html = `<div class="card"><h2>📈 Statistici</h2><p class="muted">Progres pe module și performanță la quiz.</p></div>`;
    if (modules.length === 0) {
        html += `<div class="card"><div class="placeholder">Niciun modul disponibil.</div></div>`;
    } else {
        modules.forEach(mod => {
            const prog = getModuleProgress(mod.id);
            html += `
                <div class="card">
                    <h3>${mod.name}</h3>
                    <div class="progress-bar"><div class="progress-bar-fill" style="width:${prog}%"></div></div>
                    <p class="muted">${prog}% complet</p>
                </div>
            `;
        });
    }
    const quizAvg = state.quizHistory.length
        ? Math.round(state.quizHistory.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / state.quizHistory.length)
        : 0;
    html += `
        <div class="card">
            <h3>Performanță la quiz</h3>
            <p class="muted">Scor mediu: ${quizAvg}% (${state.quizHistory.length} quiz-uri)</p>
        </div>
    `;
    container.innerHTML = html;
}

// ===========================================================
// Inițializare
// ===========================================================
async function init() {
    loadState();
    // Setează navigarea
    document.querySelectorAll('#mainNav button').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            navigate(view);
        });
    });
    // Gestionare hashchange
    window.addEventListener('hashchange', () => {
        const hash = location.hash.slice(2); // elimină '#/'
        const [view, param] = hash.split('/');
        renderView(view || 'dashboard', param);
    });
    // Randare inițială
    const initialHash = location.hash.slice(2);
    if (initialHash) {
        const [view, param] = initialHash.split('/');
        renderView(view || 'dashboard', param);
    } else {
        renderView('dashboard');
    }
}

// Pornire aplicație
loadAllDataFiles()
    .then(() => {
        init();
    })
    .catch(err => {
        console.error('Nu s-au putut încărca fișierele de date:', err);
        document.getElementById('app').innerHTML = `
            <div class="card">
                <h2>Eroare la încărcarea datelor</h2>
                <p class="muted">Verifică consola pentru detalii.</p>
            </div>
        `;
    });