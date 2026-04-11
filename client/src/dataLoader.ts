// load notebook data from file
export async function loadNotebookData(): Promise<{ item: string }[]> {
  console.log("loading notebook data...");
  const url = `${location.origin}/data/notebook.json`;
  console.log(`fetching ${url}`);
  const res = await fetch(url);
  console.log(`fetch status: ${res.status}`);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const body = await res.json();
  console.log("fetched notebook body:", body);
  return body.items ? body.items.map((it: string) => ({ item: it })) : body;
}
