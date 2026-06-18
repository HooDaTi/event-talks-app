/**
 * BigQuery Release Notes – frontend logic.
 */

(() => {
  "use strict";

  // ── DOM refs ──────────────────────────────
  const feedEl     = document.getElementById("feed");
  const refreshBtn = document.getElementById("btn-refresh");
  const exportBtn  = document.getElementById("btn-export");
  const tweetBtn   = document.getElementById("btn-tweet");
  const countEl    = document.getElementById("note-count");
  const toastEl    = document.getElementById("toast");


  // ── State ─────────────────────────────────
  let entries = [];
  let selectedId = null;

  // ── Helpers ───────────────────────────────
  function showToast(msg, durationMs = 3000) {
    toastEl.textContent = msg;
    toastEl.classList.add("toast--visible");
    setTimeout(() => toastEl.classList.remove("toast--visible"), durationMs);
  }

  function setLoading(loading) {
    refreshBtn.classList.toggle("btn--loading", loading);
    refreshBtn.disabled = loading;
    exportBtn.disabled = loading || entries.length === 0;
  }


  /** Assign a tag class to <h3> headings inside card bodies. */
  function tagifyHeadings(html) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    wrapper.querySelectorAll("h3").forEach((h3) => {
      const text = h3.textContent.trim().toLowerCase();
      if (text.includes("feature"))       h3.classList.add("tag-feature");
      else if (text.includes("fix"))      h3.classList.add("tag-fix");
      else if (text.includes("issue"))    h3.classList.add("tag-issue");
      else if (text.includes("announce")) h3.classList.add("tag-announcement");
      else                                h3.classList.add("tag-default");
    });
    return wrapper.innerHTML;
  }

  /** Strip HTML tags and collapse whitespace for tweet text. */
  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent.replace(/\s+/g, " ").trim();
  }

  // ── Rendering ─────────────────────────────
  function renderSkeleton() {
    feedEl.innerHTML = "";
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton";
    for (let i = 0; i < 4; i++) {
      skeleton.innerHTML += `
        <div class="skeleton__card">
          <div class="skeleton__bar skeleton__bar--title"></div>
          <div class="skeleton__bar skeleton__bar--text"></div>
          <div class="skeleton__bar skeleton__bar--text"></div>
          <div class="skeleton__bar skeleton__bar--short"></div>
        </div>`;
    }
    feedEl.appendChild(skeleton);
  }

  function renderError(msg) {
    feedEl.innerHTML = `
      <div class="state-message">
        <div class="state-message__icon">⚠️</div>
        <div class="state-message__title">Failed to load release notes</div>
        <p>${msg}</p>
      </div>`;
  }

  function renderEmpty() {
    feedEl.innerHTML = `
      <div class="state-message">
        <div class="state-message__icon">📭</div>
        <div class="state-message__title">No release notes found</div>
        <p>The feed returned zero entries.</p>
      </div>`;
  }

  function renderCards() {
    feedEl.innerHTML = "";
    countEl.innerHTML = `<strong>${entries.length}</strong> release note${entries.length !== 1 ? "s" : ""}`;
    exportBtn.disabled = entries.length === 0;

    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "card" + (entry.id === selectedId ? " card--selected" : "");
      card.dataset.entryId = entry.id;

      card.innerHTML = `
        <span class="card__check">${entry.id === selectedId ? "✓" : ""}</span>
        <div class="card__header">
          <span class="card__date">${entry.display_date}</span>
          <div class="card__actions">
            <button class="card__btn card__btn--copy" title="Skopiuj do schowka">
              <span>📋</span> <span class="copy-label">Skopiuj</span>
            </button>
            <a class="card__link" href="${entry.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
              View in docs ↗
            </a>
          </div>
        </div>
        <div class="card__body">${tagifyHeadings(entry.content)}</div>`;

      // Copy to clipboard listener
      const copyBtn = card.querySelector(".card__btn--copy");
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyToClipboard(entry, copyBtn);
      });

      card.addEventListener("click", () => toggleSelection(entry.id));
      feedEl.appendChild(card);
    });
  }


  // ── Selection ─────────────────────────────
  function toggleSelection(id) {
    selectedId = selectedId === id ? null : id;
    renderCards();
    tweetBtn.disabled = !selectedId;
  }

  // ── Tweet ─────────────────────────────────
  function tweetSelected() {
    const entry = entries.find((e) => e.id === selectedId);
    if (!entry) return;

    const plain = stripHtml(entry.content);
    // Build a concise tweet: date + trimmed content + link
    const maxContentLen = 180;
    const snippet = plain.length > maxContentLen
      ? plain.slice(0, maxContentLen).trimEnd() + "…"
      : plain;

    const text = `📢 BigQuery Release Notes – ${entry.display_date}\n\n${snippet}`;
    const url = entry.link;

    const intentUrl =
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=BigQuery,GoogleCloud`;

    window.open(intentUrl, "_blank", "noopener,width=600,height=460");
    showToast("Tweet window opened!");
  }

  // ── Clipboard & CSV ───────────────────────
  async function copyToClipboard(entry, btnEl) {
    const plain = stripHtml(entry.content);
    const textToCopy = `BigQuery Release Notes – ${entry.display_date}\n\n${plain}\n\nDokumentacja: ${entry.link}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      const labelEl = btnEl.querySelector(".copy-label");
      const originalText = labelEl.textContent;
      labelEl.textContent = "Skopiowano!";
      btnEl.style.borderColor = "var(--green)";
      btnEl.style.color = "var(--green)";
      showToast("Skopiowano do schowka!");
      setTimeout(() => {
        labelEl.textContent = originalText;
        btnEl.style.borderColor = "";
        btnEl.style.color = "";
      }, 2000);
    } catch (err) {
      showToast("Nie udało się skopiować: " + err.message);
    }
  }

  function exportToCSV() {
    if (entries.length === 0) return;

    const headers = ["Date", "URL", "Content (Plain Text)"];
    const rows = entries.map(entry => [
      entry.display_date,
      entry.link,
      stripHtml(entry.content)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(value => {
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(","))
    ].join("\r\n");

    // Use BOM for Excel UTF-8 support
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Wyeksportowano plik CSV!");
  }


  // ── Fetch ─────────────────────────────────
  async function fetchNotes() {
    setLoading(true);
    selectedId = null;
    tweetBtn.disabled = true;
    renderSkeleton();

    try {
      const res = await fetch("/api/notes");
      const data = await res.json();

      if (!data.ok) {
        renderError(data.error || "Unknown server error.");
        return;
      }

      entries = data.entries;
      if (entries.length === 0) {
        renderEmpty();
      } else {
        renderCards();
        showToast(`Loaded ${entries.length} release notes`);
      }
    } catch (err) {
      renderError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Theme Switch ──────────────────────────
  const themeBtn = document.getElementById("btn-theme-toggle");
  const sunIcon = themeBtn.querySelector(".theme-icon--sun");
  const moonIcon = themeBtn.querySelector(".theme-icon--moon");

  function initTheme() {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    }
  }

  themeBtn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    if (isLight) {
      localStorage.setItem("theme", "light");
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      localStorage.setItem("theme", "dark");
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  });

  // Run initialization
  initTheme();

  // ── Init ──────────────────────────────────
  refreshBtn.addEventListener("click", fetchNotes);
  exportBtn.addEventListener("click", exportToCSV);
  tweetBtn.addEventListener("click", tweetSelected);

  // Auto-load on page open
  fetchNotes();
})();

