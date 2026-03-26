/* =====================================================================
   AI Engineer Course — מחזור 8 — Static Data
   Two content types: RECORDINGS (timeline) and CONTENT (materials).
   Titles derived from content filenames. Recordings from spreadsheet.

   © 2026 The Hebrew University of Jerusalem
   (האוניברסיטה העברית בירושלים). All rights reserved.
   Protected under Israeli Copyright Law and international treaties.
   Unauthorized use, reproduction, or distribution is prohibited.
   ===================================================================== */

const D = "https://drive.google.com/drive/folders/";
const V = "https://drive.google.com/file/d/";

const F = {
    root:           D + "1WOFft9mQ5VSZZkFNjUF76AowPQXih8Uy",
    pythonPrep:     D + "1QYENoR1siwGgKBcgBfEkwVnRo4EWGm4E",
    slidesZvi:      D + "16kyplkQtvjPAFiIosgdD8iTrEQ7QsrkK",
    exercisesRoei:  D + "1KqGgRCUsvMWp92WDAeS5TCXArRvI3EMY",
    introFolder:    D + "1JwUvKQ6eXAs4oclWgilVreLpQaax-knu",
    introCode:      D + "17I81ot8JtNbfmZvXs2b7oG_HkNdy_TJL",
    supervisedLrn:  D + "1M3csnC60aoefzKYka4_O7JTq7v2hNXus",
    dsFoundations:  D + "15xNmQQEWxHzJgmP9RPUac9h1pC8Z9YyF",
    zviRecordings:  D + "1_OJl0G0uYx9zg5AUfOpIUtIKzLKP5oMC",
    pyRecordings:   D + "1tzMq9eUcRwaUwuoXHwpoQUF-44ZngxV2",
    exClass2:       D + "1mcWoebpNo_KsUy3CLvLP-k6plNEtYkxd",
    exClass3:       D + "116qIL9rDMXrWRpA_o6pFr3h5JxNzbTc-",
};

const SHEET = "1cxswTYY8qLKQ7Lq0JQZ4Bcjc9kp02m3vMOjMJY37wys";
const CK = "ai8_data_v2";
const CT = "ai8_ts_v2";

const APPS_SCRIPT_URL = "";
const DRIVE_API_KEY = localStorage.getItem("ai8_drive_key") || "";

// =====================================================================
// RECORDING FOLDERS
// =====================================================================
const RECORDING_FOLDERS = [
    { id: "1_OJl0G0uYx9zg5AUfOpIUtIKzLKP5oMC", label: "Zvi Recordings",    section: "lectures" },
    { id: "1tzMq9eUcRwaUwuoXHwpoQUF-44ZngxV2", label: "Python Recordings",  section: "python" },
];

// =====================================================================
// CONTENT FOLDERS
// =====================================================================
const CONTENT_FOLDERS = [
    { id: "1QYENoR1siwGgKBcgBfEkwVnRo4EWGm4E", label: "Python Prep",        section: "python" },
    { id: "16kyplkQtvjPAFiIosgdD8iTrEQ7QsrkK", label: "Slides Zvi",         section: "lectures" },
    { id: "1KqGgRCUsvMWp92WDAeS5TCXArRvI3EMY", label: "תרגולים רועי — Exercises Roei", section: "python" },
    { id: "1M3csnC60aoefzKYka4_O7JTq7v2hNXus", label: "Supervised Learning", section: "lectures" },
    { id: "15xNmQQEWxHzJgmP9RPUac9h1pC8Z9YyF", label: "DS Foundations",      section: "lectures" },
    { id: "1JwUvKQ6eXAs4oclWgilVreLpQaax-knu", label: "Intro Folder",        section: "lectures" },
    { id: "17I81ot8JtNbfmZvXs2b7oG_HkNdy_TJL", label: "Intro Code",         section: "lectures" },
];

// =====================================================================
// SESSIONS — titles derived from content filenames
// =====================================================================
const SESSIONS = [
    // ---- PYTHON PREP (Ilay) ----
    { date:"2026-02-24", title:"Python 1 — Python Fundamentals", section:"python",
      desc:"Variables, types, control flow",
      recordings:[
        {n:"🎬 Zoom Recording — Lecture Ilay",u:"https://us06web.zoom.us/rec/share/7ud2nRX-lAZXHPkwkbS_YFw17FYmzupOt3bBNN-nBsgXiqBqvzr0dukHGS289dVG.YwUaM3hwED6M5IQf",t:"video"},
        {n:"📁 Recording Folder",u:D+"1m7U6t9ncX64Nf9RDY4ARufikdsgasBko",t:"link"},
      ],
      content:[
        {n:"Python Fundamentals Lecture.pdf",u:V+"1tqv5KA2qdRyTczviw0K2dm1c6PlMTRDW/view",t:"pdf",_folder:"Python Prep"},
        {n:"lesson1.py",u:V+"1Wb165lOLKkapd346TMNMD59zWhJDTMHU/view",t:"link",_folder:"Python Prep"},
      ]},

    { date:"2026-02-25", title:"Tirgul 1 — Practice Session", section:"python",
      desc:"First exercise session with Roei",
      recordings:[
        {n:"🎬 Zoom Recording — Tirgul",u:"https://us06web.zoom.us/rec/share/be3EmabaFX-gfwyxaWVBIpUEEazzfTs-jnhVdDaFpliUFvYDs3Ugo31n_9hOCeFu.CQT27wJwRZcl92di",t:"video"},
        {n:"📁 Recording Folder",u:D+"19xHtZ7-nYxPZSIUTEBGIa0zBIw5ktB1Y",t:"link"},
      ],
      content:[
        {n:"📁 Exercises Folder",u:F.exercisesRoei,t:"link",_folder:"תרגולים רועי — Exercises Roei"},
      ]},

    { date:"2026-02-26", title:"Python 2 — Functions & Data Structures", section:"python",
      desc:"Functions, data structures, file I/O",
      recordings:[
        {n:"🎬 Zoom Recording — Lecture Ilay",u:"https://us06web.zoom.us/rec/share/GNhoTbcE9mF3nlHUX7U9RW-69ERvhIxVkxYqmkx3nqAFJZrviFAMdfDLSUvk7hXq.pRc9ktdAsyOqLwP4",t:"video"},
        {n:"📁 Recording Folder",u:D+"1w6ogaZBn93G0AfrpNtiZ8EGny0wBzRWH",t:"link"},
      ],
      content:[
        {n:"Python Lecture 2.pdf",u:V+"1zcAMFp-p_u3Roin1a_bwMEcVFLeH2yUy/view",t:"pdf",_folder:"Python Prep"},
        {n:"lesson2.py",u:V+"1ysBQ7Cw6nNU_Y1RYsRSUwmTvwS-YqnkM/view",t:"link",_folder:"Python Prep"},
      ]},

    { date:"2026-03-03", title:"Python 3 — OOP & Inheritance", section:"python",
      desc:"Classes, inheritance, abstract classes",
      recordings:[
        {n:"🎬 Zoom Recording — Lecture Ilay",u:"https://us06web.zoom.us/rec/share/jHOik39kc8p9Go00I63lX3XPG5MjF-sUnWewagNpdPc63H3G7RAgbsZ1ONcKwa97.sFRwt0oFzSBWb9xn",t:"video"},
        {n:"📁 Recording Folder",u:D+"1sxsJY6cZ8Hfbz3VNsKlrkZVErr82cZL_",t:"link"},
      ],
      content:[
        {n:"Python Lecture 3.pdf",u:V+"1L1eBEd2JA-FOLDNm7qcGLs-nUWjM_cf1/view",t:"pdf",_folder:"Python Prep"},
        {n:"lesson3.py",u:V+"1cyI1StwbGD_bNy9egkdLxC7qbpjJo9DC/view",t:"link",_folder:"Python Prep"},
        {n:"lesson3.ipynb",u:V+"1q3BEjDGfivHuRYIdj19-fnadTkySE6Kv/view",t:"notebook",_folder:"Python Prep"},
        {n:"lesson3_animal_abstract.py",u:V+"1j2xrfwHLPmLSjmewuHqev303U6H81vjv/view",t:"link",_folder:"Python Prep"},
        {n:"lesson3_animal_solution.py",u:V+"1N2FJmqB8QntQlnlcPkfNVOmqQKQVeGD0/view",t:"link",_folder:"Python Prep"},
      ]},

    { date:"2026-03-11", title:"Tirgul 2 — Modules & Project Structure", section:"python",
      desc:"Practice: modules, main.py, models.py, utils.py",
      recordings:[
        {n:"🎬 Zoom Recording — Tirgul",u:"https://us06web.zoom.us/rec/share/ujRCG3qcqT8h4q9A-afn7PNJX0FMGiY8O4aQOksQWGRRAJEHTExp3erwnPvPrpFN.mL5D3Jm0rZ85_9CX",t:"video"},
        {n:"📁 Recording Folder",u:D+"1uhhn_QwCtlORDGjrXNgGYo7Gvn2IRi_l",t:"link"},
      ],
      content:[
        {n:"Python_Prctice_class_2.ipynb",u:V+"1bsmxrI8z85r6OakPzuXIL7eK0OBE-wkK/view",t:"notebook",_folder:"תרגולים רועי — Exercises Roei / class2"},
        {n:"main.py",u:V+"1q6d9CvAuzrjstM4EONp-AiIHIEwfaK_l/view",t:"link",_folder:"תרגולים רועי — Exercises Roei / class2"},
        {n:"models.py",u:V+"1zix8c2lefd5TNzhUAJTVtkgLs5HMpwHL/view",t:"link",_folder:"תרגולים רועי — Exercises Roei / class2"},
        {n:"utils.py",u:V+"1OPK94dJ8fi9BtBltIdk_Gb3KelOnc8aN/view",t:"link",_folder:"תרגולים רועי — Exercises Roei / class2"},
        {n:"📁 class2 Folder",u:F.exClass2,t:"link",_folder:"תרגולים רועי — Exercises Roei / class2"},
      ]},

    { date:"2026-03-12", title:"Python 4 — Projects & Integrations", section:"python",
      desc:"Projects, integrations, advanced topics",
      recordings:[
        {n:"🎬 Zoom Recording — Lecture Ilay",u:"https://us06web.zoom.us/rec/share/FMU9pa3cmoetBpf6yxHL34l5six6mT171w19qv0s4Rs2jj8C18jQqEdAaAq7vNbl.esbyZAtFemzD_H68",t:"video"},
        {n:"📁 Recording Folder",u:D+"1obUjw4nuAqPkLGGPqQ6EFWQi3lkER66X",t:"link"},
      ],
      content:[
        {n:"Python Lecture 4.pdf",u:V+"1U4ZONfn-NU1ha_PVgP896HLXG6EDZnWv/view",t:"pdf",_folder:"Python Prep"},
        {n:"lesson4.py",u:V+"173aqoX0Swlw_CUFrwIIwUZD0bAv4I8z5/view",t:"link",_folder:"Python Prep"},
        {n:"lesson4Int.ipynb",u:V+"1J-cQGcJey8IeJuo5KCwC8TVNVJgFVT2S/view",t:"notebook",_folder:"Python Prep"},
        {n:"lesson4_project1.py",u:V+"1nIWZCBxSbzx6YLve3WAC7-2rTZqbONUG/view",t:"link",_folder:"Python Prep"},
        {n:"lesson4_project2.py",u:V+"1pTZrLsnVpkjbqJjFfG2Ydf09b_goY-3P/view",t:"link",_folder:"Python Prep"},
      ]},

    // ---- AI LECTURES (Zvi) ----
    { date:"2026-03-17", title:"AI 1 — Intro + Data Science Foundations", section:"lectures",
      desc:"Course intro, Web API to LLM, Data Science foundations",
      recordings:[
        {n:"🎬 Zoom Recording — Lecture Zvi",u:"https://us06web.zoom.us/rec/share/KC_gtrsrc11Vr7kwUyrKY1tpJPyrczhDywZecBtW8fkylIBcavbAShCIO26UwU13.DT8fTgwV3v19k1Ko",t:"video"},
        {n:"📁 Recording Folder",u:D+"19TXphkYDZUaFxBOWTlKWKuGS_ZOXImIh",t:"link"},
      ],
      content:[
        {n:"1. Intro.pdf",u:V+"1fWKnIMEjVvIStnpf9DlKe5ACQegPi0Xq/view",t:"pdf",_folder:"Slides Zvi"},
        {n:"WebAPItoLLM.ipynb",u:V+"1lomvR7WlCoMdcOmoa9AuBjrJeOTPKUdr/view",t:"notebook",_folder:"Intro Code"},
        {n:"01. Data Science Foundations.pdf",u:V+"16rqyENGCgSzFRRWelhvDV0AGcT6OPdA4/view",t:"pdf",_folder:"DS Foundations"},
        {n:"llm_requirements.txt",u:V+"1ROwmmGDd_LKg7XRmvdvofSugpSmKWAWB/view",t:"link",_folder:"Intro Code"},
        {n:"requirements_supervised.txt",u:V+"1lUfuxvDu2OXWRgl0n2z-7qEyerR7_uWp/view",t:"link",_folder:"Supervised Learning"},
        {n:"📁 Supervised Learning",u:F.supervisedLrn,t:"slides",_folder:"Supervised Learning"},
      ]},

    // ---- TIRGUL + LECTURES continued ----
    { date:"2026-03-17", title:"Tirgul 3 — Data Files & Config", section:"python",
      desc:"Practice: class3, config.json, data.txt, products.csv",
      recordings:[],
      content:[
        {n:"class3.ipynb",u:V+"1JTxFTOpYq4V1elepHeQGsyz50cYoIarK/view",t:"notebook",_folder:"תרגולים רועי — Exercises Roei / class3"},
        {n:"config.json",u:V+"1dQhFK-JKTzXOZgFohxQyJIqPkpl5g23j/view",t:"link",_folder:"תרגולים רועי — Exercises Roei / class3"},
        {n:"data.txt",u:V+"1Dd7aJ2dbpsycsheQYnyefpue8SQELOTY/view",t:"link",_folder:"תרגולים רועי — Exercises Roei / class3"},
        {n:"products.csv",u:V+"19vxC9zSawFzYF8vhGvP_G9AdNPYGL5b6/view",t:"link",_folder:"תרגולים רועי — Exercises Roei / class3"},
        {n:"📁 class3 Folder",u:D+"116qIL9rDMXrWRpA_o6pFr3h5JxNzbTc-",t:"link",_folder:"תרגולים רועי — Exercises Roei / class3"},
      ]},

    { date:"2026-03-18", title:"Tirgul 4 — Practice Session", section:"python",
      desc:"Exercise session with Roei",
      recordings:[
        {n:"🎬 Zoom Recording — Tirgul",u:"https://us06web.zoom.us/rec/share/0-2f16bQ53a_6OjhBsGDRyujGinGG4vBWaIoKY-yUb11WfV4Imrf5qE5z2EP0lCI.bq4o2m-xb9R4kavV",t:"video"},
      ],
      content:[
        {n:"📁 Exercises Folder",u:F.exercisesRoei,t:"link",_folder:"תרגולים רועי — Exercises Roei"},
      ]},

    { date:"2026-03-19", title:"AI 2 — Data Analysis", section:"lectures",
      desc:"Data Analysis, exploratory data analysis",
      recordings:[
        {n:"🎬 Zoom Recording — Lecture Zvi",u:"https://us06web.zoom.us/rec/share/nmBDKP2u0P41MM6GQ_jlGiB3mr8wtot_6AY62-3shm9udM3xUEtvQA7YvkkWnpwt.SY0RIi6ds_FrHYKP",t:"video"},
      ],
      content:[
        {n:"01. Data Analysis.pdf",u:"#",t:"pdf",_folder:"DS Foundations"},
      ]},

    { date:"2026-03-24", title:"AI 3 — Regression Models", section:"lectures",
      desc:"Regression Models, supervised learning",
      recordings:[
        {n:"🎬 Zoom Recording — Lecture Zvi",u:"https://us06web.zoom.us/rec/share/CzGiAPSpk9nZpOC3SmjwTo1MTiseG0-HMebbBTv8bSa4HhVU6n97g8p1FsC5Xent.2B-Fnhgd9G6gRLat",t:"video"},
      ],
      content:[
        {n:"02. Regression Models",u:"#",t:"slides",_folder:"Supervised Learning"},
      ]},

    { date:"2026-03-25", title:"Tirgul 5 — Practice Session", section:"python",
      desc:"Exercise session with Roei",
      recordings:[
        {n:"🎬 Zoom Recording — Tirgul",u:"https://us06web.zoom.us/rec/share/llnxH8CWYT24bcn_Wp-LsBdud-sXZFOTAdWFqEavdQim45y76VFB7_2xNLbzhl4.ktJkvNfG2_v8CLH4",t:"video"},
      ],
      content:[]},
];

const SHARED = [
    {n:"לוז מהנדסי AI — Schedule (PDF)",u:V+"17xa6hjSfczUL8gc21TbxczZUIkrftxkf/view",t:"pdf"},
    {n:"תוכן עניינים וקישורים להקלטות",u:`https://docs.google.com/spreadsheets/d/${SHEET}/edit?gid=0#gid=0`,t:"link"},
    {n:"מצגות צבי — Zvi's Slides",u:F.slidesZvi,t:"slides"},
    {n:"תרגולים רועי — Roei's Exercises",u:F.exercisesRoei,t:"link"},
    {n:"מכינת פייתון עילי — Python Prep",u:F.pythonPrep,t:"link"},
    {n:"הקלטות פייתון — Python Recordings",u:F.pyRecordings,t:"video"},
    {n:"הקלטות צבי — Zvi Recordings",u:F.zviRecordings,t:"video"},
];
