// ===========================================================
// Pregătire Ofițer Evidență – Manifestul fișierelor de date
// ===========================================================
// Adaugă aici numele fișierelor JavaScript care conțin datele
// aplicației (acte normative, metodologii, atribuții).
// Aplicația va încărca automat toate fișierele din această listă.
// ===========================================================

const DATA_FILES = [
    'lege254.js',       // Legea nr. 254/2013
    'codpenal.js',      // Codul Penal – Legea nr. 286/2009
    'cpp.js',           // Codul de procedură penală – Legea nr. 135/2010
    'hg157.js',         // Hotărârea Guvernului nr. 157/2016
    'ordin2188.js',     // Ordinul MJ nr. 2188/C/2022
    'lege145.js',       // Legea nr. 145/2019
    'ordin2794.js',     // Ordinul MJ nr. 2794/C/2004
    'interviu.js',      // Metodologia probei interviu
    'calculator.js',    // Metodologia probei practice calculator
    'duties.js'         // Atribuțiile postului de ofițer evidență
];

// Expunem global lista pentru a fi folosită de app.js
window.DATA_FILES = DATA_FILES;