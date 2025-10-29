module.exports = async (tp) => {
  const app = tp.app;
  const file = tp.file.path(true);
  const fs = app.vault.adapter;

  const content = tp.file.content;

  // Извлечение YAML-фронтматтера
  function extractFrontmatter(text) {
    if (!text.startsWith('---\n')) return { frontmatter: '', body: text };
    const lines = text.split('\n');
    const fmEndIndex = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
    if (fmEndIndex === -1) return { frontmatter: '', body: text };
    return {
      frontmatter: lines.slice(0, fmEndIndex + 1).join('\n') + '\n',
      body: lines.slice(fmEndIndex + 1).join('\n'),
    };
  }

  // Извлечение строк с указанным полем и фильтрация пустых ссылок
  function extractFields(field, text, removeSpecialUp = false) {
    const regex = new RegExp(`^${field}::\\s*.*(?:\\r?\\n)?`, "gm");
    const matches = [...text.matchAll(regex)].map(m => m[0].trim());
    let filtered = matches.filter(line => !line.match(/^.+::\s*\[\[\s*\]\]/));

    let cleaned = text.replace(regex, "");

    if (removeSpecialUp && filtered.length > 1) {
      // Удаляем конкретную строку 'up:: [[Заметки без up]]', если есть другие up
      const specialLine = 'up:: [[Заметки без up]]';
      filtered = filtered.filter(line => line !== specialLine);
      cleaned = cleaned.replace(new RegExp(`^${specialLine.replace(/[[\]]/g, '\\$&')}\\s*\\n?`, 'm'), '');
    }

    return { matches: filtered, cleaned };
  }

  const { frontmatter, body } = extractFrontmatter(content);

  // Проверяем сколько строк up, чтобы решить удалять ли special up
  const allUpMatches = [...body.matchAll(/^up::\s*.*(?:\r?\n)?/gm)].map(m => m[0].trim());
  const removeSpecialUp = allUpMatches.filter(l => l !== 'up:: [[Заметки без up]]').length > 0;

  // Извлекаем поля с учетом условия удаления special up
  let tmp = body;
  const up = extractFields('up', tmp, removeSpecialUp); tmp = up.cleaned;
  const prev = extractFields('prev', tmp); tmp = prev.cleaned;
  const next = extractFields('next', tmp); tmp = next.cleaned;

  const navBlock = [...up.matches, ...next.matches, ...prev.matches].filter(Boolean).join('\n');

  let result = '';
  if (frontmatter.trim()) result += frontmatter.trim() + '\n';
  if (navBlock.trim()) result += navBlock.trim();
  const cleanedBody = tmp.replace(/^\s*\n/, '').trimEnd();
  if (cleanedBody) result += '\n\n' + cleanedBody;

  await fs.write(file, result);

  const leaf = app.workspace.getActiveViewOfType(app.workspace.getActiveFile().constructor);
  if (leaf && leaf.file.path === file) {
    leaf.file.cache = null;
    await leaf.file.reload();
  }
};
