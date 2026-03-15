const CORP_WORDS = /^(株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|一般財団法人|特定非営利活動法人|社会福祉法人|医療法人|NPO法人|㈱|㈲)\s*|\s*(株式会社|有限会社|合同会社|合資会社|合名会社|㈱|㈲)$/g

/** 株式会社 などの法人格を除いた略称から最初の文字を返す */
export function companyInitials(name: string | null | undefined, length = 1): string {
    if (!name) return '?'
    const simplified = name.replace(CORP_WORDS, '').trim()
    return (simplified || name).slice(0, length)
}
