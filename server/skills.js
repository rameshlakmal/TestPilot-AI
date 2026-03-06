const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

function loadSkills(skillsDir) {
  const dir = skillsDir || path.join(__dirname, "..", "skills");
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir) : [];

  const skills = [];
  for (const name of entries) {
    if (!name.toLowerCase().endsWith(".md")) continue;
    const fullPath = path.join(dir, name);
    const rawFile = fs.readFileSync(fullPath, "utf8");

    const parsed = matter(rawFile);
    const id = (parsed.data && parsed.data.id) || path.basename(name, ".md");
    const title = (parsed.data && parsed.data.title) || id;
    const tags = Array.isArray(parsed.data && parsed.data.tags) ? parsed.data.tags : [];

    skills.push({
      id: String(id),
      title: String(title),
      tags: tags.map((t) => String(t)),
      markdown: rawFile,
      fileName: name
    });
  }

  skills.sort((a, b) => a.id.localeCompare(b.id));
  return skills;
}

module.exports = {
  loadSkills
};
