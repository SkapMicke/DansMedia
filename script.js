const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

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

function openModal({ title, meta, kind, src }) {
  modalTitle.textContent = title || "Portfolio";
  modalMeta.textContent = meta || "";
  modalBody.innerHTML = "";

  if (kind === "video") {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    modalBody.appendChild(iframe);
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

// Contact form (mailto demo)
const form = $("#contactForm");
const formStatus = $("#formStatus");

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  formStatus.textContent = "";

  const data = new FormData(form);
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();
  const topic = (data.get("topic") || "").toString().trim();
  const message = (data.get("message") || "").toString().trim();

  if (!name || !email || !topic || !message) {
    formStatus.textContent = "Fyll i alla fält.";
    toast("Fyll i alla fält ⚠️");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formStatus.textContent = "Skriv en giltig e-post.";
    toast("Ogiltig e-post ⚠️");
    return;
  }

  const subject = encodeURIComponent(`Förfrågan (${topic}) – ${name}`);
  const body = encodeURIComponent(`Namn: ${name}\nE-post: ${email}\nÄmne: ${topic}\n\nMeddelande:\n${message}\n`);
  const to = (emailText?.textContent || "dansmedia@exempel.se").trim();
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

  toast("Öppnar e-post ✉️");
  form.reset();
});

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

// Funktion för att skapa livefoto-items från förväntade filer
function createLiveFotoItems() {
  const basePath = "assets/portfolio/albums/livefoto/";
  const items = [];
  const maxImages = 100; // Stöd för upp till 100 bilder
  
  // Skapa items för sekventiella namn (1.jpg, 2.jpg, ..., 100.jpg)
  for (let i = 1; i <= maxImages; i++) {
    items.push({
      kind: "image",
      src: `${basePath}${i}.jpg`,
      title: `Live Foto ${i}`
    });
  }
  
  return items;
}

// 1) Definiera album + media (lägg bara in dina filer här)
const PORTFOLIO_ALBUMS = [
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
      { kind: "image", src: " attachments/portfolio/albums/sounders/images/tacksundspärlan.jpg", title: "Tacksundspärlan" },
    ],
  },

  {
    id: "bildpaket",
    title: "Bild bank",
    type: "bild",
    desc: "Redo att posta: datum, ort, CTA.",
    thumb: "assets/portfolio/albums/promo/bildbadge.png",
    items: [
      { kind: "image", src: "assets/portfolio/albums/bildpaket/01.jpg", title: "Poster 1" },
      { kind: "image", src: "assets/portfolio/albums/bildpaket/02.jpg", title: "Poster 2" },
    ],
  },

  {
    id: "livefoto",
    title: "Live Foto",
    type: "bild",
    desc: "Bilder tagna direkt på scen!",
    thumb: "assets/portfolio/albums/promo/live.png",
    items: [],
  },
];


// 2) Element refs
const albumGrid = document.getElementById("albumGrid");
const albumPanel = document.getElementById("albumPanel");
const mediaGrid = document.getElementById("mediaGrid");
const albumTitle = document.getElementById("albumTitle");
const albumDesc = document.getElementById("albumDesc");
const albumBackBtn = document.getElementById("albumBackBtn");

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

  // 2) Preloada ALLA thumbnails i albumet i bakgrunden
  // (och även bild-src för image-items om du inte har separata thumbs)
  const urlsToPreload = album.items
    .filter(item => item.kind === "image")
    .map(item => item.thumb || item.src);

  // Kör preload utan att blocka UI
  preloadImages(urlsToPreload, { concurrency: 12 });
}


// 6) Tillbaka
if (albumBackBtn) {
  albumBackBtn.addEventListener("click", () => {
    albumPanel.hidden = true;
    albumGrid.style.display = "";
    mediaGrid.innerHTML = "";
  });
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

      // Dölj bildkort tills den laddat
      btn.style.display = "none";
      img.loading = "eager";
      img.decoding = "async";
      img.fetchPriority = index < 10 ? "high" : "auto";

      img.onload = () => { btn.style.display = ""; };
      img.onerror = () => { btn.remove(); };
      img.src = thumbSrc;

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
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "16px";
    modalBody.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = item.src;
    video.controls = true;
    video.playsInline = true;
    video.style.width = "100%";
    video.style.borderRadius = "16px";
    modalBody.appendChild(video);
  }

  modal.setAttribute("aria-hidden", "false");
  modal.classList.add("is-open");
}

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
renderAlbums();



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

// Hämtar livefoto-items från manifest (rekommenderat)
// Fallback: 1.jpg..100.jpg om manifest saknas
async function createLiveFotoItems() {
  const basePath = "assets/portfolio/albums/livefoto/";
  const manifestUrl = `${basePath}manifest.json`;

  // Cache-bust så nya uppladdningar syns direkt efter refresh
  const bust = `?v=${Date.now()}`;

  try {
    const res = await fetch(manifestUrl + bust, { cache: "no-store" });
    if (!res.ok) throw new Error("manifest not found");

    const data = await res.json();
    const files = Array.isArray(data.files) ? data.files : [];
    const prefix = (data.titlePrefix || "Live Foto").toString();

    return files.map((file, idx) => ({
      kind: "image",
      src: `${basePath}${file}${bust}`,
      title: `${prefix} ${idx + 1}`
    }));
  } catch (e) {
    // Fallback: sekventiella filer 1.jpg..100.jpg
    const items = [];
    const maxImages = 100;
    for (let i = 1; i <= maxImages; i++) {
      items.push({
        kind: "image",
        src: `${basePath}${i}.jpg${bust}`,
        title: `Live Foto ${i}`
      });
    }
    return items;
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

  if (liveAlbum) {
    liveAlbum.items = await createLiveFotoItems();
  }

  renderAlbums();
}

// Kör init
initPortfolio();


// =====================
// Contact form (Formspree)
// =====================
(() => {
  const form = document.querySelector("#contactForm");
  const statusEl = document.querySelector("#formStatus");

  if (!form || !statusEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Enkel front-check
    if (!form.checkValidity()) {
      statusEl.textContent = "Fyll i alla fält.";
      return;
    }

    statusEl.textContent = "Skickar...";

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        form.reset();
        statusEl.textContent = "✅ Skickat! Jag återkommer så snart jag kan.";
      } else {
        statusEl.textContent = "❌ Kunde inte skicka. Testa igen eller maila: dansmedian@gmail.com";
      }
    } catch (err) {
      statusEl.textContent = "❌ Nätverksfel. Testa igen eller maila: dansmedian@gmail.com";
    }
  });
})();
