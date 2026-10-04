(() => {
  const cfg = window.VA34_SUPABASE || {};
  const configured = Boolean(cfg.url && cfg.publishableKey && window.supabase);
  let client = null;
  let user = null;
  let lordId = null;

  if (configured) client = window.supabase.createClient(cfg.url, cfg.publishableKey);

  const isUUID = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

  async function init() {
    if (!configured) return { configured: false, authenticated: false, user: null };
    const result = await client.auth.getUser();
    user = result.data.user || null;
    return { configured: true, authenticated: Boolean(user), user };
  }

  async function getState() {
    if (!client || !user) return null;

    const { data: lords, error: lordError } = await client
      .from('lords')
      .select('*')
      .eq('player_id', user.id)
      .order('created_at', { ascending: true });

    if (lordError) throw lordError;
    const lord = lords && lords.length ? lords[lords.length - 1] : null;
    if (!lord) return null;

    lordId = lord.id;
    const [shards, heroes, troops, tech] = await Promise.all([
      client.from('shards').select('*').eq('lord_id', lord.id).order('created_at', { ascending: true }),
      client.from('heroes').select('*').eq('lord_id', lord.id).order('created_at', { ascending: true }),
      client.from('troops').select('*').eq('lord_id', lord.id).order('created_at', { ascending: true }),
      client.from('developments').select('*').eq('lord_id', lord.id).order('created_at', { ascending: true })
    ]);

    for (const result of [shards, heroes, troops, tech]) if (result.error) throw result.error;

    return {
      lord: {
        name: lord.name || '',
        race: lord.race || '',
        motto: lord.motto || '',
        energy: Number(lord.energy || 0),
        status: lord.status || 'Владыка',
        ability: lord.ability || '',
        traits: lord.traits || '',
        items: lord.items || '',
        resources: lord.resources || ''
      },
      shards: (shards.data || []).map(x => ({
        id: x.id, name: x.name || '', type: x.type || 'ordinary',
        size: Number(x.size || 0), income: Number(x.income || 0), race: x.race || '',
        population: x.population || '', mood: x.mood || 'Спокойное',
        garrison: Number(x.garrison || 0), supply: Number(x.supply || 0),
        defense: Number(x.defense || 0), terrain: x.terrain || '',
        buildings: typeof x.buildings === 'number' ? x.buildings : Number(x.buildings || 0),
        resources: typeof x.resources === 'string' ? x.resources : JSON.stringify(x.resources || ''),
        description: x.description || ''
      })),
      heroes: (heroes.data || []).map(x => ({
        id: x.id, name: x.name || '', race: x.race || '', level: Number(x.level || 1),
        xp: Number(x.xp || 0), skills: Array.isArray(x.skills) ? x.skills.join(', ') : (x.skills || ''),
        perks: Array.isArray(x.perks) ? x.perks.join(', ') : (x.perks || ''),
        knights: Array.isArray(x.knights) ? x.knights.join(', ') : (x.knights || ''),
        items: Array.isArray(x.items) ? x.items.join(', ') : (x.items || ''),
        artifacts: Array.isArray(x.artifacts) ? x.artifacts.join(', ') : (x.artifacts || ''),
        description: x.description || ''
      })),
      troops: (troops.data || []).map(x => ({
        id: x.id, name: x.name || '', type: x.type || '', tier: Number(x.tier || 1),
        quantity: Number(x.quantity || 0),
        traits: Array.isArray(x.traits) ? x.traits.join(', ') : (x.traits || ''),
        description: x.description || ''
      })),
      tech: (tech.data || []).map(x => ({
        id: x.id, name: x.name || '', kind: x.kind || 'technology',
        level: Number(x.level || 0), cost: Number(x.cost || 0), description: x.description || ''
      })),
      meta: { version: 4, source: 'supabase' }
    };
  }

  async function ensureLord() {
    if (!client || !user) throw new Error('Нет авторизованного пользователя.');
    if (lordId) return lordId;
    const { data, error } = await client.from('lords').insert({
      player_id: user.id,
      name: '',
      race: '',
      motto: '',
      energy: 15,
      status: 'Владыка',
      ability: '',
      traits: '',
      items: '',
      resources: ''
    }).select('id').single();
    if (error) throw error;
    lordId = data.id;
    return lordId;
  }

  const csv = value => String(value || '').split(',').map(x => x.trim()).filter(Boolean);

  async function saveState(state) {
    if (!client || !user) return { saved: false };

    const id = await ensureLord();
    const { error: lordError } = await client.from('lords').update({
      name: state.lord.name || '',
      race: state.lord.race || '',
      motto: state.lord.motto || '',
      energy: Number(state.lord.energy || 0),
      status: state.lord.status || 'Владыка',
      ability: state.lord.ability || '',
      traits: state.lord.traits || '',
      items: state.lord.items || '',
      resources: state.lord.resources || '',
      updated_at: new Date().toISOString()
    }).eq('id', id);
    if (lordError) throw lordError;

    const tables = [
      ['shards', state.shards.map(x => ({
        ...(isUUID(x.id) ? { id: x.id } : {}),
        lord_id: id, name: x.name || '', type: x.type || 'ordinary',
        size: Number(x.size || 0), income: Number(x.income || 0), race: x.race || '',
        population: x.population || '', mood: x.mood || 'Спокойное',
        garrison: Number(x.garrison || 0), supply: Number(x.supply || 0),
        defense: Number(x.defense || 0), terrain: x.terrain || '',
        buildings: Number(x.buildings || 0),
        resources: x.resources || '', trophies: [], description: x.description || ''
      }))],
      ['heroes', state.heroes.map(x => ({
        ...(isUUID(x.id) ? { id: x.id } : {}),
        lord_id: id, name: x.name || '', race: x.race || '',
        level: Number(x.level || 1), xp: Number(x.xp || 0),
        skills: csv(x.skills), perks: csv(x.perks), knights: csv(x.knights),
        items: csv(x.items), artifacts: csv(x.artifacts), description: x.description || ''
      }))],
      ['troops', state.troops.map(x => ({
        ...(isUUID(x.id) ? { id: x.id } : {}),
        lord_id: id, name: x.name || '', type: x.type || '',
        tier: Number(x.tier || 1), quantity: Number(x.quantity || 0),
        traits: csv(x.traits), description: x.description || ''
      }))],
      ['developments', state.tech.map(x => ({
        ...(isUUID(x.id) ? { id: x.id } : {}),
        lord_id: id, name: x.name || '', kind: x.kind || 'technology',
        level: Number(x.level || 0), cost: Number(x.cost || 0), description: x.description || ''
      }))]
    ];

    for (const [table, rows] of tables) {
      const { data: existing, error: readError } = await client.from(table).select('id').eq('lord_id', id);
      if (readError) throw readError;
      const ids = new Set(rows.filter(x => x.id).map(x => x.id));
      const stale = (existing || []).map(x => x.id).filter(x => !ids.has(x));
      if (stale.length) {
        const { error } = await client.from(table).delete().in('id', stale);
        if (error) throw error;
      }
      if (rows.length) {
        const { data, error } = await client.from(table).upsert(rows, { onConflict: 'id' }).select('id');
        if (error) throw error;
        const source = table === 'shards' ? state.shards :
          table === 'heroes' ? state.heroes :
          table === 'troops' ? state.troops : state.tech;
        rows.forEach((row, i) => {
          if (!row.id && data && data[i] && source[i]) source[i].id = data[i].id;
        });
      }
    }

    return { saved: true };
  }

  window.VA34_CLOUD = {
    configured,
    init,
    getState,
    saveState,
    get user() { return user; }
  };
})();