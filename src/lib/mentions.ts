export function extractMentionIds(content: string): string[] {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[2]);
  }
  return ids;
}

export function renderMentionsToHtml(content: string): string {
  return content.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="/profile/$2" class="mention-link" style="color: var(--cg-accent); font-weight: 500;">@$1</a>'
  );
}
