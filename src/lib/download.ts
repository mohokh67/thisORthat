/**
 * Saves `content` to the user's machine as `filename` by clicking a transient
 * object-URL anchor. Browser-only glue around the pure serializers — no domain
 * logic, so not unit-tested (AGENTS.md).
 */
export function triggerDownload(filename: string, mime: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Revoke on the next tick — some browsers cancel the download if the object
  // URL is freed synchronously right after click().
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
