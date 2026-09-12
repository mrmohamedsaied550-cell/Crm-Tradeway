type Tool = {
    name: string;
    description: string;
    inputSchema: object;
    annotations?: {
        readOnlyHint?: boolean;
        untrustedContentHint?: boolean;
    };
    execute: (input: unknown) => unknown | Promise<unknown>;
};
declare global {
    interface Document {
        modelContext?: {
            registerTool: (tool: Tool, options?: {
                signal: AbortSignal;
            }) => void | Promise<void>;
        };
    }
}
export function registerMasarTools(getState: () => {
    people: {
        id: string;
        name: string;
    }[];
    journeys: {
        id: string;
        personId: string;
        stage: string;
        status: string;
    }[];
} | null, navigate: (v: string) => void) { const c = document.modelContext; if (!c?.registerTool)
    return () => { }; const life = new AbortController(); const tools: Tool[] = [{ name: 'masar_search_visible_leads', description: 'Search leads visible to the selected demo persona. Reads only the same scoped data displayed in Masar.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute(input) { if (!input || typeof input !== 'object' || typeof (input as {
            query: unknown;
        }).query !== 'string')
            throw Error('query must be a string'); const q = (input as {
            query: string;
        }).query.toLowerCase(), s = getState(); if (!s)
            return { leads: [] }; const ids = new Set(s.people.filter(p => (p.name + ' ' + p.id).toLowerCase().includes(q)).map(p => p.id)); return { leads: s.journeys.filter(j => ids.has(j.personId)).map(j => ({ id: j.id, personId: j.personId, stage: j.stage, status: j.status })) }; } }, { name: 'masar_open_visible_lead', description: 'Navigate to a visible lead detail without changing business data.', inputSchema: { type: 'object', properties: { journeyId: { type: 'string' } }, required: ['journeyId'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input) { const id = (input as {
            journeyId?: string;
        })?.journeyId; if (typeof id !== 'string' || !getState()?.journeys.some(j => j.id === id))
            throw Error('Lead is not visible'); navigate(`leads/${id}`); return { opened: id }; } }]; for (const tool of tools) {
    try {
        Promise.resolve(c.registerTool(tool, { signal: life.signal })).catch(() => { });
    }
    catch { }
} return () => life.abort(); }
