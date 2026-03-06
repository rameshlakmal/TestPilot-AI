const { dedupeBy } = require("./util");

const ALWAYS_INCLUDE = [
  "general-fallback",
  "functional-core",
  "non-functional-baseline",
  "equivalence-partitioning",
  "boundary-value-analysis",
  "decision-tables",
  "state-transition",
  "pairwise-combinatorial",
  "error-guessing-heuristics",
  "risk-based-prioritization",
  "requirements-to-tests-traceability",
  "feature-decomposition"
];

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreSkillDetailed(skill, requirementText) {
  const hay = tokenize(requirementText);
  if (hay.length === 0) return 0;
  const haySet = new Set(hay);

  const needles = [
    ...tokenize(skill.id),
    ...tokenize(skill.title),
    ...skill.tags.flatMap(tokenize)
  ];

  let score = 0;
  const matchedNeedles = new Set();
  for (const n of needles) {
    if (!n) continue;
    if (haySet.has(n)) {
      score += 3;
      matchedNeedles.add(n);
    }
  }

  // small boosts for common domain hints (helps when you add more skills later)
  const hintMap = [
    { hint: "workflow", boostTag: "states" },
    { hint: "state", boostTag: "states" },
    { hint: "rule", boostTag: "rules" },
    { hint: "decision", boostTag: "rules" },
    { hint: "boundary", boostTag: "boundary" },
    { hint: "range", boostTag: "boundary" },
    { hint: "validation", boostTag: "validation" }
  ];

  const skillTagsLower = new Set(skill.tags.map((t) => String(t).toLowerCase()));
  const boostHits = [];
  for (const { hint, boostTag } of hintMap) {
    if (haySet.has(hint) && skillTagsLower.has(boostTag)) {
      score += 2;
      boostHits.push({ hint, tag: boostTag, points: 2 });
    }
  }

  const matched = Array.from(matchedNeedles).slice(0, 12);
  const boosts = boostHits.slice(0, 8);
  return {
    score,
    matched,
    boosts
  };
}

function scoreSkill(skill, requirementText) {
  const d = scoreSkillDetailed(skill, requirementText);
  return typeof d === "number" ? d : d.score;
}

function selectSkills(allSkills, requirementText, opts) {
  const options = opts || {};
  const maxExtra = Number.isFinite(options.maxExtra) ? options.maxExtra : 6;
  const withScores = options.withScores === true;

  const byId = new Map(allSkills.map((s) => [s.id, s]));
  const selected = [];

  for (const id of ALWAYS_INCLUDE) {
    const s = byId.get(id);
    if (!s) continue;
    if (!withScores) {
      selected.push(s);
      continue;
    }
    const detail = scoreSkillDetailed(s, requirementText);
    selected.push({
      ...s,
      score: typeof detail === "number" ? 0 : detail.score,
      reason: {
        alwaysInclude: true,
        matched: typeof detail === "number" ? [] : detail.matched,
        boosts: typeof detail === "number" ? [] : detail.boosts
      }
    });
  }

  const scored = allSkills
    .filter((s) => !ALWAYS_INCLUDE.includes(s.id))
    .map((s) => ({ s, detail: withScores ? scoreSkillDetailed(s, requirementText) : scoreSkill(s, requirementText) }))
    .map((x) => ({
      s: x.s,
      score: typeof x.detail === "number" ? x.detail : x.detail.score,
      reason: typeof x.detail === "number" ? null : x.detail
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxExtra)
    .map((x) => (withScores ? { ...x.s, score: x.score, reason: x.reason } : x.s));

  selected.push(...scored);
  return dedupeBy(selected, (s) => s.id);
}

module.exports = {
  selectSkills,
  ALWAYS_INCLUDE
};
