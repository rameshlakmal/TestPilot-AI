let lastSuite = null;
let lastPreflight = null;
let lastSelectedSkills = null;
let lastTestCases = [];

function initCustomSelects() {
  const roots = document.querySelectorAll("[data-select]");
  const arrow =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-muted"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clip-rule="evenodd" /></svg>';

  function closeAll() {
    for (const r of roots) {
      const menu = r.querySelector("[data-select-menu]");
      if (!menu) continue;
      menu.classList.add("hidden");
    }
  }

  function render(root) {
    const select = root.querySelector("select");
    const btn = root.querySelector("[data-select-button]");
    const menu = root.querySelector("[data-select-menu]");
    if (!select || !btn || !menu) return;

    const selectedOpt = select.options[select.selectedIndex];
    const label = selectedOpt ? selectedOpt.textContent : "Select";
    btn.innerHTML = `<span class="truncate">${label}</span><span class="ml-3">${arrow}</span>`;

    menu.innerHTML = "";
    for (const opt of Array.from(select.options)) {
      const item = document.createElement("button");
      item.type = "button";
      item.className =
        "w-full text-left px-3 py-2 text-sm text-ink hover:bg-third/25 focus:bg-third/25 focus:outline-none";
      if (opt.value === select.value) {
        item.className += " bg-third/20";
      }
      item.textContent = opt.textContent;
      item.addEventListener("click", () => {
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        render(root);
        menu.classList.add("hidden");
      });
      menu.appendChild(item);
    }
  }

  for (const root of roots) {
    const select = root.querySelector("select");
    const btn = root.querySelector("[data-select-button]");
    const menu = root.querySelector("[data-select-menu]");
    if (!select || !btn || !menu) continue;

    render(root);
    select.addEventListener("change", () => render(root));

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = !menu.classList.contains("hidden");
      closeAll();
      menu.classList.toggle("hidden", isOpen);
    });
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest("[data-select]")) return;
    closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

function $(id) {
  return document.getElementById(id);
}

function setCenteredGeneratorMode(on) {
  const left = $("leftCol");
  const right = $("rightCol");
  if (!left || !right) return;

  if (on) {
    right.classList.add("hidden");
    left.classList.remove("lg:col-span-5");
    left.classList.add("lg:col-start-4", "lg:col-span-6");
  } else {
    right.classList.remove("hidden");
    left.classList.remove("lg:col-start-4", "lg:col-span-6");
    left.classList.add("lg:col-span-5");
  }
}

function setStatus(msg) {
  const el = $("status");
  const text = String(msg || "").trim();
  el.textContent = text;
  el.classList.toggle("hidden", text.length === 0);
}

function setAioStatus(msg) {
  const el = $("aioStatus");
  if (!el) return;
  const text = String(msg || "").trim();
  el.textContent = text;
  el.classList.toggle("hidden", text.length === 0);
}

function setAioResult(text) {
  const el = $("aioResult");
  if (!el) return;
  const t = String(text || "").trim();
  el.textContent = t;
  el.classList.toggle("hidden", t.length === 0);
}

function hasAnyRequirements() {
  const file = $("requirementFile").files[0];
  const text = String($("requirementText").value || "").trim();
  return Boolean(file) || text.length > 0;
}

function updateRequirementUI() {
  const file = $("requirementFile").files[0];
  const text = String($("requirementText").value || "").trim();
  const badge = $("reqBadge");
  const fileLabel = $("fileLabel");

  if (file) fileLabel.textContent = file.name;
  else fileLabel.textContent = "No file selected";

  if (file || text) {
    badge.textContent = "ready";
    badge.className =
      "rounded-full border border-accent/35 bg-accent/10 px-3 py-1 font-mono text-xs text-accent";
  } else {
    badge.textContent = "empty";
    badge.className =
      "rounded-full border border-third/55 bg-primary/35 px-3 py-1 font-mono text-xs text-muted";
  }

  $("generateBtn").disabled = !hasAnyRequirements();
  $("preflightBtn").disabled = !hasAnyRequirements();
}

function listToUl(ul, items) {
  ul.innerHTML = "";
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) {
    const li = document.createElement("li");
    li.textContent = "(none)";
    li.className = "text-muted/70";
    ul.appendChild(li);
    return;
  }
  for (const it of arr) {
    const li = document.createElement("li");
    li.textContent = String(it);
    li.className = "leading-6 text-muted";
    ul.appendChild(li);
  }
}

function skillsToUl(ul, skills) {
  ul.innerHTML = "";
  const arr = Array.isArray(skills) ? skills : [];
  if (arr.length === 0) {
    const li = document.createElement("li");
    li.textContent = "(none)";
    li.className = "text-muted/70";
    ul.appendChild(li);
    return;
  }
  for (const s of arr) {
    const li = document.createElement("li");
    li.textContent = `${s.id} — ${s.title}`;
    li.className = "leading-6 text-muted";
    ul.appendChild(li);
  }
}

function joinLines(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a.map((x, i) => `${i + 1}. ${String(x)}`).join("\n");
}

function renderTable(testCases) {
  const tbody = $("casesTable").querySelector("tbody");
  tbody.innerHTML = "";
  const arr = Array.isArray(testCases) ? testCases : [];

  for (const tc of arr) {
    const tr = document.createElement("tr");
    tr.className = "align-top";

    const cols = [
      { v: tc.id, mono: true },
      { v: tc.title },
      { v: tc.type, mono: true },
      { v: tc.priority, mono: true },
      { v: joinLines(tc.preconditions), multiline: true },
      { v: joinLines(tc.steps), multiline: true },
      { v: joinLines(tc.expected), multiline: true },
      { v: (tc.coverageTags || []).join(", ") },
      { v: (tc.requirementRefs || []).join(", ") }
    ];

    for (const c of cols) {
      const td = document.createElement("td");
      td.className = "px-3 py-3 text-sm leading-6 text-ink/90";
      if (c.multiline) td.className += " whitespace-pre-line";
      if (c.mono) td.className += " font-mono text-xs text-muted";
      td.textContent = String(c.v || "");
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function applyFilters() {
  const q = String($("search").value || "").trim().toLowerCase();
  const type = String($("filterType").value || "").trim();
  const pri = String($("filterPriority").value || "").trim();

  let filtered = lastTestCases.slice();
  if (type) filtered = filtered.filter((t) => String(t.type || "") === type);
  if (pri) filtered = filtered.filter((t) => String(t.priority || "") === pri);
  if (q) {
    filtered = filtered.filter((t) => {
      const hay = [
        t.id,
        t.title,
        (t.coverageTags || []).join(" "),
        (t.requirementRefs || []).join(" ")
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  renderTable(filtered);
  const total = lastTestCases.length;
  $("resultCount").textContent = `Showing ${filtered.length} of ${total}`;
}

function buildClarificationsFromUI() {
  const root = $("clarifyQuestions");
  const cards = root.querySelectorAll("textarea[data-q]");
  const lines = [];
  for (const ta of cards) {
    const q = String(ta.getAttribute("data-q") || "").trim();
    const a = String(ta.value || "").trim();
    if (!q) continue;
    if (!a) continue;
    lines.push(`Q: ${q}`);
    lines.push(`A: ${a}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

function getAnsweredQuestionsSetFromUI() {
  const root = $("clarifyQuestions");
  if (!root) return new Set();
  const tas = root.querySelectorAll("textarea[data-q]");
  const answered = new Set();
  for (const ta of tas) {
    const q = String(ta.getAttribute("data-q") || "").trim();
    const a = String(ta.value || "").trim();
    if (q && a) answered.add(q);
  }
  return answered;
}

function getUnansweredQuestionsFromUI() {
  const root = $("clarifyQuestions");
  if (!root) return [];
  const tas = root.querySelectorAll("textarea[data-q]");
  const out = [];
  for (const ta of tas) {
    const q = String(ta.getAttribute("data-q") || "").trim();
    const a = String(ta.value || "").trim();
    if (q && !a) out.push(q);
  }
  return out;
}

function renderClarifyQuestions(questions) {
  const root = $("clarifyQuestions");
  root.innerHTML = "";
  const qs = Array.isArray(questions) ? questions : [];
  if (qs.length === 0) {
    $("clarify").hidden = true;
    return;
  }

  for (const q of qs) {
    const card = document.createElement("div");
    card.className =
      "rounded-2xl border border-white/10 bg-slate-950/30 p-4";

    const qEl = document.createElement("div");
    qEl.className = "font-mono text-xs text-slate-300";
    qEl.textContent = String(q);

    const ta = document.createElement("textarea");
    ta.placeholder = "Your answer...";
    ta.setAttribute("data-q", String(q));
    ta.className =
      "mt-3 w-full min-h-24 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40 focus:ring-4 focus:ring-sky-500/10";

    card.appendChild(qEl);
    card.appendChild(ta);
    root.appendChild(card);
  }
  $("clarify").hidden = false;
}

async function callPreflight() {
  setStatus("Analyzing requirements and preparing questions...");
  $("preflightBtn").disabled = true;
  $("generateBtn").disabled = true;
  $("results").hidden = true;
  lastSuite = null;
  lastPreflight = null;
  lastSelectedSkills = null;

  try {
    const fd = new FormData();
    fd.set("provider", $("provider").value);
    fd.set("model", $("model").value);
    fd.set("requirementText", $("requirementText").value);
    const file = $("requirementFile").files[0];
    if (file) fd.set("requirementFile", file);

    const res = await fetch("/api/preflight", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data && data.error ? data.error : `Request failed: ${res.status}`);
    }

    lastPreflight = data.preflight;
    lastSelectedSkills = data.selectedSkills;

    // Render Q&A panel
    renderClarifyQuestions(lastPreflight.missingInfoQuestions);
    setStatus(
      `Preflight done. ${Array.isArray(lastPreflight.missingInfoQuestions) ? lastPreflight.missingInfoQuestions.length : 0} question(s) to answer.`
    );

  } catch (err) {
    setStatus(`Error: ${err && err.message ? err.message : String(err)}`);
  } finally {
    $("preflightBtn").disabled = false;
    $("generateBtn").disabled = false;
  }
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(suite) {
  const rows = [];

  // Matches the requested export format.
  rows.push([
    "Test Id",
    "Summary",
    "Priority",
    "TestSteps",
    "ExpectedResults",
    "Story",
    "Test Type",
    "Component",
    "Release",
    "Status",
    "Creator"
  ]);

  const priorityMap = {
    P0: "Highest",
    P1: "High",
    P2: "Med",
    P3: "Low"
  };

  for (const tc of suite.testCases || []) {
    const steps = Array.isArray(tc.steps) ? tc.steps.map(String).join("\n") : "";
    const expected = Array.isArray(tc.expected) ? tc.expected.map(String).join("\n") : "";
    const story = Array.isArray(tc.requirementRefs) ? tc.requirementRefs.map(String).join("; ") : "";
    const pri = priorityMap[String(tc.priority)] || String(tc.priority || "");

    // Our schema does not currently track Manual/Automation/Unit; default to Manual.
    const testType = "Manual";

    rows.push([
      tc.id,
      tc.title,
      pri,
      steps,
      expected,
      story,
      testType,
      "",
      "",
      "",
      ""
    ]);
  }

  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

async function onSubmit(e) {
  e.preventDefault();

  if (!hasAnyRequirements()) {
    setStatus("Add requirements first (file or text).");
    return;
  }

  setStatus("Generating...");
  $("generateBtn").disabled = true;
  $("preflightBtn").disabled = true;
  $("exportJsonBtn").disabled = true;
  $("exportCsvBtn").disabled = true;
  $("results").hidden = true;
  lastSuite = null;

  try {
    const fd = new FormData();
    fd.set("provider", $("provider").value);
    fd.set("model", $("model").value);
    fd.set("depth", $("depth").value);
    fd.set("requirementText", $("requirementText").value);

    const clarifications = buildClarificationsFromUI();
    if (clarifications) fd.set("clarifications", clarifications);

    const file = $("requirementFile").files[0];
    if (file) fd.set("requirementFile", file);

    const res = await fetch("/api/generate-tests", {
      method: "POST",
      body: fd
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data && data.error ? data.error : `Request failed: ${res.status}`);
    }

    const suite = data.suite;
    lastSuite = suite;
    lastTestCases = Array.isArray(suite.testCases) ? suite.testCases : [];

    $("metaProvider").textContent = `provider: ${data.provider}`;
    $("metaModel").textContent = `model: ${data.model}`;
    $("metaDepth").textContent = `depth: ${data.depth}`;
    $("metaRepaired").textContent = `schema repair: ${data.repaired ? "yes" : "no"}`;

    $("suiteTitle").textContent = suite.suiteTitle || "Test suite";
    skillsToUl($("selectedSkills"), data.selectedSkills);

    // Show only missing info questions that are still unanswered.
    const answered = getAnsweredQuestionsSetFromUI();
    const unansweredFromUI = getUnansweredQuestionsFromUI();
    const suiteQs = Array.isArray(suite.missingInfoQuestions) ? suite.missingInfoQuestions : [];
    const remaining = [];

    // Preserve the original order: unanswered UI questions first.
    for (const q of unansweredFromUI) remaining.push(q);
    for (const q of suiteQs) {
      const qs = String(q);
      if (!qs) continue;
      if (answered.has(qs)) continue;
      if (remaining.includes(qs)) continue;
      remaining.push(qs);
    }

    const missingCard = $("missingInfoCard");
    if (remaining.length === 0) {
      if (missingCard) missingCard.classList.add("hidden");
      $("missingInfo").innerHTML = "";
    } else {
      if (missingCard) missingCard.classList.remove("hidden");
      listToUl($("missingInfo"), remaining);
    }

    listToUl($("assumptions"), suite.assumptions);
    listToUl($("risks"), suite.risks);
    renderTable(suite.testCases);
    applyFilters();

    $("results").hidden = false;
    setCenteredGeneratorMode(false);
    $("exportJsonBtn").disabled = false;
    $("exportCsvBtn").disabled = false;
    setStatus(`Done. Generated ${Array.isArray(suite.testCases) ? suite.testCases.length : 0} test cases.`);
  } catch (err) {
    setStatus(`Error: ${err && err.message ? err.message : String(err)}`);
  } finally {
    $("generateBtn").disabled = false;
    $("preflightBtn").disabled = false;
  }
}

$("genForm").addEventListener("submit", onSubmit);

$("preflightBtn").addEventListener("click", callPreflight);

$("generateWithAnswersBtn").addEventListener("click", async () => {
  // Just submit the existing form; clarifications are collected from UI.
  $("genForm").requestSubmit();
});

$("generateWithoutAnswersBtn").addEventListener("click", async () => {
  // Generate even if questions are unanswered.
  $("genForm").requestSubmit();
});

$("clearAnswersBtn").addEventListener("click", () => {
  $("clarifyQuestions").querySelectorAll("textarea").forEach((t) => (t.value = ""));
  setStatus("Answers cleared.");
});

$("search").addEventListener("input", applyFilters);
$("filterType").addEventListener("change", applyFilters);
$("filterPriority").addEventListener("change", applyFilters);

$("requirementText").addEventListener("input", updateRequirementUI);
$("requirementFile").addEventListener("change", updateRequirementUI);

// init
updateRequirementUI();
setStatus("");
setCenteredGeneratorMode(true);
initCustomSelects();

$("exportJsonBtn").addEventListener("click", () => {
  if (!lastSuite) return;
  download("test-suite.json", JSON.stringify(lastSuite, null, 2), "application/json");
});

$("exportCsvBtn").addEventListener("click", () => {
  if (!lastSuite) return;
  download("test-cases.csv", toCsv(lastSuite), "text/csv");
});

$("aioPushBtn").addEventListener("click", async () => {
  if (!lastSuite) {
    setStatus("Generate test cases first.");
    return;
  }

  const jiraProjectId = String($("aioProject").value || "").trim();
  if (!jiraProjectId) {
    setStatus("Enter Jira project key/id for AIO push.");
    return;
  }

  const payload = {
    jiraProjectId,
    folderPath: String($("aioFolder").value || "").trim(),
    aioToken: String($("aioToken").value || "").trim(),
    includeCoverageTags: Boolean($("aioIncludeTags").checked),
    suite: lastSuite
  };

  $("aioPushBtn").disabled = true;
  setAioStatus("Pushing...");
  setAioResult("");

  try {
    const res = await fetch("/api/aio/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data && data.error ? data.error : `Request failed: ${res.status}`);

    const created = Array.isArray(data.created) ? data.created : [];
    const lines = [];
    lines.push(`ok: true`);
    lines.push(`project: ${data.jiraProjectId}`);
    if (data.folder && data.folder.ID) lines.push(`folder: ${data.folder.ID} (${data.folder.name || ""})`);
    lines.push(`created: ${data.createdCount}`);
    for (const c of created.slice(0, 20)) {
      lines.push(`- ${c.id}: ${c.aioCaseKey || c.aioCaseId || "(created)"}`);
    }
    if (created.length > 20) lines.push(`...and ${created.length - 20} more`);

    setAioResult(lines.join("\n"));
    setAioStatus("Done");
  } catch (err) {
    setAioStatus("Failed");
    setAioResult(`error: ${err && err.message ? err.message : String(err)}`);
  } finally {
    $("aioPushBtn").disabled = false;
  }
});
