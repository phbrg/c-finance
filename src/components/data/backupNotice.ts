const STALE_DAYS = 30

/** Short label for the "Último backup" stat; warn when there is none or it is older than 30 days. */
export function backupNotice(lastBackupAt: string | null, now = Date.now()): { value: string; detail: string; warn: boolean } {
  if (!lastBackupAt) return { value: 'nunca', detail: 'baixe um agora', warn: true }
  const days = Math.max(0, Math.floor((now - new Date(lastBackupAt).getTime()) / 86_400_000))
  const date = new Date(lastBackupAt).toLocaleDateString('pt-BR')
  const value = days === 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days} dias`
  return days > STALE_DAYS
    ? { value, detail: `em ${date}, vale baixar outro`, warn: true }
    : { value, detail: `em ${date}`, warn: false }
}
