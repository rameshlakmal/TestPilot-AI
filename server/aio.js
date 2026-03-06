const { truncateText } = require("./util");

function normalizeBaseUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "https://tcms.aiojiraapps.com/aio-tcms";
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

async function aioFetch(opts) {
  const baseUrl = normalizeBaseUrl(opts.baseUrl);
  const token = String(opts.token || "").trim();
  if (!token) throw new Error("AIO token is required");

  const url = baseUrl + opts.path;
  const res = await fetch(url, {
    method: opts.method,
    headers: {
      Authorization: `AioAuth ${token}`,
      Accept: "application/json",
      ...(opts.body
        ? {
            "Content-Type": "application/json"
          }
        : {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`AIO error ${res.status}: ${truncateText(text)}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseFolderPath(folderPath) {
  const raw = String(folderPath || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*(?:\/|>|\\)\s*/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getOrCreateCaseFolderHierarchy(opts) {
  const folderHierarchy = parseFolderPath(opts.folderPath);
  if (folderHierarchy.length === 0) return null;

  return aioFetch({
    baseUrl: opts.baseUrl,
    token: opts.token,
    method: "PUT",
    path: `/api/v1/project/${encodeURIComponent(opts.jiraProjectId)}/testcase/folder/hierarchy`,
    body: {
      baseFolderId: null,
      folderHierarchy
    }
  });
}

async function getCasePriorityList(opts) {
  return aioFetch({
    baseUrl: opts.baseUrl,
    token: opts.token,
    method: "GET",
    path: `/api/v1/project/${encodeURIComponent(opts.jiraProjectId)}/config/testcase/priority`
  });
}

async function getTestScriptTypeList(opts) {
  return aioFetch({
    baseUrl: opts.baseUrl,
    token: opts.token,
    method: "GET",
    path: `/api/v1/project/${encodeURIComponent(opts.jiraProjectId)}/config/testcase/scripttype`
  });
}

function pickPriorityIdByP(p, priorities) {
  const list = Array.isArray(priorities) ? priorities : [];
  const byName = new Map(list.map((x) => [String(x && x.name ? x.name : "").toLowerCase(), x]));

  const want = String(p || "").toUpperCase();
  const candidates =
    want === "P0"
      ? ["critical", "highest", "blocker"]
      : want === "P1"
        ? ["high"]
        : want === "P2"
          ? ["medium", "med", "normal"]
          : want === "P3"
            ? ["low", "lowest", "minor"]
            : [];

  for (const name of candidates) {
    const hit = byName.get(name);
    if (hit && Number.isFinite(hit.ID)) return hit.ID;
  }

  return null;
}

function pickScriptTypeId(scriptTypes) {
  const list = Array.isArray(scriptTypes) ? scriptTypes : [];
  const def = list.find((x) => x && x.isDefault === true && Number.isFinite(x.ID));
  if (def) return def.ID;

  const byName = (n) =>
    list.find((x) =>
      x &&
      Number.isFinite(x.ID) &&
      String(x.name || "").toLowerCase().includes(n)
    );

  const classic = byName("classic");
  if (classic) return classic.ID;

  const first = list.find((x) => x && Number.isFinite(x.ID));
  return first ? first.ID : null;
}

async function createOrGetTags(opts, names) {
  const unique = Array.from(
    new Set(
      (Array.isArray(names) ? names : [])
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .slice(0, 200)
    )
  );

  if (unique.length === 0) return [];

  return aioFetch({
    baseUrl: opts.baseUrl,
    token: opts.token,
    method: "POST",
    path: `/api/v1/project/${encodeURIComponent(opts.jiraProjectId)}/tag`,
    body: unique.map((name) => ({ name }))
  });
}

function buildAioSteps(tc) {
  const steps = Array.isArray(tc.steps) ? tc.steps.map(String) : [];
  const expected = Array.isArray(tc.expected) ? tc.expected.map(String) : [];

  const make = (step, expectedResult) => ({
    stepType: "TEXT",
    step: String(step || "").trim(),
    data: "",
    expectedResult: String(expectedResult || "").trim()
  });

  if (steps.length === 0) {
    return [make(tc.title || "Execute scenario", expected.join("\n"))];
  }

  if (expected.length === steps.length) {
    return steps.map((s, i) => make(s, expected[i]));
  }

  if (expected.length === 1) {
    return steps.map((s, i) => make(s, i === steps.length - 1 ? expected[0] : ""));
  }

  const expectedAll = expected.join("\n");
  return steps.map((s, i) => make(s, i === steps.length - 1 ? expectedAll : ""));
}

function buildAioCaseBody(tc, ctx) {
  const preconditions = Array.isArray(tc.preconditions) ? tc.preconditions.map(String).filter(Boolean) : [];
  const precondition = preconditions.join("\n");

  const descParts = [];
  if (ctx && ctx.suiteTitle) descParts.push(`Generated suite: ${ctx.suiteTitle}`);
  if (tc.type) descParts.push(`Type: ${tc.type}`);
  if (tc.priority) descParts.push(`Priority: ${tc.priority}`);
  if (Array.isArray(tc.coverageTags) && tc.coverageTags.length) descParts.push(`Tags: ${tc.coverageTags.join(", ")}`);
  if (Array.isArray(tc.requirementRefs) && tc.requirementRefs.length) descParts.push(`Requirement refs: ${tc.requirementRefs.join(", ")}`);

  const body = {
    title: String(tc.title || "").trim() || String(tc.id || "Untitled"),
    description: descParts.join("\n"),
    precondition,
    steps: buildAioSteps(tc)
  };

  if (ctx && Number.isFinite(ctx.folderId)) {
    body.folder = { ID: ctx.folderId };
  }

  if (ctx && Number.isFinite(ctx.priorityId)) {
    body.priority = { ID: ctx.priorityId };
  }

  if (ctx && Number.isFinite(ctx.scriptTypeId)) {
    body.scriptType = { ID: ctx.scriptTypeId };
  }

  if (ctx && Array.isArray(ctx.tagIds) && ctx.tagIds.length) {
    body.tags = ctx.tagIds.map((ID) => ({ tag: { ID } }));
  }

  return body;
}

async function createTestCase(opts, body) {
  return aioFetch({
    baseUrl: opts.baseUrl,
    token: opts.token,
    method: "POST",
    path: `/api/v1/project/${encodeURIComponent(opts.jiraProjectId)}/testcase?needDataInRTF=false&uniqueAutoKey=false`,
    body
  });
}

module.exports = {
  normalizeBaseUrl,
  parseFolderPath,
  getOrCreateCaseFolderHierarchy,
  getCasePriorityList,
  getTestScriptTypeList,
  pickPriorityIdByP,
  pickScriptTypeId,
  createOrGetTags,
  buildAioCaseBody,
  createTestCase
};
