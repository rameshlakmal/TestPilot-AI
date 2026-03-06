function clampNumber(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function truncateText(text, maxLen) {
  const s = String(text ?? "");
  const max = Number.isFinite(maxLen) ? maxLen : 1200;
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 12)) + "... (truncated)";
}

function coerceString(v) {
  return String(v ?? "");
}

function normalizeStringArray(arr, opts) {
  const options = opts || {};
  const maxItems = Number.isFinite(options.maxItems) ? options.maxItems : 500;
  const maxLen = Number.isFinite(options.maxLen) ? options.maxLen : 500;

  const list = Array.isArray(arr) ? arr : [];
  const out = [];
  for (const it of list) {
    const s = coerceString(it).replace(/\r\n/g, "\n").trim();
    if (!s) continue;
    out.push(s.length > maxLen ? s.slice(0, maxLen) : s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function normalizeSuiteCandidate(obj, opts) {
  const options = opts || {};
  const maxTestCases = Number.isFinite(options.maxTestCases) ? options.maxTestCases : 200;

  const suiteTitle = coerceString(obj && obj.suiteTitle).trim();
  const assumptions = normalizeStringArray(obj && obj.assumptions, { maxItems: 200, maxLen: 240 });
  const risks = normalizeStringArray(obj && obj.risks, { maxItems: 200, maxLen: 240 });
  const missingInfoQuestions = normalizeStringArray(obj && obj.missingInfoQuestions, { maxItems: 200, maxLen: 240 });

  const rawCases = Array.isArray(obj && obj.testCases) ? obj.testCases : [];
  const cases = [];
  for (const tc of rawCases) {
    const id = coerceString(tc && tc.id).trim();
    const title = coerceString(tc && tc.title).trim();
    const type = coerceString(tc && tc.type).trim();
    const priority = coerceString(tc && tc.priority).trim();

    const preconditions = normalizeStringArray(tc && tc.preconditions, { maxItems: 40, maxLen: 300 });
    const steps = normalizeStringArray(tc && tc.steps, { maxItems: 60, maxLen: 360 });
    const expected = normalizeStringArray(tc && tc.expected, { maxItems: 60, maxLen: 360 });
    const coverageTags = normalizeStringArray(tc && tc.coverageTags, { maxItems: 40, maxLen: 80 });
    const requirementRefs = normalizeStringArray(tc && tc.requirementRefs, { maxItems: 40, maxLen: 120 });

    cases.push({
      id,
      title,
      type,
      priority,
      preconditions,
      steps,
      expected,
      coverageTags,
      requirementRefs
    });

    if (cases.length >= maxTestCases) break;
  }

  const result = {
    suiteTitle,
    assumptions,
    risks,
    missingInfoQuestions,
    testCases: cases
  };

  // Preserve optional mermaidDiagram if the LLM returned one
  if (obj && typeof obj.mermaidDiagram === "string" && obj.mermaidDiagram.trim()) {
    result.mermaidDiagram = obj.mermaidDiagram.trim();
  }

  return result;
}

function normalizePreflightCandidate(obj) {
  return {
    assumptions: normalizeStringArray(obj && obj.assumptions, { maxItems: 200, maxLen: 240 }),
    missingInfoQuestions: normalizeStringArray(obj && obj.missingInfoQuestions, { maxItems: 200, maxLen: 240 }),
    ...(Array.isArray(obj && obj.notes)
      ? { notes: normalizeStringArray(obj && obj.notes, { maxItems: 200, maxLen: 240 }) }
      : {})
  };
}

function postProcessSuite(suite, opts) {
  const options = opts || {};
  const maxTestCases = Number.isFinite(options.maxTestCases) ? options.maxTestCases : 200;

  const normalized = normalizeSuiteCandidate(suite, { maxTestCases });
  const rawCases = Array.isArray(normalized.testCases) ? normalized.testCases : [];

  // Dedupe without collapsing distinct titles.
  const seen = new Set();
  const deduped = [];
  for (const tc of rawCases) {
    const key = [
      String(tc.title || "").toLowerCase(),
      String(tc.type || ""),
      String(tc.priority || ""),
      (Array.isArray(tc.steps) ? tc.steps : []).join("\n"),
      (Array.isArray(tc.expected) ? tc.expected : []).join("\n")
    ].join("| ");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(tc);
    if (deduped.length >= maxTestCases) break;
  }

  const renumbered = deduped.map((tc, idx) => {
    const n = String(idx + 1).padStart(3, "0");
    return { ...tc, id: `TC-${n}` };
  });

  return {
    ...normalized,
    testCases: renumbered
  };
}

function postProcessPreflight(preflight) {
  return normalizePreflightCandidate(preflight);
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// Best-effort extractor: find the first JSON object in a text response.
function extractFirstJsonObject(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  if (start === -1) return null;

  let inString = false;
  let escape = false;
  let depth = 0;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") depth--;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

// Best-effort extractor: find the first JSON object or array in a text response.
function extractFirstJsonValue(text) {
  if (typeof text !== "string") return null;
  const objStart = text.indexOf("{");
  const arrStart = text.indexOf("[");
  if (objStart === -1 && arrStart === -1) return null;

  const start =
    objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
  const open = text[start];
  const close = open === "[" ? "]" : "}";

  let inString = false;
  let escape = false;
  let depth = 0;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === open) depth++;
    if (ch === close) depth--;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

function tokenizeForSimilarity(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function weightedSimilarity(tcA, tcB) {
  const titleA = tokenizeForSimilarity(tcA.title);
  const titleB = tokenizeForSimilarity(tcB.title);
  const stepsA = tokenizeForSimilarity((Array.isArray(tcA.steps) ? tcA.steps : []).join(" "));
  const stepsB = tokenizeForSimilarity((Array.isArray(tcB.steps) ? tcB.steps : []).join(" "));
  const expectedA = tokenizeForSimilarity((Array.isArray(tcA.expected) ? tcA.expected : []).join(" "));
  const expectedB = tokenizeForSimilarity((Array.isArray(tcB.expected) ? tcB.expected : []).join(" "));

  return (
    0.4 * jaccardSimilarity(titleA, titleB) +
    0.4 * jaccardSimilarity(stepsA, stepsB) +
    0.2 * jaccardSimilarity(expectedA, expectedB)
  );
}

function jaccardDedup(testCases, threshold) {
  const thresh = Number.isFinite(threshold) ? threshold : 0.6;
  const kept = [];
  const duplicateGroups = [];

  for (const tc of testCases) {
    let isDup = false;
    for (let i = 0; i < kept.length; i++) {
      const sim = weightedSimilarity(tc, kept[i]);
      if (sim >= thresh) {
        isDup = true;
        duplicateGroups.push({
          kept: kept[i].id,
          duplicate: tc.id,
          similarity: Math.round(sim * 100)
        });
        break;
      }
    }
    if (!isDup) {
      kept.push(tc);
    }
  }

  return { kept, duplicateGroups };
}

function mergeSuites(suites, opts) {
  const options = opts || {};
  const maxTestCases = Number.isFinite(options.maxTestCases) ? options.maxTestCases : 200;

  const mergedTitle = suites
    .map((s) => s.suiteTitle)
    .filter(Boolean)
    .join(" + ") || "Generated Test Suite";

  const allAssumptions = [];
  const allRisks = [];
  const allMissing = [];
  const allCases = [];

  const seenAssumptions = new Set();
  const seenRisks = new Set();
  const seenMissing = new Set();

  for (const suite of suites) {
    for (const a of Array.isArray(suite.assumptions) ? suite.assumptions : []) {
      const key = String(a).toLowerCase().trim();
      if (!seenAssumptions.has(key)) {
        seenAssumptions.add(key);
        allAssumptions.push(a);
      }
    }
    for (const r of Array.isArray(suite.risks) ? suite.risks : []) {
      const key = String(r).toLowerCase().trim();
      if (!seenRisks.has(key)) {
        seenRisks.add(key);
        allRisks.push(r);
      }
    }
    for (const q of Array.isArray(suite.missingInfoQuestions) ? suite.missingInfoQuestions : []) {
      const key = String(q).toLowerCase().trim();
      if (!seenMissing.has(key)) {
        seenMissing.add(key);
        allMissing.push(q);
      }
    }
    for (const tc of Array.isArray(suite.testCases) ? suite.testCases : []) {
      allCases.push(tc);
    }
  }

  const { kept, duplicateGroups } = jaccardDedup(allCases);
  const capped = kept.slice(0, maxTestCases);

  const renumbered = capped.map((tc, idx) => {
    const n = String(idx + 1).padStart(3, "0");
    return { ...tc, id: `TC-${n}` };
  });

  return {
    suite: {
      suiteTitle: mergedTitle,
      assumptions: allAssumptions,
      risks: allRisks,
      missingInfoQuestions: allMissing,
      testCases: renumbered
    },
    duplicateGroups
  };
}

function dedupeBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

module.exports = {
  clampNumber,
  truncateText,
  normalizeStringArray,
  normalizeSuiteCandidate,
  normalizePreflightCandidate,
  postProcessSuite,
  postProcessPreflight,
  safeJsonParse,
  extractFirstJsonObject,
  extractFirstJsonValue,
  dedupeBy,
  jaccardDedup,
  mergeSuites
};
