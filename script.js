const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

/* =========================
   SCROLL TO TOP BUTTON
   ========================= */

const scrollTopBtn = $("#scrollTopBtn");

if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/* =========================
   THEME ANIMATION
   ========================= */

const themeBtn = $("#themeBtn");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.documentElement.style.pointerEvents = "none";
    setTimeout(() => {
      document.documentElement.style.pointerEvents = "auto";
    }, 350);
  });
}

function preloadImages(urls, { concurrency = 10 } = {}) {
  // Preloadar en lista bilder med "concurrency" så du inte dödar nätet helt.
  const queue = [...urls];
  let active = 0;

  return new Promise((resolve) => {
    const next = () => {
      if (queue.length === 0 && active === 0) return resolve();

      while (active < concurrency && queue.length > 0) {
        const url = queue.shift();
        active++;

        const img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = () => {
          active--;
          next();
        };
        img.src = url;
      }
    };
    next();
  });
}


function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 250);
  }, 2200);
}

(() => {
  const style = document.createElement("style");
  style.textContent = `
    .toast{
      position:fixed; left:50%; bottom:22px; transform:translateX(-50%) translateY(10px);
      background:rgba(15,18,26,.96); color:#eef2ff; border:1px solid rgba(255,255,255,.10);
      padding:12px 14px; border-radius:14px; opacity:0; transition:.22s ease;
      box-shadow:0 20px 60px rgba(0,0,0,.35); z-index:999;
    }
    .toast.show{ opacity:1; transform:translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(style);
})();

// Mobile menu
const menuBtn = $("#menuBtn");
const mobileNav = $("#mobileNav");

menuBtn?.addEventListener("click", () => {
  const open = mobileNav.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
});

$$(".mobileNav a").forEach(a => a.addEventListener("click", () => {
  mobileNav.classList.remove("is-open");
  menuBtn.setAttribute("aria-expanded", "false");
  mobileNav.setAttribute("aria-hidden", "true");
}));

// Copy email
const emailText = $("#emailText");
function copyEmail() {
  const email = emailText?.textContent?.trim() || "";
  if (!email) return;
  navigator.clipboard.writeText(email)
    .then(() => toast("E-post kopierad ✅"))
    .catch(() => toast("Kunde inte kopiera ❌"));
}
$("#copyEmailBtn")?.addEventListener("click", copyEmail);
$("#copyEmailBtn2")?.addEventListener("click", copyEmail);

// Portfolio filtering
const chips = $$(".chip");
const works = $$(".work");

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");

    const filter = chip.dataset.filter;
    works.forEach(w => {
      const type = w.dataset.type;
      const show = filter === "all" || filter === type;
      w.style.display = show ? "block" : "none";
    });
  });
});

// Modal
const modal = $("#modal");
const modalBody = $("#modalBody");
const modalTitle = $("#modalTitle");
const modalMeta = $("#modalMeta");
const modalClose = $("#modalClose");

function openModal({ title, meta, kind, src, html }) {
  if (!modal || !modalBody || !modalTitle || !modalMeta) return;
  modalTitle.textContent = title || "Portfolio";
  modalMeta.textContent = meta || "";
  modalBody.innerHTML = "";

  if (kind === "video") {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    modalBody.appendChild(iframe);
  } else if (kind === "html") {
    modalBody.innerHTML = html || "";
  } else {
    const img = document.createElement("img");
    img.src = src;
    img.alt = title || "Bild";
    img.className = "modalMedia";
    modalBody.appendChild(img);
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modalBody.innerHTML = "";
  document.body.style.overflow = "";
}

works.forEach(w => {
  w.addEventListener("click", () => {
    openModal({
      title: w.dataset.title,
      meta: `${w.dataset.type.toUpperCase()} • demo`,
      kind: w.dataset.kind,
      src: w.dataset.src,
    });
  });
});

$("#openShowreel")?.addEventListener("click", () => {
  // Hämta alla video-items från alla album (som har kind === "video")
  const allVideos = PORTFOLIO_ALBUMS
    .flatMap(a => (a.items || []).map(it => ({ ...it, albumTitle: a.title })))
    .filter(it => it.kind === "video" && it.src);

  if (!allVideos.length) {
    toast("Inga videor hittades ❌");
    return;
  }

  // Random video
  const pick = allVideos[Math.floor(Math.random() * allVideos.length)];

  openModal({
    title: pick.title || "Showreel",
    meta: `VIDEO • ${pick.albumTitle || "Portfolio"}`,
    kind: "video",
    src: pick.src, // lokal mp4 funkar eftersom din openModal redan stödjer video
  });
});


modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "true") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

// ===============================
// Tjänster – "Läs mer" popup
// ===============================

(() => {
  const btns = $$(".js-readMore");
  if (!btns.length) return;

  const serviceCopy = {
    video: {
      title: "Marknadsföringsvideo",
      meta: "Tjänst",
      html: `
        <p class="muted">Promo/teaser som är byggd för att funka direkt på Facebook och Instagram.</p>
        <ul class="list">
          <li>Rätt format (t.ex. 9:16 / 1:1 / 16:9 vid behov)</li>
          <li>Tydlig info: datum, plats, bandnamn + CTA</li>
          <li>Snabbt upplägg: du skickar info → jag levererar färdigt</li>
        </ul>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <a class="btn btn--small" href="kontakt.html">Be om offert</a>
          <a class="btn btn--ghost btn--small" href="portfolio.html">Se exempel</a>
        </div>
      `.trim(),
    },
    bilder: {
      title: "Bildmaterial",
      meta: "Tjänst",
      html: `
        <p class="muted">Bildpaket för inlägg, covers och affischer – med en enhetlig look som passar ert band.</p>
        <ul class="list">
          <li>Design som håller ihop allt (färger/typsnitt/stil)</li>
          <li>Leverans i rätt storlekar för SoMe och event</li>
          <li>Små justeringar när ni behöver</li>
        </ul>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <a class="btn btn--small" href="kontakt.html">Fråga om paket</a>
          <a class="btn btn--ghost btn--small" href="portfolio.html">Se exempel</a>
        </div>
      `.trim(),
    },
    hemsida: {
      title: "Hemsideskapande",
      meta: "Tjänst",
      html: `
        <p class="muted">En snabb och proffsig hemsida som är enkel att underhålla och ser bra ut i mobilen.</p>
        <ul class="list">
          <li>Vanliga sidor: start, band, media/press, spelningar, kontakt</li>
          <li>Snabb laddning + modern design</li>
          <li>Byggd så att ni kan fylla på innehåll utan krångel</li>
          <li>Hjälp med publicering + småändringar vid behov</li>
        </ul>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <a class="btn btn--small" href="kontakt.html">Be om upplägg</a>
          <a class="btn btn--ghost btn--small" href="portfolio.html">Se exempel</a>
        </div>
      `.trim(),
    },
    logga: {
      title: "Logga",
      meta: "Tjänst",
      html: `
        <p class="muted">En logga som funkar överallt: sociala medier, affischer och hemsida.</p>
        <ul class="list">
          <li>Versioner för ljus/mörk bakgrund</li>
          <li>Leverans i vanliga format (PNG/SVG/JPG)</li>
          <li>Matchar ert uttryck och genre</li>
        </ul>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <a class="btn btn--small" href="kontakt.html">Fråga om logga</a>
          <a class="btn btn--ghost btn--small" href="portfolio.html">Se exempel</a>
        </div>
      `.trim(),
    },
  };

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.service;
      const cfg = serviceCopy[key];
      if (!cfg) return;
      openModal({ title: cfg.title, meta: cfg.meta, kind: "html", html: cfg.html });
    });
  });
})();

// Kopiera mail (Kontakt-sektionen)
const copyEmailBtn2 = document.getElementById("copyEmailBtn2");
const emailText2 = document.getElementById("emailText2");

if (copyEmailBtn2 && emailText2) {
  copyEmailBtn2.addEventListener("click", async () => {
    const email = (emailText2.textContent || "").trim();
    try {
      await navigator.clipboard.writeText(email);
      copyEmailBtn2.textContent = "Kopierad!";
      setTimeout(() => (copyEmailBtn2.textContent = "Kopiera mail"), 1200);
    } catch (e) {
      // fallback
      const tmp = document.createElement("textarea");
      tmp.value = email;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      copyEmailBtn2.textContent = "Kopierad!";
      setTimeout(() => (copyEmailBtn2.textContent = "Kopiera mail"), 1200);
    }
  });
}

// ===============================
// Portfolio – album + lokal assets
// ===============================

// 1) Definiera album + media (lägg bara in dina filer här)
const PORTFOLIO_ALBUMS = [
  {
    id: "streaplers",
    title: "Streaplers",
    type: "bild",
    desc: "Bilder från Streaplers events och spelningar.",
    thumb: "assets/portfolio/Streaplers/S2.png",
    items: [
      // Kjetil
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07505.JPG", title: "Kjetil" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07618.JPG", title: "Kjetils Trummor" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07740.JPG", title: "Kjetil" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07747.JPG", title: "Kjetils Trummor" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07931.JPG", title: "Kjetils Trummor" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08106.JPG", title: "Kjetil" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08244.JPG", title: "Kjetil" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08257.JPG", title: "Kjetil" },
      { kind: "image", src: "assets/portfolio/Streaplers/Kjetilsson.png", title: "Kjetil" },

      // Kenny
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07412.JPG", title: "Kenny" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07464.JPG", title: "Kenny" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07468.JPG", title: "Kenny" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07754.JPG", title: "Kenny" },
      { kind: "image", src: "assets/portfolio/Streaplers/kenn.png", title: "Kenny" },
      { kind: "image", src: "assets/portfolio/Streaplers/Kenny.png", title: "Kenny" },
      { kind: "image", src: "assets/portfolio/Streaplers/kenny2.png", title: "Kenny" },

      // Per
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07403.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07558.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07899.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07944.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08030.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08113.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08241.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08275.JPG", title: "Per" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08325.JPG", title: "Per" },

      // Stefan
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07443.JPG", title: "Stefan" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07446.JPG", title: "Stefan" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07786.JPG", title: "Stefan" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07787.JPG", title: "Stefan" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08087.JPG", title: "Stefan" },

      // Max
      { kind: "image", src: "assets/portfolio/Streaplers/19aac251-22c4-4a94-9d58-0f8b4d2a90e3.png", title: "Max" },
      { kind: "image", src: "assets/portfolio/Streaplers/dfd51446-bda0-42e5-9664-e02dc2667d61.png", title: "Max" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07431.JPG", title: "Max" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07435.JPG", title: "Max" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08066.JPG", title: "Max Gitarr" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08313.JPG", title: "Max" },

      // Övrigt
      { kind: "image", src: "assets/portfolio/Streaplers/DSC07398.JPG", title: "Scenbild innan spelning..." },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08327.JPG", title: "Gruppbild" },
      { kind: "image", src: "assets/portfolio/Streaplers/DSC08329.JPG", title: "Gruppbild" },
      { kind: "image", src: "assets/portfolio/Streaplers/S1.png", title: "Redigerad Gruppbild" },
      { kind: "image", src: "assets/portfolio/Streaplers/S2.png", title: "Redigerad Gruppbild" },
      { kind: "video", src: "assets/portfolio/Streaplers/vid.mp4", title: "Streplers video, Nässjö" },
    ],
  },

  {
    id: "sounders",
    title: "Sounders Dansorkester",
    type: "video",
    desc: "Videor och bilder från Sounders Dansorkester spelningar och events.",
    thumb: "assets/portfolio/albums/sounders/images/banner.jpg",
    items: [
      // Videos
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/1.mp4", title: "Sounders Video 1" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/2.mp4", title: "Sounders Video 2" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/3.mp4", title: "Sounders Video 3" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/4.mp4", title: "Sounders Video 4" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/5.mp4", title: "Sounders Video 5" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/6.mp4", title: "Sounders Video 6" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/7.mp4", title: "Sounders Video 7" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/8.mp4", title: "Sounders Video 8" },
      { kind: "video", src: "assets/portfolio/albums/sounders/videos/9.mp4", title: "Sounders Video 9" },

      // Images
      { kind: "image", src: "assets/portfolio/albums/sounders/images/banner.jpg", title: "Sounders Banner" },
      { kind: "image", src: "assets/portfolio/albums/sounders/images/halloween.jpg", title: "Halloween Event" },
      { kind: "image", src: "assets/portfolio/albums/sounders/images/logo.jpg", title: "Sounders Logo" },
      { kind: "image", src: "assets/portfolio/albums/sounders/images/sounders.jpg", title: "Sounders Dansorkester" },
      { kind: "image", src: "assets/portfolio/albums/sounders/images/tackbåt.jpg", title: "Tackbåt Event" },
      { kind: "image", src: "assets/portfolio/albums/sounders/images/tacksundspärlan.jpg", title: "Tacksundspärlan" },
    ],
  },

  {
    id: "sannex",
    title: "Sannex",
    type: "bild",
    desc: "Bilder från Sannex spelningar och events.",
    thumb: "assets/portfolio/Sannex/DSC00084.JPG",
    items: [
      { kind: "image", src: "assets/portfolio/Sannex/Andreas.png", title: "Andreas" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00084.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00091.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00122.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00146.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00412.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00429.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00442.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00509.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00517.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00550.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00552.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00569.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00575.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00577.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00579.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00590.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00615.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00620.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00627.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00628.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00655.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00668.JPG", title: "Sannex" },
    ],
  },

  {
    id: "blackjack",
    title: "BlackJack",
    type: "bild",
    desc: "Bilder från BlackJack spelningar.",
    thumb: "assets/portfolio/BlackJack/DSC00064.JPG",
    items: [
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00064.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00162.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00166.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00183.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00196.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00207.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00219.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00225.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00228.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00248.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00249.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00265.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00294 - kopia.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00294.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00299.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00301.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00309.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00315.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00322.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00327.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00332.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00342.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00363.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00368.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00370.JPG", title: "BlackJack" },
      { kind: "image", src: "assets/portfolio/BlackJack/DSC00391.JPG", title: "BlackJack" },
    ],
  },

  // {
  //   id: "bildpaket",
  //   title: "Bild bank",
  //   type: "bild",
  //   desc: "Redo att posta: datum, ort, CTA.",
  //   thumb: "assets/portfolio/albums/promo/bildbadge.png",
  //   items: [
  //     { kind: "image", src: "assets/portfolio/albums/bildpaket/01.jpg", title: "Poster 1" },
  //     { kind: "image", src: "assets/portfolio/albums/bildpaket/02.jpg", title: "Poster 2" },
  //   ],
  // },

  {
    id: "livefoto",
    title: "Live Foto",
    type: "bild",
    desc: "Bilder tagna direkt på scen!",
    thumb: "assets/portfolio/albums/promo/live.png",
    items: [],
  // },

  // {
  //   id: "ovrigt",
  //   title: "Övriga bilder",
  //   type: "bild",
  //   desc: "Fotografi: blandade bilder från annat än dans & band jag fotograferat.",
  //   thumb: "assets/portfolio/albums/sounders/images/live1.jpg",
  //   items: [],
  },
];


// 2) Element refs
const albumGrid = document.getElementById("albumGrid");
const albumPanel = document.getElementById("albumPanel");
const mediaGrid = document.getElementById("mediaGrid");
const albumTitle = document.getElementById("albumTitle");
const albumDesc = document.getElementById("albumDesc");
const albumBackBtn = document.getElementById("albumBackBtn");
const otherPhotosBtn = document.getElementById("otherPhotosBtn");

// 3) Filter buttons
const filterButtons = Array.from(document.querySelectorAll(".filters .filter"));
let activeFilter = "all";

// Album filter
let activeAlbumFilter = "all";
const albumFilters = document.getElementById("albumFilters");

// 4) Render albumkort
function renderAlbums() {
  if (!albumGrid) return;
  albumGrid.innerHTML = "";

  const albums = PORTFOLIO_ALBUMS.filter(a => activeFilter === "all" ? true : a.type === activeFilter);

  albums.forEach(album => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "albumCard";
    btn.dataset.type = album.type;

    btn.innerHTML = `
      <div class="albumCard__thumb">
        <img src="${album.thumb}" alt="${album.title}" loading="lazy" />
        <span class="albumCard__tag">${album.type.toUpperCase()}</span>
      </div>
      <div class="albumCard__body">
        <div class="albumCard__title">${album.title}</div>
        <div class="muted tiny">${album.desc}</div>
        <div class="albumCard__meta">${album.items.length} objekt</div>
      </div>
    `;

    btn.addEventListener("click", () => openAlbum(album.id)); // funkar även om openAlbum är async
    albumGrid.appendChild(btn);
  });
}

async function openAlbum(albumId) {
  const album = PORTFOLIO_ALBUMS.find(a => a.id === albumId);
  if (!album) return;

  albumTitle.textContent = album.title;
  albumDesc.textContent = album.desc;

  // Reset album filter
  activeAlbumFilter = "all";

  const hasVideo = album.items.some(item => item.kind === "video");
  const hasImage = album.items.some(item => item.kind === "image");

  if (albumFilters) {
    albumFilters.style.display = (hasVideo && hasImage) ? "flex" : "none";
    albumFilters.querySelectorAll(".filter--album").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === "all");
    });
  }

  // göm album grid, visa panel
  albumGrid.style.display = "none";
  albumPanel.hidden = false;

  // 1) Rendera direkt (så UI känns instant)
  renderMedia(album);

  // Tomt album: visa instruktion istället för blank yta
  if (album.items.length === 0 && mediaGrid) {
    const extra = album.id === "ovrigt"
      ? "Lägg dina bilder i assets/portfolio/ovrigt/images/ och fyll på assets/portfolio/ovrigt/manifest.json under files."
      : "Inget innehåll uppladdat ännu.";

    mediaGrid.innerHTML = `
      <div class="emptyState">
        <div class="emptyState__t">Inga bilder ännu</div>
        <div class="muted">${extra}</div>
      </div>
    `;
    return;
  }

  // 2) Preloada ALLA thumbnails i albumet i bakgrunden
  // (och även bild-src för image-items om du inte har separata thumbs)
  const urlsToPreload = album.items
    .filter(item => item.kind === "image")
    .map(item => item.thumb || item.src);

  // Kör preload utan att blocka UI
  preloadImages(urlsToPreload.slice(0, 12), { concurrency: 4 });
}


// 6) Tillbaka
if (albumBackBtn) {
  albumBackBtn.addEventListener("click", () => {
    albumPanel.hidden = true;
    albumGrid.style.display = "";
    mediaGrid.innerHTML = "";
  });
}

// Quick entry: "Visa övriga bilder"
if (otherPhotosBtn) {
  otherPhotosBtn.addEventListener("click", () => openAlbum("ovrigt"));
}

// 6.5) Album filter buttons
if (albumFilters) {
  albumFilters.addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter--album")) return;
    
    const filter = e.target.dataset.filter;
    activeAlbumFilter = filter;
    
    // Update active state
    albumFilters.querySelectorAll(".filter--album").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    
    // Re-render current album
    const currentAlbum = PORTFOLIO_ALBUMS.find(a => a.title === albumTitle.textContent);
    if (currentAlbum) renderMedia(currentAlbum);
  });
}

// ===============================
// Video thumbnails (auto from mp4)
// ===============================
const videoThumbCache = new Map();

function makeVideoThumbnail(videoSrc, { maxW = 900 } = {}) {
  if (videoThumbCache.has(videoSrc)) return videoThumbCache.get(videoSrc);

  const p = new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = videoSrc;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {}
      resolve(val);
    };

    const toDataUrl = () => {
      try {
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;

        const scale = Math.min(1, maxW / w);
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, cw, ch);

        // Snabb “är detta typ svart?”-koll (sample en pixel i mitten)
        const mid = ctx.getImageData(Math.floor(cw/2), Math.floor(ch/2), 1, 1).data;
        const brightness = (mid[0] + mid[1] + mid[2]) / 3;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        return { dataUrl, brightness };
      } catch (e) {
        return null;
      }
    };

    // Vi provar flera tidpunkter ifall början är svart
    const seekCandidates = (duration) => {
      const d = Number.isFinite(duration) ? duration : 0;
      const a = [];
      // 10% in (min 2s), sen 25% in, sen 50% in
      if (d > 0) {
        a.push(Math.min(d - 0.15, Math.max(2, d * 0.10)));
        a.push(Math.min(d - 0.15, Math.max(3, d * 0.25)));
        a.push(Math.min(d - 0.15, Math.max(4, d * 0.50)));
      } else {
        a.push(2, 4, 6);
      }
      return a.filter(t => t > 0.05);
    };

    let candidates = [];
    let idx = 0;

    const trySeek = () => {
      if (idx >= candidates.length) return finish(null);
      const t = candidates[idx++];
      try {
        video.currentTime = t;
      } catch {
        finish(null);
      }
    };

    video.addEventListener("loadedmetadata", () => {
      candidates = seekCandidates(video.duration);
      trySeek();
    });

    video.addEventListener("seeked", () => {
      const res = toDataUrl();
      if (!res) return trySeek();

      // Om för mörk/svart: prova nästa tidpunkt
      if (res.brightness < 18) return trySeek();

      finish(res.dataUrl);
    });

    video.addEventListener("error", () => finish(null));

    // Timeout-säkring (så inget hänger)
    setTimeout(() => finish(null), 3500);
  });

  videoThumbCache.set(videoSrc, p);
  return p;
}



function renderMedia(album) {
  if (!mediaGrid) return;
  mediaGrid.innerHTML = "";

  // Lazy-load image thumbs nära viewport för snabbare initial rendering
  const ensureLazyObserver = (() => {
    let observer;
    return () => {
      if (observer) return observer;
      if (typeof IntersectionObserver === "undefined") return null;

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          const src = img.dataset.src;
          if (src && !img.src) img.src = src;
          observer.unobserve(img);
        });
      }, { rootMargin: "300px 0px", threshold: 0.01 });

      return observer;
    };
  })();

  const filteredItems = album.items.filter(item =>
    activeAlbumFilter === "all" || item.kind === activeAlbumFilter
  );

  filteredItems.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mediaItem";

    // =========================
    // IMAGE
    // =========================
    if (item.kind === "image") {
      const thumbSrc = item.thumb || item.src;

      btn.innerHTML = `
        <div class="mediaItem__thumb">
          <img alt="${item.title || album.title}" />
          <span class="mediaItem__badge">BILD</span>
        </div>
        <div class="mediaItem__title">${item.title || ""}</div>
      `;

      const img = btn.querySelector("img");

      // Visa kort direkt med "loading"-state (så det inte känns som att inget händer)
      btn.classList.add("is-loading");
      img.loading = index < 10 ? "eager" : "lazy";
      img.decoding = "async";
      img.fetchPriority = index < 6 ? "high" : "auto";

      img.onload = () => { btn.classList.remove("is-loading"); };
      img.onerror = () => { btn.remove(); };

      const obs = ensureLazyObserver();
      if (obs && index >= 10) {
        // Första raderna laddas direkt, resten lazy
        img.dataset.src = thumbSrc;
        obs.observe(img);
      } else {
        img.src = thumbSrc;
      }

      btn.addEventListener("click", () => openInModal(item, album));
      mediaGrid.appendChild(btn);
      return;
    }

    // =========================
    // VIDEO (hover preview)
    // =========================
    btn.innerHTML = `
      <div class="mediaItem__thumb">
        <video class="mediaThumbVideo" muted playsinline preload="metadata"></video>
        <span class="mediaItem__badge">VIDEO</span>
      </div>
      <div class="mediaItem__title">${item.title || ""}</div>
    `;

    const v = btn.querySelector("video");
    v.src = item.src;
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";

    // Förhindrar att knappen "stjäl" hover/click från videon i vissa browsers
    v.style.pointerEvents = "none";

    // Visa en tidig frame (utan att spela)
    const setPreviewFrame = () => {
      try {
        const t = Math.min(0.25, Math.max(0, (v.duration || 1) - 0.1));
        v.currentTime = t;
      } catch {}
    };
    v.addEventListener("loadedmetadata", setPreviewFrame, { once: true });

    // Hover state
    let hovered = false;

    const playOnHover = async () => {
      hovered = true;

      // Starta lite in i videon så man slipper svart frame
      try {
        const t = Math.min(0.25, Math.max(0, (v.duration || 1) - 0.1));
        if (!Number.isNaN(t)) v.currentTime = t;
      } catch {}

      try {
        await v.play(); // muted + playsinline => brukar funka
      } catch {
        // Autoplay kan blockas i vissa lägen, men då står videon kvar på preview frame
      }
    };

    const stopHover = () => {
      hovered = false;
      v.pause();
      // tillbaks till preview frame
      setPreviewFrame();
    };

    btn.addEventListener("mouseenter", playOnHover);
    btn.addEventListener("mouseleave", stopHover);

    // Spara CPU: spela inte om den inte syns
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) {
          v.pause();
        } else {
          // Om användaren hovrar och kortet syns igen -> fortsätt spela
          if (hovered) v.play().catch(() => {});
        }
      });
    }, { threshold: 0.2 });

    io.observe(btn);

    // Klick öppnar i modal (stoppa preview först)
    btn.addEventListener("click", () => {
      v.pause();
      openInModal(item, album);
    });

    mediaGrid.appendChild(btn);
  });
}




// 8) Öppna i din befintliga modal
// Den här bygger på att du redan har #modal, #modalTitle, #modalBody etc.
function openInModal(item, album) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMeta = document.getElementById("modalMeta");
  const modalBody = document.getElementById("modalBody");

  if (!modal || !modalBody || !modalTitle) return;

  modalTitle.textContent = item.title || album.title;
  if (modalMeta) modalMeta.textContent = album.title;

  // rensa
  modalBody.innerHTML = "";

  if (item.kind === "image") {
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.title || album.title;
    img.className = "modalMedia";
    img.style.borderRadius = "16px";
    modalBody.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = item.src;
    video.controls = true;
    video.playsInline = true;
    video.className = "modalMedia";
    video.style.borderRadius = "16px";
    modalBody.appendChild(video);
  }

  modal.setAttribute("aria-hidden", "false");
  modal.classList.add("is-open");
}

// Service galleries: click-to-enlarge (works on any page)
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-modal-src]");
  if (!trigger) return;

  const src = trigger.getAttribute("data-modal-src");
  if (!src) return;

  const title = trigger.getAttribute("data-modal-title") || "";
  const meta = trigger.getAttribute("data-modal-meta") || "";

  openInModal(
    { kind: "image", src, title },
    { title: meta || "" }
  );
});

// 9) Filter events
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter || "all";

    // om albumPanel är öppet: stäng och gå tillbaka
    if (albumPanel && !albumPanel.hidden) {
      albumPanel.hidden = true;
      mediaGrid.innerHTML = "";
      albumGrid.style.display = "";
    }

    renderAlbums();
  });
});

// 10) init
// (rendering is handled by initPortfolio() below)



// FAQ (robust)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".faq__q");
  if (!btn) return;

  const wrap = btn.closest(".faq");
  const answer = btn.nextElementSibling;

  if (!wrap || !answer || !answer.classList.contains("faq__a")) return;

  const isOpen = btn.getAttribute("aria-expanded") === "true";

  // Stäng alla
  wrap.querySelectorAll(".faq__q").forEach((q) => {
    q.setAttribute("aria-expanded", "false");
    const a = q.nextElementSibling;
    if (a && a.classList.contains("faq__a")) a.style.display = "none";
    const i = q.querySelector(".faq__i");
    if (i) i.textContent = "+";
  });

  // Öppna klickad (om den var stängd)
  if (!isOpen) {
    btn.setAttribute("aria-expanded", "true");
    answer.style.display = "block";
    const i = btn.querySelector(".faq__i");
    if (i) i.textContent = "–";
  }
});


// ===============================
// Live Foto – auto från manifest
// ===============================

// Fallback-lista om manifest inte kan hämtas (t.ex. om du öppnar sidan via file://)
// Håll denna i sync med assets/portfolio/albums/livefoto/manifest.json
const LIVEFOTO_FILES_FALLBACK = [
  "_DSC0319.JPG",
  "_DSC0330.JPG",
  "_DSC0448.JPG",
  "DSC_0008.JPG",
  "DSC_0010.JPG",
  "DSC_0113.JPG",
  "DSC_0200.JPG",
  "DSC_0281.JPG",
  "DSC_0311.JPG",
  "DSC01457_resultat.png",
  "DSC01465_resultat.png",
  "DSC01534_resultat.png",
  "DSC01546_resultat.png",
  "DSC01582_resultat.png",
  "DSC01597_resultat.png",
  "DSC01605_resultat.png",
  "DSC01610_resultat.png",
  "DSC01625_resultat.png",
  "DSC01654_resultat.png",
  "DSC01656_resultat.png",
  "DSC01766_resultat.png",
  "DSC01769_resultat.png",
  "DSC01771_resultat.png",
  "DSC01779_resultat.png",
  "DSC01792_resultat.png",
  "DSC08600.JPG",
  "DSC08612.JPG",
  "DSC08629.JPG",
  "DSC08638.JPG",
  "DSC09111.JPG",
  "DSC09813.JPG",
  "SoundersBirka (96).JPG",
  "SoundersBirka (97).JPG",
  "SoundersBirka (100).JPG",
  "SoundersBirka (112).JPG",
  "SoundersBirka (243).JPG",
  "SoundersBirka (507).JPG",
  "SoundersBirka (515).JPG",
  "SoundersBirka (525).JPG",
  "SoundersBirka (553).JPG",
  "SoundersBirka (567).JPG",
  "SoundersBirka (571).JPG",
  "SoundersBirka (589).JPG",
];

// Hämtar livefoto-items från manifest (rekommenderat)
// Robust fallback: LIVEFOTO_FILES_FALLBACK (så funkar även utan lokal server)
async function createLiveFotoItems() {
  const basePath = "assets/portfolio/albums/livefoto/";
  const manifestUrl = `${basePath}manifest.json`;

  const isFileProtocol = typeof location !== "undefined" && location.protocol === "file:";

  // Cache-bust så nya uppladdningar syns direkt efter refresh.
  // OBS: På file:// fungerar querystring ofta inte för lokala filer.
  const bust = isFileProtocol ? "" : `?v=${Date.now()}`;

  const toItems = (files, titlePrefix) => {
    const safeFiles = (Array.isArray(files) ? files : [])
      .map(f => (typeof f === "string" ? f.trim() : ""))
      .filter(Boolean);

    const prefix = (titlePrefix || "Live Foto").toString();

    return safeFiles.map((file, idx) => ({
      kind: "image",
      src: `${basePath}${file}${bust}`,
      title: `${prefix} ${idx + 1}`
    }));
  };

  // Om man öppnar HTML-filen direkt (file://) kan fetch mot json bli blockad.
  if (isFileProtocol) {
    return toItems(LIVEFOTO_FILES_FALLBACK, "Live Foto");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(manifestUrl + bust, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error("manifest not found");

    const data = await res.json();
    return toItems(data.files, data.titlePrefix);
  } catch (e) {
    return toItems(LIVEFOTO_FILES_FALLBACK, "Live Foto");
  }
}

// ===============================
// Övriga bilder – fotografi (manifest)
// ===============================

async function createOvrigtItems() {
  const basePath = "assets/portfolio/ovrigt/images/";
  const manifestUrl = "assets/portfolio/ovrigt/manifest.json";

  const bust = `?v=${Date.now()}`;

  try {
    const res = await fetch(manifestUrl + bust, { cache: "no-store" });
    if (!res.ok) throw new Error("manifest not found");

    const data = await res.json();
    const files = Array.isArray(data.files) ? data.files : [];
    const prefix = (data.titlePrefix || "Övrig bild").toString();

    return files.map((file, idx) => ({
      kind: "image",
      src: `${basePath}${file}${bust}`,
      title: `${prefix} ${idx + 1}`,
    }));
  } catch (e) {
    return [];
  }
}

// Försök läsa in ett manifest för ett album (så du kan slänga in videor i en mapp)
async function loadAlbumManifest(album) {
  if (!album || !album.id) return;

  const baseCandidates = [
    `assets/portfolio/albums/${album.id}/`,
    `assets/portfolio/${album.id}/`,
  ];

  const bust = `?v=${Date.now()}`;

  for (const base of baseCandidates) {
    const manifestUrl = `${base}manifest.json`;
    try {
      const res = await fetch(manifestUrl + bust, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      const files = Array.isArray(data.files) ? data.files : [];

      const prefix = (data.titlePrefix || album.title || "Item").toString();

      const existing = new Set((album.items || []).map(i => (i && i.src) || ""));
      const newItems = files.map((f, idx) => {
        if (typeof f === "string") {
          const file = f.trim();
          const ext = (file.split('.').pop() || '').toLowerCase();
          const kind = ['mp4','webm','ogg'].includes(ext) ? 'video' : 'image';
          return { kind, src: `${base}${file}${bust}`, title: `${prefix} ${idx + 1}` };
        }
        // om manifesten redan innehåller objekt
        if (typeof f === 'object' && f !== null) {
          const ext = (String(f.src || '').split('.').pop() || '').toLowerCase();
          const kind = f.kind || (['mp4','webm','ogg'].includes(ext) ? 'video' : 'image');
          return { kind, src: `${base}${f.src}${bust}`, title: f.title || `${prefix}` };
        }
        return null;
      }).filter(Boolean).filter(it => !existing.has(it.src));

      if (newItems.length) {
        album.items = (album.items || []).concat(newItems);
      }

      // Om vi hittade en manifest och processed it, avsluta
      return;
    } catch (e) {
      // fortsätt till nästa kandidat
    }
  }
}

/*
  ✅ VIKTIGT: I din PORTFOLIO_ALBUMS ska livefoto-albumet se ut såhär.
  Byt bara ut din livefoto-del mot denna:
*/
const LIVEFOTO_ALBUM_TEMPLATE = {
  id: "livefoto",
  title: "Live Foto",
  type: "bild",
  desc: "Bilder tagna direkt på scen!",
  thumb: "assets/portfolio/albums/promo/live.png",
  items: [], // fylls vid init
};

// ===============================
// Init – laddar livefoto först
// ===============================

// Ersätt din nuvarande "renderAlbums();" längst ner med denna init.
// (Den kommer själv kalla renderAlbums när livefoto är klart.)
async function initPortfolio() {
  // Om du redan har PORTFOLIO_ALBUMS definierad ovan, så hittar vi livefoto-albumet:
  const liveAlbum = PORTFOLIO_ALBUMS.find(a => a.id === "livefoto");
  const ovrigtAlbum = PORTFOLIO_ALBUMS.find(a => a.id === "ovrigt");

  if (liveAlbum) {
    liveAlbum.items = await createLiveFotoItems();
  }

  if (ovrigtAlbum) {
    ovrigtAlbum.items = await createOvrigtItems();
  }

  // Försök läsa manifest för varje album så lokala videofiler/bilder i mappar tas med
  for (const album of PORTFOLIO_ALBUMS) {
    // hoppa över om album redan har items
    try {
      await loadAlbumManifest(album);
    } catch (e) {
      // ignorer
    }
  }

  renderAlbums();
}

// Kör init
initPortfolio();


(() => {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  if (!form) return;

  const setStatus = (msg, ok = true) => {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.opacity = msg ? "1" : "0";
    statusEl.style.color = ok ? "" : "rgba(255,170,170,.95)";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // enkel validering
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const prevText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Skickar…";
    }
    setStatus("Skickar…");

    try {
      const formData = new FormData(form);

      // Lägg till subject så mailen blir tydlig
      const topic = formData.get("topic") || "Kontakt";
      const name = formData.get("name") || "Okänd";
      formData.append("_subject", `[${topic}] Ny förfrågan från ${name}`);

      const res = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" },
      });

      if (res.ok) {
        form.reset();
        setStatus("Skickat! Jag återkommer så snart jag kan. ✅", true);
      } else {
        setStatus("Något gick fel. Testa igen eller maila mig direkt. ❌", false);
      }
    } catch (err) {
      setStatus("Nätverksfel. Testa igen om en stund. ❌", false);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevText || "Skicka";
      }
    }
  });
})();

(() => {
  const contactForm = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  if (!contactForm) return;

  const setStatus = (msg, ok = true) => {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.opacity = msg ? "1" : "0";
    statusEl.style.color = ok ? "" : "rgba(255,170,170,.95)";
  };

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation(); // viktigt om nåt annat lyssnar

    // Native validering (det är det som visar “fyll i detta fält”)
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const btn = contactForm.querySelector('button[type="submit"]');
    const prevText = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Skickar…";
    }
    setStatus("Skickar…");

    try {
      const formData = new FormData(contactForm);

    const topic = (formData.get("topic") || "Kontakt").toString();
    const name = (formData.get("name") || "Okänd").toString();
    const phone = (formData.get("phone") || "").toString().trim();

    formData.append("_subject", `[${topic}] Ny förfrågan från ${name}${phone ? " • " + phone : ""}`);


      formData.append("_subject", `[${topic}] Ny förfrågan från ${name}`);

      const res = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        contactForm.reset();
        setStatus("Skickat! Jag återkommer så snart jag kan. ✅", true);
        toast("Skickat ✅");
      } else {
        setStatus("Något gick fel. Testa igen eller maila mig direkt. ❌", false);
        toast("Något gick fel ❌");
      }
    } catch {
      setStatus("Nätverksfel. Testa igen om en stund. ❌", false);
      toast("Nätverksfel ❌");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevText || "Skicka";
      }
    }
  });
})();

/* =========================
   CHATBOT (Ai-Roffe)
   ========================= */

const chatbotBtn = $("#chatbotBtn");
const chatModal = $("#chatModal");
const chatCloseBtn = $("#chatCloseBtn");
const chatBackdrop = $("#chatBackdrop");
const chatInput = $("#chatInput");
const chatSendBtn = $("#chatSendBtn");
const chatMessages = $("#chatMessages");

// Öppna chat
if (chatbotBtn) {
  chatbotBtn.addEventListener("click", () => {
    chatModal.setAttribute("aria-hidden", "false");
    chatInput?.focus();
  });
}

// Stäng chat
if (chatCloseBtn) {
  chatCloseBtn.addEventListener("click", () => {
    chatModal.setAttribute("aria-hidden", "true");
  });
}

if (chatBackdrop) {
  chatBackdrop.addEventListener("click", () => {
    chatModal.setAttribute("aria-hidden", "true");
  });
}

// Detektera språk
function detectLanguage(text) {
  const englishWords = /hello|hi|hey|what|how|where|when|why|help|contact|price|service|portfolio|video|photo|band|organizer|event|thank|thanks/i;
  const swedishWords = /hej|hallo|vad|hur|var|när|varför|hjälp|kontakt|pris|tjänst|portfolio|video|bild|band|arrangör|event|tack|dansmedia/i;
  
  const englishMatches = (text.match(englishWords) || []).length;
  const swedishMatches = (text.match(swedishWords) || []).length;
  
  // Kolla efter explicit engelska ord först
  if (text.match(/^(hi|hello|hey|what|how|where|contact me|price|service)/i)) {
    return "en";
  }
  
  return englishMatches > swedishMatches ? "en" : "sv";
}

// Utökad kunskapsbas för svenska
const knowledgebaseSV = {
  // TJÄNSTER
  videor: "Vi skapar marknadsföringsvideoer för band!\n✅ Videor inför spelningar\n✅ Livesessions & recordings\n✅ Teaser & promo-videos\n✅ Event-sammanfattningar\n\nVill du veta mer om något specifikt?",
  
  bilder: "Vi fotograferar och redigerar professionellt!\n✅ Livefoto på spelningar\n✅ Band-fotoshooter\n✅ Event-fotografering\n✅ Höga upplösningar för sociala medier\n\nKontakta mig för prissättning!",
  
  hemsida: "Hemsideskapande för band!\n✅ Responsive design\n✅ Enkel att uppdatera\n✅ Tour-kalender\n✅ Musik & bilder-sektion\n✅ Kontaktformulär\n\nVill du diskutera ditt projekt?",
  
  content: "Vi skapar löpande marknadsföringsmaterial!\n✅ Instagram-stories\n✅ TikTok-videos\n✅ Facebook-inlägg\n✅ Snabb turnaround\n✅ Anpassat efter din stil\n\nMåndlig prenumeration tillgänglig!",
  
  // PRISER & PAKET
  pris: "Våra priser anpassas helt efter dina behov!\n\nExempel:\n💬 Mindre event: från 1-2 timmar\n🎬 Videopaket: flexibelt efter omfattning\n📸 Foto-session: variabel längd\n💻 Hemsideskapande: prisas individuellt\n\nKontakta för personlig offert:\n070 098 45 95",
  
  arrangor: "För arrangörer erbjuder vi flexibel prissättning!\n✅ Sociala medier-material\n✅ Affischer & presskit\n✅ Video-sammanfattningar\n✅ Campaign-material\n✅ Allt efter era behov\n\nBesök arrangor-sidan eller ring!",
  
  // KONTAKT
  kontakt: "Kontakta mig här:\n\n📞 070 098 45 95\n📧 dansmedian@gmail.com\n🕐 Svarstid: Inom 12 timmar\n\nDu kan också fylla i kontaktformuläret på sidan!",
  
  // LEVERANSTID
  leverans: "Leveranstider:\n⚡ Express (24h): Rush-avgift\n📅 Standard (1-2 veckor): Normalpriser\n🚀 Snabb turnaround: Möjligt för många projekt\n\nBeror på projektets omfattning. Diskutera med Simon!",
  
  // PORTFOLIO
  portfolio: "Se vår portfolio för inspiration!\n✅ Tidigare band-projekt\n✅ Event-fotografering\n✅ Videosammanfattningar\n✅ Hemsidor vi gjort\n✅ Sociala medier-kampanjer\n\nBesök portfolio-sidan för exempel!",
  
  // OM SIMON
  simon: "Simon Rosenius driver Dansmedia!\n\n✅ Specialist på band-marknadsföring\n✅ Videograf & fotograf\n✅ Webbutvecklare\n✅ Erfarenhet från många band\n\nMöt Simon: Besök Om mig-sidan!",
  
  // ALLMÄNNA FRÅGOR
  vad: "Vi skapar marknadsföringsmaterial för band och arrangörer!\n\n✅ Videoproduktion\n✅ Fotografering\n✅ Hemsidor\n✅ Sociala medier-content\n✅ Livefoto\n\nVill du veta mer om något specifikt?",
  
  hur: "Kontakta mig för att diskutera ditt projekt:\n\n1️⃣ Ring eller maila\n2️⃣ Berätta vad du behöver\n3️⃣ Få offert & tidsplan\n4️⃣ Vi levererar professionellt material\n\n📞 070 098 45 95",
  
  // SPECIFIKA TJÄNSTER
  livefoto: "Vi fotograferar livespelningar!\n✅ Professionell utrustning\n✅ Höga upplösningar\n✅ Redigerad material inom dagar\n✅ Klart för sociala medier\n\nPerfekt för dokumentation och marknadsföring!",
  
  sociala: "Vi skapar material för sociala medier!\n✅ Instagram-posts & stories\n✅ TikTok-videos\n✅ Facebook-content\n✅ YouTube-teasers\n✅ Rätt format & storlek\n\nAllt klart att posta direkt!",
  
  retainer: "Retainer-upplägg = löpande samarbete!\n✅ Fast pris per månad\n✅ Regelbubnden content\n✅ Dedikerad support\n✅ Flexibelt antal produktioner\n✅ Perfekt för aktiva band\n\nKontakta för möjligheter!",
  
  // PRAKTISKA FRÅGOR
  hur_beta: "Betala via överföring, Swish eller kontant.\nBetalningsvillkor diskuteras individuellt.",
  
  garanterar: "Jag garanterar professionell kvalitet och snabb leverans!",
  
  revision: "Obegränsade ändringar ingår - du bestämmer när det är perfekt!",
  
  // BAND-SPECIFIKT
  band: "Vi specialiserar oss på band-marknadsföring!\n✅ Spelnings-teaser\n✅ Bandporträtt\n✅ Studio-dokumentation\n✅ Tour-material\n✅ Albumrelease-kampanjer\n\nVill du se exempel?",
  
  spelning: "För spelningar erbjuder vi:\n✅ Livefoto-dokumentation\n✅ Video-sammanfattning\n✅ Sociala medier-content\n✅ Pressmeddelanden\n✅ Quick turnaround\n\nKontakta mig för pris!",
  
  // TEKNISKA ASPEKTER
  format: "Vi levererar i alla format!\n✅ JPG/PNG för webben\n✅ RAW för egen redigering\n✅ 4K-video\n✅ Social media-format\n✅ Print-ready\n\nVad behöver du?",
  
  arkivering: "Allt material arkiveras säkert.\nDu får kopior av allt och kan använda det hur du vill!",
  
  // SKYDD & JURIDIK
  upphovsratt: "Du äger det material vi skapar för dig!\nDu kan använda det för marketing, streaming, vad som helst.",
  
  // INSPIRERANDE FRÅGOR
  varfor_vi: "Varför välja oss?\n✅ Snabb & professionell service\n✅ Priser efter dina behov\n✅ Längre erfarenhet\n✅ Personal support från Simon\n✅ Allt från foto till hemsideskapande\n\nEnklare än att anställa flera personer!",
  
  // OMÖJLIGA FRÅGOR - BÄTTRE FALLBACK
  fallback_sv: "Det är en bra fråga! 🤔\n\nJag kan inte svara precis på denna, men Simon kan det!\n\nKontakta direkt:\n📞 070 098 45 95\n📧 dansmedian@gmail.com\n\nVi svarar inom 12 timmar!"
};

// Utökad kunskapsbas för engelska
const knowledgebaseEN = {
  // SERVICES
  video: "We create marketing videos for bands!\n✅ Pre-gig teaser videos\n✅ Live sessions & recordings\n✅ Promo & event videos\n✅ Live performance summaries\n\nWant to know more?",
  
  photography: "Professional photography & editing!\n✅ Live gig photos\n✅ Band photo shoots\n✅ Event photography\n✅ High-res for social media\n\nContact me for pricing!",
  
  website: "We build websites for bands!\n✅ Responsive design\n✅ Easy to update\n✅ Tour calendar\n✅ Music & photo sections\n✅ Contact forms\n\nWant to discuss your project?",
  
  content: "We create ongoing marketing content!\n✅ Instagram stories\n✅ TikTok videos\n✅ Facebook posts\n✅ Quick turnaround\n✅ Customized to your style\n\nMonthly subscriptions available!",
  
  // PRICING
  price: "Our prices adapt to your needs!\n\nExamples:\n💬 Small events: from 1-2 hours\n🎬 Video packages: flexible scope\n📸 Photo session: variable length\n💻 Website: priced individually\n\nContact for personalized quote:\n+46 70 098 45 95",
  
  organizer: "For organizers we offer flexible pricing!\n✅ Social media materials\n✅ Posters & press kits\n✅ Video summaries\n✅ Campaign materials\n✅ Everything tailored to your needs\n\nVisit organizer page or call!",
  
  // CONTACT
  contact: "Contact me here:\n\n📞 +46 70 098 45 95\n📧 dansmedian@gmail.com\n🕐 Response time: Within 12 hours\n\nYou can also fill the contact form on the site!",
  
  // DELIVERY
  delivery: "Delivery times:\n⚡ Express (24h): Rush fee\n📅 Standard (1-2 weeks): Regular pricing\n🚀 Quick turnaround: Possible for many projects\n\nDepends on project scope. Discuss with Simon!",
  
  // PORTFOLIO
  portfolio: "Check our portfolio for inspiration!\n✅ Previous band projects\n✅ Event photography\n✅ Video summaries\n✅ Websites we've built\n✅ Social media campaigns\n\nVisit portfolio page for examples!",
  
  // ABOUT SIMON
  simon: "Simon Rosenius runs Dansmedia!\n\n✅ Specialist in band marketing\n✅ Videographer & photographer\n✅ Web developer\n✅ Experience from many bands\n\nMeet Simon: Visit About page!",
  
  // GENERAL QUESTIONS
  what: "We create marketing materials for bands and organizers!\n\n✅ Video production\n✅ Photography\n✅ Websites\n✅ Social media content\n✅ Live photography\n\nWant to know more about something specific?",
  
  how: "Contact me to discuss your project:\n\n1️⃣ Call or email\n2️⃣ Tell me what you need\n3️⃣ Get quote & timeline\n4️⃣ We deliver professional material\n\n📞 +46 70 098 45 95",
  
  // SPECIFIC SERVICES
  livephoto: "We photograph live performances!\n✅ Professional equipment\n✅ High resolution\n✅ Edited material within days\n✅ Ready for social media\n\nPerfect for documentation and marketing!",
  
  social: "We create social media content!\n✅ Instagram posts & stories\n✅ TikTok videos\n✅ Facebook content\n✅ YouTube teasers\n✅ Right format & size\n\nReady to post immediately!",
  
  retainer: "Retainer agreement = ongoing collaboration!\n✅ Fixed monthly price\n✅ Regular content\n✅ Dedicated support\n✅ Flexible number of productions\n✅ Perfect for active bands\n\nContact for options!",
  
  // PRACTICAL QUESTIONS
  payment: "Payment via bank transfer, Swish, or cash.\nPayment terms discussed individually.",
  
  quality: "I guarantee professional quality and fast delivery!",
  
  revisions: "Unlimited revisions included - you decide when it's perfect!",
  
  // BAND-SPECIFIC
  band: "We specialize in band marketing!\n✅ Gig teasers\n✅ Band portraits\n✅ Studio documentation\n✅ Tour materials\n✅ Album release campaigns\n\nWant to see examples?",
  
  gig: "For gigs we offer:\n✅ Live photo documentation\n✅ Video summary\n✅ Social media content\n✅ Press releases\n✅ Quick turnaround\n\nContact me for pricing!",
  
  // TECHNICAL ASPECTS
  format: "We deliver in all formats!\n✅ JPG/PNG for web\n✅ RAW for editing\n✅ 4K video\n✅ Social media formats\n✅ Print-ready\n\nWhat do you need?",
  
  archive: "All material is safely archived.\nYou get copies of everything and can use it however you want!",
  
  // RIGHTS & LEGAL
  copyright: "You own the material we create for you!\nYou can use it for marketing, streaming, anything you want.",
  
  // INSPIRING QUESTIONS
  why: "Why choose us?\n✅ Fast & professional service\n✅ Prices tailored to your needs\n✅ Years of experience\n✅ Personal support from Simon\n✅ Everything from photos to websites\n\nEasier than hiring multiple people!",
  
  // FALLBACK
  fallback_en: "That's a great question! 🤔\n\nI can't answer exactly on this one, but Simon can!\n\nContact directly:\n📞 +46 70 098 45 95\n📧 dansmedian@gmail.com\n\nWe respond within 12 hours!"
};

// Hämta svar baserat på language och keywords
function getAiResponse(userMessage) {
  const lang = detectLanguage(userMessage);
  const msg = userMessage.toLowerCase().trim();
  const kb = lang === "en" ? knowledgebaseEN : knowledgebaseSV;
  
  // Hälsningar
  if (msg.match(/^(hej|hallo|hey|hi|hello|hey there)/i)) {
    return lang === "en" 
      ? "Hi! 👋 I'm Ai-Roffe, DansMedia's assistant. How can I help you today?"
      : "Hej! 👋 Jag är Ai-Roffe, DansMedia:s assistent. Hur kan jag hjälpa dig idag?";
  }
  
  // Sök efter keywords - MYCKET MER OMFATTANDE
  const keywords = {
    sv: [
      { words: /tjänst|vad.*gör|service|vad.*erbjud|vad.*offer/, response: kb.vad },
      { words: /video|videoproduktion|filmning/, response: kb.videor },
      { words: /bild|foto|fotografering|fotoshoot/, response: kb.bilder },
      { words: /hemsida|website|webb|webbutveckling/, response: kb.hemsida },
      { words: /content|instagram|tiktok|facebook|sociala/, response: kb.content },
      { words: /pris|kostnad|hur.*mycket|betala|offert|paket/, response: kb.pris },
      { words: /arrangör|event|festival|spelning|konsert|live/, response: kb.arrangor },
      { words: /kontakt|ring|mail|telefon|skicka|hur.*nå|hur.*kontakt/, response: kb.kontakt },
      { words: /hur|hur.*gör|hur.*funkar|process/, response: kb.hur },
      { words: /leverans|hur.*lång|tid|snabbt|när/, response: kb.leverans },
      { words: /portfolio|exempel|tidigare|projekt|case|band/, response: kb.portfolio },
      { words: /vem.*du|om.*dig|berättar|background|simon/, response: kb.simon },
      { words: /livefoto|live.*foto|live.*photo/, response: kb.livefoto },
      { words: /sociala|instagram|tiktok|facebook|snapchat/, response: kb.sociala },
      { words: /retainer|löpande|prenumeration/, response: kb.retainer },
      { words: /betala|betalning|pris.*betala|hur.*betala/, response: kb.hur_beta },
      { words: /kvalitet|garantera|garantier/, response: kb.garanterar },
      { words: /ändringar|revisions|ändra|omarbeta/, response: kb.revision },
      { words: /band|musikband|artist/, response: kb.band },
      { words: /spelning|gig|konsert|live|auktion/, response: kb.spelning },
      { words: /format|filtyp|jpg|png|raw|4k|4k/, response: kb.format },
      { words: /arkiv|spara|backup|lagring/, response: kb.arkivering },
      { words: /upphovsratt|rättigheter|äga|copyright/, response: kb.upphovsratt },
      { words: /varför|varför.*välja|vad.*bäst|fördelar/, response: kb.varfor_vi },
    ],
    en: [
      { words: /service|what.*do|what.*offer|services/, response: kb.what },
      { words: /video|production|filming|videography/, response: kb.video },
      { words: /photo|photography|photoshoot|picture/, response: kb.photography },
      { words: /website|web|webdev|web.*development/, response: kb.website },
      { words: /content|instagram|tiktok|facebook|social/, response: kb.content },
      { words: /price|cost|how.*much|pay|quote|package/, response: kb.price },
      { words: /organizer|event|festival|gig|concert|show/, response: kb.organizer },
      { words: /contact|call|email|phone|reach|reach.*out/, response: kb.contact },
      { words: /how|how.*work|how.*do|process/, response: kb.how },
      { words: /delivery|how.*long|timing|quick|when/, response: kb.delivery },
      { words: /portfolio|example|previous|project|case/, response: kb.portfolio },
      { words: /who.*are|about.*you|tell.*yourself|background|simon/, response: kb.simon },
      { words: /live.*photo|livephoto|live.*shoot/, response: kb.livephoto },
      { words: /social|instagram|tiktok|facebook|snapchat/, response: kb.social },
      { words: /retainer|ongoing|subscription|recurring/, response: kb.retainer },
      { words: /payment|pay|how.*pay|billing/, response: kb.payment },
      { words: /quality|guarantee|warranty/, response: kb.quality },
      { words: /revision|change|redo|revise/, response: kb.revisions },
      { words: /band|music|artist|group/, response: kb.band },
      { words: /gig|show|concert|live|performance/, response: kb.gig },
      { words: /format|filetype|jpg|png|raw|4k/, response: kb.format },
      { words: /archive|save|backup|storage/, response: kb.archive },
      { words: /copyright|rights|own|ownership/, response: kb.copyright },
      { words: /why|why.*choose|what.*best|benefits/, response: kb.why },
    ]
  };
  
  const langKeywords = keywords[lang];
  for (let item of langKeywords) {
    if (msg.match(item.words)) {
      return item.response;
    }
  }
  
  // Tack
  if (msg.match(/^(tack|thanks|ty|thank.*you|appreciate)/i)) {
    return lang === "en"
      ? "Happy to help! Is there anything else I can help with? 😊"
      : "Gärna! Är det något mer jag kan hjälpa med? 😊";
  }
  
  // Ja/Nej
  if (msg.match(/^(ja|yes|yep|sure|ok|okay)$/i)) {
    return lang === "en"
      ? "Great! What would you like to know? 😊"
      : "Bra! Vad vill du veta? 😊";
  }
  
  // Default fallback - intelligent
  return lang === "en" ? kb.fallback_en : knowledgebaseSV.fallback_sv;
}

// Skicka meddelande
function sendMessage() {
  const userText = chatInput.value.trim();
  if (!userText) return;
  
  // Lägg till användarens meddelande
  addMessage(userText, "user");
  chatInput.value = "";
  
  // Simulera AI-svar med kort delay
  setTimeout(() => {
    const aiResponse = getAiResponse(userText);
    addMessage(aiResponse, "bot");
  }, 300);
}

// Lägg till meddelande i chatt
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `chatMessage chatMessage--${sender}`;
  
  const bubble = document.createElement("div");
  bubble.className = "chatMessage__bubble";
  bubble.textContent = text;
  
  msg.appendChild(bubble);
  chatMessages.appendChild(msg);
  
  // Scrolla ner automatiskt
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Skicka-knapp
if (chatSendBtn) {
  chatSendBtn.addEventListener("click", sendMessage);
}

// Enter-tangent
if (chatInput) {
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

// Initiera med välkomstmeddelande
if (chatMessages) {
  const initMsg = document.createElement("div");
  initMsg.className = "chatMessage chatMessage--bot";
  const bubble = document.createElement("div");
  bubble.className = "chatMessage__bubble";
  bubble.textContent = "Hej! 👋 Jag är Ai-Roffe. Fråga mig vad som helst om DansMedia!";
  initMsg.appendChild(bubble);
  chatMessages.appendChild(initMsg);
}


