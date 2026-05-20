import { ARC_TESTNET } from '../../constants/chain';

export type NftItem = {
  contract: string;
  tokenId: string;
  name: string;        // collection name
  symbol: string;
  title: string;       // display title for item (collection · #id)
  image?: string;
  standard: string;    // ERC-721 / ERC-1155
  amount?: string;     // for 1155
  description?: string;
};

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function pickImage(meta: any): string | undefined {
  if (!meta) return undefined;
  const candidates = [
    meta.image_url, meta.image, meta.imageUrl,
    meta.animation_url, meta.thumbnail_url,
    meta.properties?.image, meta.properties?.image?.description,
  ].filter((x: any) => typeof x === 'string') as string[];
  for (const c of candidates) {
    if (!c) continue;
    if (c.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${c.replace('ipfs://', '')}`;
    return c;
  }
  return undefined;
}

export async function fetchNfts(address: string): Promise<NftItem[]> {
  const base = `${ARC_TESTNET.apiBase}/v2/addresses/${address}/nft?type=ERC-721,ERC-1155`;
  const json = await fetchJson(base);
  if (!json?.items?.length) return [];
  const out: NftItem[] = [];
  for (const it of json.items as any[]) {
    const tok = it.token || {};
    const meta = it.metadata || it.token_instance?.metadata || {};
    const tokenId = it.id || it.token_id || it.token_instance?.id || '';
    out.push({
      contract: tok.address || '',
      tokenId: String(tokenId),
      name: tok.name || 'Collection',
      symbol: tok.symbol || '',
      title: meta.name || `#${tokenId}`,
      image: pickImage(meta) || pickImage(it.token_instance?.metadata),
      standard: tok.type || 'ERC-721',
      amount: it.value || it.amount || undefined,
      description: meta.description,
    });
  }
  return out;
}
