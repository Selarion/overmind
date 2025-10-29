module.exports = async (tp) => {
  const vault = tp.app.vault;
  const filePath = tp.file.path(true);
  const file = vault.getAbstractFileByPath(filePath);
  const content = tp.file.content;

  console.log("Start Templater script");

  // 1. Разделяем YAML и тело
  let frontmatter = '';
  let body = content;

  if (content.startsWith('---')) {
    const endIndex = content.indexOf('\n---', 3);
    if (endIndex !== -1) {
      frontmatter = content.slice(0, endIndex + 4).trimEnd() + '\n';
      body = content.slice(endIndex + 4).replace(/^\s*\n/, '');
    }
  }

  // 2. Утилита для извлечения и очистки полей
  const extract = (field, text) => {
    const regex = new RegExp(`^${field}::\\s*.*(?:\\r?\\n)?`, 'gm');
    const matches = [...text.matchAll(regex)].map(m => m[0].trim());
    const filtered = matches.filter(l => !l.match(/^.+::\s*\[\[\s*\]\]/));
    const cleaned = text.replace(regex, '');
    return { lines: filtered, rest: cleaned };
  };

  // 3. Проверяем спец up
  const allUp = [...body.matchAll(/^up::\s*.*(?:\r?\n)?/gm)].map(m => m[0].trim());
  const removeSpecialUp = allUp.filter(l => l !== 'up:: [[Заметки без up]]').length > 0;

  // 4. Последовательно удаляем поля
  let tmp = body;
  let { lines: upLines, rest } = extract('up', tmp);
  tmp = rest;
  if (removeSpecialUp && upLines.length > 1)
    upLines = upLines.filter(l => l !== 'up:: [[Заметки без up]]');

  let { lines: prevLines, rest: rest2 } = extract('prev', tmp);
  tmp = rest2;
  let { lines: nextLines, rest: bodyCleaned } = extract('next', tmp);

  // 5. Собираем навигационный блок
  const navBlock = [...upLines, ...nextLines, ...prevLines].filter(Boolean).join('\n');

  // 6. Формируем итог
  let result = '';
  if (frontmatter) result += frontmatter + '\n';
  if (navBlock) result += navBlock + '\n\n';
  result += bodyCleaned.trimEnd();

  // 7. Записываем безопасно
  await vault.modify(file, result);

  console.log("End Templater script");

};
