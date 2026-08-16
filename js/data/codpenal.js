// ===========================================================
// Codul Penal – Legea nr. 286/2009 – date legislative
// ===========================================================
// Structură predefinită conform bibliografiei.
// Textele integrale vor fi adăugate ulterior.
// ===========================================================

window.appData.legislation.push({
    id: 'codpenal',
    name: 'Codul Penal (Legea nr. 286/2009)',
    type: 'legislatie',
    description: 'Pedepsele, calculul duratei, liberarea condiționată, minoritatea',
    sections: [
        {
            title: 'Titlul III — Pedepsele',
            subsections: [
                {
                    title: 'Capitolul I — Categoriile pedepselor',
                    articles: [
                        { num: '53', title: 'Pedepsele principale', summary: '', fullText: '' },
                        { num: '54', title: 'Pedepsele complementare și accesorii', summary: '', fullText: '' }
                    ]
                },
                {
                    title: 'Capitolul II — Pedepsele principale',
                    subsections: [
                        {
                            title: 'Secțiunea 1 — Detențiunea pe viață',
                            articles: []
                        },
                        {
                            title: 'Secțiunea a 2-a — Închisoarea',
                            articles: [
                                { num: '60', title: 'Durata închisorii', summary: '', fullText: '' }
                            ]
                        }
                    ]
                },
                {
                    title: 'Capitolul IV — Calculul duratei pedepselor',
                    articles: []
                },
                {
                    title: 'Capitolul V — Individualizarea pedepselor',
                    subsections: [
                        {
                            title: 'Secțiunea 1 — Dispoziții generale',
                            articles: [
                                { num: '74', title: 'Criterii generale de individualizare a pedepsei', summary: '', fullText: '' }
                            ]
                        },
                        {
                            title: 'Secțiunea a 6-a — Liberarea condiționată',
                            articles: [
                                { num: '99', title: 'Condițiile liberării condiționate', summary: '', fullText: '' },
                                { num: '100', title: 'Efectele liberării condiționate', summary: '', fullText: '' }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            title: 'Titlul V — Minoritatea',
            subsections: [
                {
                    title: 'Capitolul III — Regimul măsurilor educative privative de libertate',
                    articles: []
                }
            ]
        },
        {
            title: 'Titlul X — Înțelesul unor termeni sau expresii în legea penală',
            subsections: [
                {
                    title: 'Articolul 186',
                    articles: [
                        { num: '186', title: 'Definiții legale', summary: '', fullText: '' }
                    ]
                }
            ]
        }
    ]
});