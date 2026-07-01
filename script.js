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

const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalMeta = $("#modalMeta");
const modalBody = $("#modalBody");
const modalHead = $(".modal__head");
const modalClose = $("#modalClose");

function openInModal(item, album) {
  if (!item) return;

  const title = item.title || album?.title || "Portfolio";
  const meta = album?.title ? album.title : "";

  openModal({
    title,
    meta,
    kind: item.kind === "video" ? "video" : "image",
    src: item.src,
  });
}

function openModal({ title, meta, kind, src, html }) {
  if (!modal || !modalBody || !modalTitle || !modalMeta) return;
  modalTitle.textContent = title || "Portfolio";
  modalMeta.textContent = meta || "";
  modalBody.innerHTML = "";

  const existingDownload = modalHead?.querySelector(".modal__download");
  if (existingDownload) existingDownload.remove();

  if (kind === "video") {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    modalBody.appendChild(iframe);
  } else if (kind === "html") {
    modalBody.innerHTML = html || "";
  } else {
    const wrap = document.createElement("div");
    wrap.className = "modalMediaWrap";

    const img = document.createElement("img");
    img.src = src;
    img.alt = title || "Bild";
    img.className = "modalMedia";

    const watermark = document.createElement("span");
    watermark.className = "watermark";

    wrap.appendChild(img);
    wrap.appendChild(watermark);
    modalBody.appendChild(wrap);

    if (modalHead) {
      const downloadBtn = document.createElement("button");
      downloadBtn.type = "button";
      downloadBtn.className = "modal__download btn btn--small btn--ghost";
      downloadBtn.textContent = "Ladda ner";
      downloadBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        try {
          const response = await fetch(src, { cache: "no-store" });
          if (!response.ok) throw new Error("Could not download image");
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = objectUrl;
          const ext = (src.split(".").pop() || "jpg").split("?")[0] || "jpg";
          const cleanName = (title || "bild").replace(/[^\w.-]+/g, "_");
          link.download = `${cleanName}.${ext}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        } catch (err) {
          console.error("Download failed", err);
          const fallback = document.createElement("a");
          fallback.href = src;
          fallback.download = (title || "bild") + ".jpg";
          fallback.click();
        }
      });
      modalHead.appendChild(downloadBtn);
    }
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

// Attach demo modal handlers to any elements matching .js-work (if present)
const workEls = $$(".js-work");
if (workEls && workEls.length) {
  workEls.forEach(w => {
    w.addEventListener("click", () => {
      openModal({
        title: w.dataset.title,
        meta: `${w.dataset.type?.toUpperCase() || ''} • demo`,
        kind: w.dataset.kind,
        src: w.dataset.src,
      });
    });
  });
}

$("#openShowreel")?.addEventListener("click", () => {
  // Hämta alla video-items från alla album (som har kind === "video")
  const allVideos = PORTFOLIO_ALBUMS
    .flatMap(a => getAlbumItems(a).map(it => ({ ...it, albumTitle: a.title })))
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
// NOTE: PORTFOLIO_ALBUMS_OLD was removed during cleanup; only PORTFOLIO_ALBUMS is used now.


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

// Håller aktuell vald sektion när ett album med sektioner öppnas
let currentAlbumActiveSection = null;

// Album filter
let activeAlbumFilter = "all";
const albumFilters = document.getElementById("albumFilters");

// Helper: return the flattened list of items for an album
function getAlbumItems(album) {
  if (!album) return [];
  if (Array.isArray(album.sections) && album.sections.length) {
    return ([]).concat(...album.sections.map(s => s.items || [])).filter(Boolean);
  }
  return album.items || [];
}

// 4) Render albumkort
function renderAlbums() {
  if (!albumGrid) return;
  albumGrid.innerHTML = "";

  const normActiveFilter = (activeFilter || 'all').toString().trim().toLowerCase();
  const albums = PORTFOLIO_ALBUMS.filter(a => {
    if (normActiveFilter === 'all') return true;
    const t = (a.type || '').toString().trim().toLowerCase();
    return t === normActiveFilter;
  });
  console.debug("renderAlbums: found albums count=", albums.length);

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
  <div class="albumCard__meta">${getAlbumItems(album).length} objekt</div>
      </div>
    `;

    btn.addEventListener("click", () => openAlbum(album.id)); // funkar även om openAlbum är async
    albumGrid.appendChild(btn);
    // append watermark to album thumb
    try {
      const th = btn.querySelector('.albumCard__thumb');
      if (th) {
        const w = document.createElement('span');
        w.className = 'thumb__watermark';
        th.appendChild(w);
        // Add 'NY' badge for newly added albums
        try {
          if (['engdahls', 'streaks'].includes(album.id)) {
            const b = document.createElement('span');
            b.className = 'albumCard__badge albumCard__badge--new';
            b.textContent = 'NYTT BAND';
            th.appendChild(b);
          }
        } catch (e) {}
      }
    } catch (e) {}
  });

    if (!albums.length) {
      albumGrid.innerHTML = `<div class="emptyState"><div class="emptyState__t">Inga album hittades</div><div class="muted">Kontrollera att PORTFOLIO_ALBUMS definieras i script.js och att inga fel stoppar skriptet.</div></div>`;
    }
}

async function openAlbum(albumId) {
  const album = PORTFOLIO_ALBUMS.find(a => a.id === albumId);
  if (!album) return;

  albumTitle.textContent = album.title;
  albumDesc.textContent = album.desc;

  // Reset album filter
  activeAlbumFilter = "all";

  // Reset active section
  currentAlbumActiveSection = null;

  const allItemsForAlbum = getAlbumItems(album);
  const hasVideo = allItemsForAlbum.some(item => item.kind === "video");
  const hasImage = allItemsForAlbum.some(item => item.kind === "image");

  if (albumFilters) {
    albumFilters.style.display = (hasVideo && hasImage) ? "flex" : "none";
    albumFilters.querySelectorAll(".filter--album").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === "all");
    });
  }

  // Sektioner / kategorier (valfritt)
  // Om albumet har en `sections`-array så bygg en enkel sektion-väljare ovanför mediaGrid
  let albumSectionsEl = document.getElementById("albumSections");
  if (!albumSectionsEl) {
    albumSectionsEl = document.createElement('div');
    albumSectionsEl.id = 'albumSections';
    albumSectionsEl.className = 'albumSections';
    // placera innan mediaGrid
    albumPanel.insertBefore(albumSectionsEl, mediaGrid);
  }

  if (Array.isArray(album.sections) && album.sections.length) {
    // By default visa först sektionen som innehåller "Ljungsbro" om den finns, annars första
    const findLjungsbro = album.sections.find(s => /ljungsbro/i.test(s.title));
    currentAlbumActiveSection = findLjungsbro ? findLjungsbro.id : album.sections[0].id;

    albumSectionsEl.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'filter filter--album';
    allBtn.dataset.section = 'all';
    allBtn.textContent = 'Alla';
    albumSectionsEl.appendChild(allBtn);

    album.sections.forEach(sec => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'filter filter--album';
      b.dataset.section = sec.id;
      b.textContent = sec.title;
      albumSectionsEl.appendChild(b);
    });

    // active state
    Array.from(albumSectionsEl.querySelectorAll('.filter--album')).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === 'all' ? currentAlbumActiveSection === null : btn.dataset.section === currentAlbumActiveSection);
    });

    albumSectionsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter--album');
      if (!btn) return;
      const section = btn.dataset.section;
      if (section === 'all') currentAlbumActiveSection = null;
      else currentAlbumActiveSection = section;

      // update active state
      Array.from(albumSectionsEl.querySelectorAll('.filter--album')).forEach(b => {
        b.classList.toggle('active', b.dataset.section === 'all' ? currentAlbumActiveSection === null : b.dataset.section === currentAlbumActiveSection);
      });

      // Rendera valda items
      const items = currentAlbumActiveSection ? (album.sections.find(s => s.id === currentAlbumActiveSection) || {}).items || [] : ([]).concat(...album.sections.map(s => s.items || []));
      renderMedia(album, items);
    });
  } else if (albumSectionsEl) {
    // inget innehåll -> ta bort sektionselementet
    albumSectionsEl.remove();
    albumSectionsEl = null;
  }

  // göm album grid, visa panel
  albumGrid.style.display = "none";
  albumPanel.hidden = false;

  // 1) Rendera direkt (så UI känns instant)
  // Om album har sektioner: rendera aktiv sektion, annars rendera album.items
  if (Array.isArray(album.sections) && album.sections.length) {
    const items = currentAlbumActiveSection ? (album.sections.find(s => s.id === currentAlbumActiveSection) || {}).items || [] : ([]).concat(...album.sections.map(s => s.items || []));
    renderMedia(album, items);
  } else {
    renderMedia(album);
  }

  // Tomt album: visa instruktion istället för blank yta
  if (getAlbumItems(album).length === 0 && mediaGrid) {
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
  const urlsToPreload = getAlbumItems(album)
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
    // remove sections toolbar if present
    const albumSectionsEl = document.getElementById('albumSections');
    if (albumSectionsEl) albumSectionsEl.remove();
    currentAlbumActiveSection = null;
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
      if (!currentAlbum) return;

      // Välj items beroende på aktiv sektion om sådan finns
      let itemsToRender;
      if (Array.isArray(currentAlbum.sections) && currentAlbum.sections.length) {
        if (currentAlbumActiveSection) {
          itemsToRender = (currentAlbum.sections.find(s => s.id === currentAlbumActiveSection) || {}).items || [];
        } else {
          itemsToRender = ([]).concat(...currentAlbum.sections.map(s => s.items || []));
        }
      } else {
        itemsToRender = getAlbumItems(currentAlbum);
      }

      renderMedia(currentAlbum, itemsToRender);
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



function renderMedia(album, items) {
  if (!mediaGrid) return;
  mediaGrid.innerHTML = "";

  // Support passing explicit items (from sections) or derive from album
  const mediaItems = Array.isArray(items) ? items : getAlbumItems(album);

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

  const filteredItems = mediaItems.filter(item =>
    activeAlbumFilter === "all" || item.kind === activeAlbumFilter
  );

  const orderedItems = [...filteredItems].sort((a, b) => {
    const aNew = Number(Boolean(a.isNew));
    const bNew = Number(Boolean(b.isNew));
    return bNew - aNew;
  });

  orderedItems.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mediaItem";

    // =========================
    // IMAGE
    // =========================
    if (item.kind === "image") {
      const thumbSrc = item.thumb || item.src;

      const badgeLabel = item.isNew ? "✦ Ny bild" : "BILD";

      btn.innerHTML = `
        <div class="mediaItem__thumb">
          <img alt="${item.title || album.title}" />
          <span class="mediaItem__badge${item.isNew ? " mediaItem__badge--new" : ""}">${badgeLabel}</span>
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
      // watermark on media thumb
      try {
        const th = btn.querySelector('.mediaItem__thumb');
        if (th) {
          const w = document.createElement('span');
          w.className = 'watermark';
          th.appendChild(w);
        }
      } catch (e) {}
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
    // watermark on video thumb
    try {
      const thv = btn.querySelector('.mediaItem__thumb');
      if (thv) {
        const wv = document.createElement('span');
        wv.className = 'watermark';
        thv.appendChild(wv);
      }
    } catch (e) {}
  });
}




// 1) Definiera album + media (lägg bara in dina filer här)
const PORTFOLIO_ALBUMS = [
  {
    id: "streaplers",
    title: "Streaplers",
    type: "bild",
    desc: "Bilder från Streaplers events och spelningar.",
    thumb: "assets/portfolio/Streaplers/vm.jpg",
    sections: [
      {
        id: "frojden",
        title: "Fröjden (NYHET)",
        items: [
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301757803.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301760803.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301765845.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301768462.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301783109.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301785592.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301787958.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301790404.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301793958.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301796905.jpg", title: "Fröjden" },
          { kind: "image", src: "assets/portfolio/Streaplers/Fröjden/FB_IMG_1781301809546.jpg", title: "Fröjden" },
        ],
      },
      {
        id: "ljungsbro",
        title: "Ljungsbro",
        items: [
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/16_maj_2026_04_11_30.png" , title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01569.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01724.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01725.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01732.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01960.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01969.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01970.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC01990.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC02015.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC02033.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC02042.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Streaplers/Ljungsbro/DSC02337.JPG", title: "Ljungsbro" },
        ],
      },
      {
        id: "nassjo",
        title: "Nässjö",
        items: [
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/19aac251-22c4-4a94-9d58-0f8b4d2a90e3.png", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/dfd51446-bda0-42e5-9664-e02dc2667d61.png", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC01571.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC01665.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC01691.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC01711.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC01715.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07398.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07403.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07412.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07431.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07435.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07443.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07446.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07464.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07468.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07505.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07558.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07618.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07740.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07747.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07754.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07786.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07787.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07899.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07931.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC07944.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08030.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08066.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08087.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08106.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08113.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08241.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08244.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08257.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08275.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08313.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08325.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08327.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/DSC08329.JPG", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/kenn.png", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/Kenny.png", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/kenny2.png", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/Kjetilsson.png", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/S1.png", title: "Nässjö" },
          { kind: "image", src: "assets/portfolio/Streaplers/Nässjö/S2.png", title: "Nässjö" },
        ],
      },
    ],
  },

  {
    id: "msb",
    title: "The Mule Skinner Band, fd Streaplers medlemmar",
    type: "bild",
    desc: "Bilder från The Mule Skinner Band.",
    thumb: "assets/portfolio/MSB/msb.png",
    items: [
      { kind: "image", src: "assets/portfolio/MSB/DSC00737.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00761.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00766.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00774.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00779.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00835.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00852.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00853.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00861.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00913_1.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00923.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC00976.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC01002.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC01043.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC01045.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC01056.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/DSC01058.JPG", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000058071f4bbe5b0335c641af1(1).png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000058071f4bbe5b0335c641af1.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_0000000008c871f4baca11d9b1cba80f.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_000000003f8072439e3811f857161111.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/msb.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000719871f489a1709dacf3cf20.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000b59871f4b8fa1f45302013f0.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000d97871f4a590295ae43aa7e9.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000e4e071f4a0f8c23ae94f6ff4.png", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000ea2071f4b5913bc65c150679.jpg", title: "The Mule Skinner Band" },
      { kind: "image", src: "assets/portfolio/MSB/file_00000000f3cc71f495f51fe54d5721f0.png", title: "The Mule Skinner Band" },
    ],
  },

  {
    id: "blackjack",
    title: "BlackJack",
    type: "bild",
    desc: "Bilder från BlackJack spelningar.",
    thumb: "assets/portfolio/BlackJack/BlackJackgrupp.png",
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

  {
    id: "sounders",
    title: "Sounders Dansorkester",
    type: "video",
    desc: "Videor och bilder från Sounders Dansorkester spelningar och events.",
    thumb: "assets/portfolio/Sounders/sounders.png",
    sections: [
      {
        id: "ljungsbro",
        title: "Ljungsbro Dansfest 2026",
        items: [
          { kind: "image", src: "assets/portfolio/Sounders/DSC01825.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01829.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01836.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01854.JPG", title: "Ljungsbro" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC02018.JPG", title: "Ljungsbro" },

          { kind: "image", src: "assets/portfolio/Sounders/_DSC0319.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/_DSC0330.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/_DSC0448.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC_0008.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC_0010.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC_0113.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC_0200.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC_0281.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC_0311.JPG", title: "Sounders Live" },

          { kind: "image", src: "assets/portfolio/Sounders/DSC01457_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01465_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01534_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01546_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01582_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01597_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01605_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01610_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01625_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01654_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01656_resultat.png", title: "Sounders Live" },

          { kind: "image", src: "assets/portfolio/Sounders/DSC01766_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01769_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01771_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01779_resultat.png", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC01792_resultat.png", title: "Sounders Live" },

          { kind: "image", src: "assets/portfolio/Sounders/DSC08600.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC08612.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC08629.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC08638.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC09111.JPG", title: "Sounders Live" },
          { kind: "image", src: "assets/portfolio/Sounders/DSC09813.JPG", title: "Sounders Live" },

          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (96).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (97).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (100).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (112).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (243).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (507).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (515).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (525).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (553).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (567).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (571).JPG", title: "Birka Gotland" },
          { kind: "image", src: "assets/portfolio/Sounders/SoundersBirka (589).JPG", title: "Birka Gotland" },

          { kind: "image", src: "assets/portfolio/albums/sounders/images/banner.jpg", title: "Sounders Banner" },
          { kind: "image", src: "assets/portfolio/albums/sounders/images/halloween.jpg", title: "Halloween Event" },
          { kind: "image", src: "assets/portfolio/albums/sounders/images/logo.jpg", title: "Sounders Logo" },
          { kind: "image", src: "assets/portfolio/albums/sounders/images/sounders.jpg", title: "Sounders Dansorkester" },
          { kind: "image", src: "assets/portfolio/albums/sounders/images/tackbåt.jpg", title: "Tackbåt Event" },
          { kind: "image", src: "assets/portfolio/albums/sounders/images/tacksundspärlan.jpg", title: "Tacksundspärlan" },
        ],
      },
      {
        id: "videor",
        title: "Videor",
        items: [
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/1.mp4", title: "Sounders Video 1" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/2.mp4", title: "Sounders Video 2" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/3.mp4", title: "Sounders Video 3" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/4.mp4", title: "Sounders Video 4" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/5.mp4", title: "Sounders Video 5" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/6.mp4", title: "Sounders Video 6" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/7.mp4", title: "Sounders Video 7" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/8.mp4", title: "Sounders Video 8" },
          { kind: "video", src: "assets/portfolio/albums/sounders/videos/9.mp4", title: "Sounders Video 9" },
        ],
      },
    ],
  },

  {
    id: "sannex",
    title: "Sannex",
    type: "bild",
    desc: "Bilder från Sannex spelningar och events.",
    thumb: "assets/portfolio/Sannex/Sannexojag.jpg",
    items: [
      { kind: "image", src: "assets/portfolio/Sannex/Sannexojag.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/Sannex.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/Andreas.png", title: "Andreas" },
      { kind: "image", src: "assets/portfolio/Sannex/1acb736d-e746-44d4-a435-489c306da9ed.png", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/5d1d4087-7096-49b4-9ee9-879bb3df11c1.png", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/6a09fdb6-9299-4f72-ad8b-727aa9139ffa.png", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/731843475_122129418897227372_1225905665868743453_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732103130_122129418357227372_6703926488923713268_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732286062_122129417751227372_6307714585477134568_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732442124_122129417211227372_9034061811834644667_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732452408_122129417385227372_1047219213079661859_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732464111_122129417937227372_4608379570716605379_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732477386_122129417205227372_7994004694823980162_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732533431_122129417811227372_3990348838315766650_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732560703_122129417199227372_6874797588526948255_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732561064_122129417445227372_1985395663545216131_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732610555_122129418099227372_1091482678150357908_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732619664_122129418351227372_8694093922907302763_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732629009_122129417889227372_2050604716104589485_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732644586_122129418981227372_1497515922724417858_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732654845_122129418405227372_7327420086702596540_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732680756_122129417271227372_5693237556909207356_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732706636_122129418345227372_7832388222401013339_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732747591_122129418573227372_1056679391394889524_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732764153_122129418687227372_2614830075219569615_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/732908808_122129417829227372_5709791272020168791_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/733171633_122129417583227372_8534284351496037014_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/733209451_122129418819227372_8047307680404138976_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/733271348_122129417871227372_7711717175275269788_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/733575096_122129418795227372_1246428385544563036_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/734022910_122129417739227372_6124531238763822869_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/734472329_122129418861227372_7182921052494789222_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/734942323_122129418429227372_242439924506721747_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/735222751_122129417541227372_4007126960149045414_n.jpg", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/a64f137e-35c4-484c-aed0-79459b7d43de.png", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/b631124d-d8a3-41a2-b6f4-5c8733324e8b.png", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/c97986b2-e97c-4161-b39e-80523c6458d3.png", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/cc1c8875-6477-4ad4-91c0-9148f3a47bed.png", title: "Sannex", isNew: true },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00084.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00122.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00146.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00412.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00429.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00442.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00517.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00552.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00575.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00577.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00620.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00627.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00628.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00655.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC00668.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC06907.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07033.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07039.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07042.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07043.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07055.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07139.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07228.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07262.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07270.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07274.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07309.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07344.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07396.JPG", title: "Sannex" },
      { kind: "image", src: "assets/portfolio/Sannex/DSC07416.JPG", title: "Sannex" },
    ],
  },

  // Engdahls (added)
  {
    id: "engdahls",
    title: "Engdahls",
    type: "bild",
    desc: "Bilder från Engdahls.",
    thumb: "assets/portfolio/Engdahls/eng.png",
    items: [
      { kind: "image", src: "assets/portfolio/Engdahls/1.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/2.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/3.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/4.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/5.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/6.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/7.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/8.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/9.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/10.jpg", title: "Engdahls" },
      { kind: "image", src: "assets/portfolio/Engdahls/11.jpg", title: "Engdahls" },
    ],
  },

  // Streaks (added)
  {
    id: "streaks",
    title: "Streaks",
    type: "bild",
    desc: "Bilder från Streaks.",
    thumb: "assets/portfolio/Streaks/Streaks.png",
    items: [
      { kind: "image", src: "assets/portfolio/Streaks/13_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/14_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/26_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/DSC04654_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/gitarrist_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/keyboardist_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/keyboardizt_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/Prapp_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/trmis_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/trummis_stampad.jpg", title: "Streaks" },
      { kind: "image", src: "assets/portfolio/Streaks/trum_stampad.jpg", title: "Streaks" },
    ],
  },

  {
    id: "perhakans",
    title: "Perhåkans",
    type: "bild",
    desc: "Bilder från Perhåkans spelningar och evenemang.",
    thumb: "assets/portfolio/Perhåkans/ph.jpg",
    items: [
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03525.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03541.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03553.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03558.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03915.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03919.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03925.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03946.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC03983.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC04038.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC04055.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC04057.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC04138.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC04153.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/DSC04156.JPG", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301748970.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301753791.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301763286.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301771128.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301773748.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301778065.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301799922.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/FB_IMG_1781301804887.jpg", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/file_000000002db071f492cb2e3635289aa0.png", title: "Perhåkans" },
      { kind: "image", src: "assets/portfolio/Perhåkans/file_000000004b68720a991607988d4b1e19.png", title: "Perhåkans" },
    ],
  },

  {
    id: "casanovas",
    title: "Casanovas",
    type: "bild",
    desc: "Bilder från Casanovas.",
    thumb: "assets/portfolio/Casanovas/NyGrupp.jpg",
    items: [
      { kind: "image", src: "assets/portfolio/Casanovas/NyGrupp.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/CasanovasGrupp.png", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/2dbb31e4-31fc-455a-bdb2-a9dd8ddc30d5.png", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/728969348_122129049465227372_2071987718501002469_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/729329421_122129049195227372_4571613816886766715_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/729777833_122129046927227372_2723067207784511501_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/729778189_122129048913227372_5542235041074079186_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/729974940_122129049099227372_2838561406431301577_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/730083533_122129049747227372_3153687197072728920_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/730382375_122129046993227372_66242398305774619_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/730474822_122129049249227372_8312164208450328062_n.jpg", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/a907b9b0-cb65-4f77-bee8-ec0a6fdf09c3.png", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/acd1e075-ea67-45be-b592-53a7adeaa51e.png", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/d2711186-cd3f-4d05-9af5-1c50044fb7e4.png", title: "Casanovas", isNew: true },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02630.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02643.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02648.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02652.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02653.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02667.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02671.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02685.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/DSC02892.JPG", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/e996001a-d1f3-453b-986d-8886bbc78429.png", title: "Casanovas" },
      { kind: "image", src: "assets/portfolio/Casanovas/feb48065-69f2-4ecd-90ec-fbc4aa2be2b0.png", title: "Casanovas" },
    ],
  },

  {
    id: "mickeahlgrens",
    title: "Micke Ahlgrens",
    type: "bild",
    desc: "Bilder från Micke Ahlgrens.",
    thumb: "assets/portfolio/MickeAhlgrens/MickeGrupp.png",
    items: [
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/MickeGrupp.png", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/MickeAhl.png", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02462.JPG", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02463.JPG", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02468.JPG", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02478.JPG", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02485.JPG", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02495.JPG", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02512.JPG", title: "Micke Ahlgrens" },
      { kind: "image", src: "assets/portfolio/MickeAhlgrens/DSC02522.JPG", title: "Micke Ahlgrens" },
    ],
  },

  {
    id: "whalstroms",
    title: "Wahlströms",
    type: "bild",
    desc: "Bilder från Wahlströms.",
    thumb: "assets/portfolio/Whalströms/Wahlströms.png",
    items: [
      { kind: "image", src: "assets/portfolio/Whalströms/16_maj_2026_02_49_40.png", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/16_maj_2026_03_21_01.png", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/16_maj_2026_03_35_30.png", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/Wahlströms.png", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC01753.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC01795.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC01807.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC02067.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC02171.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC02179.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC02188.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC02195.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC02197.JPG", title: "Wahlströms" },
      { kind: "image", src: "assets/portfolio/Whalströms/DSC02217.JPG", title: "Wahlströms" },
    ],
  },

  {
    id: "blender",
    title: "Blender",
    type: "bild",
    desc: "Bilder från Blender.",
    thumb: "assets/portfolio/Blender/Blenders.png",
    items: [
      { kind: "image", src: "assets/portfolio/Blender/Blenders.png", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/Blender.png", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/1174dcfd-2d4c-4448-88aa-e9d2756e0b77.png", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/16_maj_2026_03_29_53.png", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/16_maj_2026_04_00_30.png", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/16_maj_2026_04_05_59.png", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/728491025_122129137851227372_5220071880135183089_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/728580582_122129137725227372_8568378921601433670_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/728951315_122129137875227372_5402796847635074997_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/729161059_122129137989227372_2119379467105641608_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/730515842_122129138025227372_6917284710634811069_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/731022981_122129138097227372_3343757545491637809_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/731022983_122129137869227372_3146431933500769239_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/731111486_122129137719227372_7132016307451341053_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/731173252_122129138007227372_3079296019126298120_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/731761406_122129137935227372_8234667455354584460_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/732544969_122129137713227372_6722696926729427673_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/732733270_122129138211227372_3905108587584141255_n.jpg", title: "Blender", isNew: true },
      { kind: "image", src: "assets/portfolio/Blender/DSC01487.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC01491.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02103.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02122.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02125.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02154.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02163.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02164.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02219.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02225.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02238.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02245.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02302.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC02330.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC05104.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC05176.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC05597.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/DSC05651.JPG", title: "Blender" },
      { kind: "image", src: "assets/portfolio/Blender/f2e958b3-6c80-4356-94f5-5dead58a7aaa.png", title: "Blender" },
    ],
  },

  {
    id: "excess",
    title: "Excess",
    type: "bild",
    desc: "Bilder från Excess.",
    thumb: "assets/portfolio/Excess/ExcessGrupp.jpg",
    items: [
      { kind: "image", src: "assets/portfolio/Excess/ExcessGrupp.jpg", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02553.JPG", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02574.JPG", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02575.JPG", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02579.JPG", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02580.JPG", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02607.JPG", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02613.JPG", title: "Excess" },
      { kind: "image", src: "assets/portfolio/Excess/DSC02945.JPG", title: "Excess" },
    ],
  },
];
// (end of PORTFOLIO_ALBUMS)

function loadImage(src) {
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

// Capture current video frame and download with watermark
async function downloadVideoFrameWithWatermark(videoEl, filename) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const logo = await loadImage('assets/logo.png');
    const wW = Math.round(canvas.width * 0.12);
    const aspect = logo.naturalWidth ? (logo.naturalHeight / logo.naturalWidth) : (logo.height / logo.width);
    const wH = Math.round(wW * aspect);
    const margin = Math.round(canvas.width * 0.03);
    ctx.globalAlpha = 0.7;
    ctx.drawImage(logo, canvas.width - wW - margin, canvas.height - wH - margin, wW, wH);
    ctx.globalAlpha = 1;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(false);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        resolve(true);
      }, 'image/jpeg', 0.92);
    });
  } catch (err) {
    console.error('downloadVideoFrameWithWatermark failed', err);
    return false;
  }
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

  const existing = new Set((getAlbumItems(album) || []).map(i => (i && i.src) || ""));
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
        if (Array.isArray(album.items)) {
          album.items = (album.items || []).concat(newItems);
        } else if (Array.isArray(album.sections) && album.sections.length) {
          // append to first section by default
          album.sections[0].items = (album.sections[0].items || []).concat(newItems);
        } else {
          album.items = (album.items || []).concat(newItems);
        }
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

  // Render homepage collage om vi är på startsidan
  try { renderHomepageCollage(); } catch (e) { /* ignore */ }
}

// Kör init
initPortfolio();

// safety re-render a short time later in case manifests or async loads finish after initial render
setTimeout(() => {
  try { renderAlbums(); } catch (e) {}
}, 800);

// Samla bilder från alla album (inklusive sections) och rendera ett collage i #homepageCollage
function renderHomepageCollage({ limit = 5 } = {}){
  const el = document.getElementById('homepageCollage');
  if (!el) return;

  const gather = [];
  for (const a of PORTFOLIO_ALBUMS){
    for (const it of getAlbumItems(a)){
      if (it.kind === 'image' && it.src) gather.push(it.src);
    }
  }

  let unique = Array.from(new Set(gather));
  if (!unique.length) return;

  // If more than limit images, pick `limit` at random
  if (unique.length > limit) {
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = unique[i];
      unique[i] = unique[j];
      unique[j] = tmp;
    }
    unique = unique.slice(0, limit);
  }

  el.innerHTML = '';
  unique.forEach((src) => {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    el.appendChild(img);
  });

  // Preload chosen images
  preloadImages(unique.slice(0, Math.min(6, unique.length)));
}


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


