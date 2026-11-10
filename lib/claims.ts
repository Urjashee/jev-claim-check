const bulletMarker = /(?:^|\n)\s*(?:[•●▪◦‣]|[-*])\s*/g;
const inlineBulletMarker = /\s+[•●▪◦‣]\s*/g;
const numberedMarker = /^\s*(?:\d+[.)]|[a-z][.)])\s+/i;
const abbreviations = /\b(?:mr|mrs|ms|dr|prof|e\.g|i\.e|etc)\./gi;

export function extractClaims(description: string): string[] {
    const protectedDescription = description
        .replace(/\r\n?/g, "\n")
        .replace(abbreviations, (match) => match.replace(/\./g, "\u0000"))
        .replace(bulletMarker, "\n")
        .replace(inlineBulletMarker, "\n");

    return protectedDescription
        .split(/\n+/)
        .flatMap((line) => line.replace(numberedMarker, "").split(/(?<=[.!?;])\s+/u))
        .map((claim) => claim.replace(/\u0000/g, ".").trim())
        .filter(Boolean);
}
