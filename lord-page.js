(()=> {
  const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const val=v=>v===null||v===undefined||v===''?'—':esc(v);
  const chips=v=>(Array.isArray(v)?v:(v?[String(v)]:[])).map(x=>'<span class="badge">'+esc(x)+'</span>').join(' ')||'—';
  const row=(a,b)=>'<div><b>'+a+':</b> '+val(b)+'</div>';
  const section=(title,body)=>'<section class="entity lord-block"><h2>'+title+'</h2>'+body+'</section>';

  async function init(){
    const id=new URLSearchParams(location.search).get('id'),box=document.getElementById('lordPage');
    if(!id){box.innerHTML='<div class="warning">Не указан Владыка.</div>';return;}
    const info=await VA34_CLOUD.init();if(!info.authenticated){box.innerHTML='<div class="notice">Войдите в аккаунт, чтобы открыть страницу Владыки.</div>';return;}
    const db=window.supabase.createClient(VA34_SUPABASE.url,VA34_SUPABASE.publishableKey);
    const lord=await db.from('lords').select('*').eq('id',id).single();if(lord.error)throw lord.error;
    const l=lord.data;
    const [player,shards,heroes,troops,devs]=await Promise.all([
      db.from('players').select('display_name,player_name').eq('id',l.player_id).maybeSingle(),
      db.from('shards').select('*').eq('lord_id',id).order('created_at',{ascending:true}),
      db.from('heroes').select('*').eq('lord_id',id).order('created_at',{ascending:true}),
      db.from('troops').select('*').eq('lord_id',id).order('created_at',{ascending:true}),
      db.from('developments').select('*').eq('lord_id',id).order('created_at',{ascending:true})
    ]);
    if(shards.error)throw shards.error;if(heroes.error)throw heroes.error;if(troops.error)throw troops.error;if(devs.error)throw devs.error;
    const ss=shards.data||[],hs=heroes.data||[],ts=troops.data||[],ds=devs.data||[];
    if(l.game_id){document.getElementById('backGame').href='games.html?game='+encodeURIComponent(l.game_id);}
    box.innerHTML='<header class="hero-panel"><div><span class="badge">'+val(l.status)+'</span><h1>👑 '+val(l.name||'Безымянный Владыка')+'</h1><p>Игрок: '+val(player.data?.player_name||player.data?.display_name)+'</p></div></header>'+
      section('📜 Основные сведения','<div class="lord-grid">'+row('Раса',l.race)+row('Мир',l.world_name)+row('Энергия',l.energy)+row('Девиз',l.motto)+row('Способность',l.ability)+row('Особенности',l.traits)+row('Артефакты / предметы',l.items)+row('Ресурсы и постоянные источники дохода',l.resources)+'</div>')+
      section('🌿 Родовой осколок',ss.length?'<div class="lord-grid">'+(()=>{const x=ss.find(s=>s.type==='ancestral')||ss[0];return row('Название',x.name)+row('Размер',x.size)+row('Доход',x.income)+row('Раса',x.race)+row('Ландшафт',x.terrain)+row('Гарнизон',x.garrison)+row('Снабжение',x.supply)+row('Защита',x.defense)+row('Здания',x.buildings)+row('Ресурсы / трофеи',x.resources)})()+'</div>':'<p class="muted">Не указан.</p>')+
      section('🌍 Осколки',ss.length?ss.map(x=>'<article class="notice"><h3>'+val(x.name)+'</h3>'+row('Тип',x.type)+row('Размер',x.size)+row('Доход',x.income)+row('Раса',x.race)+row('Население',x.population)+row('Ландшафт',x.terrain)+row('Настроение',x.mood)+row('Гарнизон',x.garrison)+row('Снабжение',x.supply)+row('Защита',x.defense)+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>').join(''):'<p class="muted">Осколков нет.</p>')+
      section('🎭 Герои',hs.length?hs.map(x=>'<article class="notice"><h3>'+val(x.name)+'</h3>'+row('Раса',x.race)+row('Уровень',x.level)+row('Опыт',x.xp)+row('Навыки',chips(x.skills))+row('Перки',chips(x.perks))+row('Витязи',chips(x.knights))+row('Предметы',chips(x.items))+row('Артефакты',chips(x.artifacts))+'</article>').join(''):'<p class="muted">Героев нет.</p>')+
      section('⚔️ Войска',ts.length?ts.map(x=>'<article class="notice"><h3>'+val(x.name)+'</h3>'+row('Тип',x.type)+row('Уровень',x.tier)+row('Количество',x.quantity)+row('Особенности',chips(x.traits))+'</article>').join(''):'<p class="muted">Войск нет.</p>')+
      section('⚙️ Технологии и магия',ds.length?ds.filter(x=>!['starting_technology','starting_magic'].includes(x.kind)).map(x=>'<article class="notice"><b>'+val(x.name)+'</b>'+row('Тип',x.kind)+row('Уровень',x.level)+(x.description?row('Описание',x.description):'')+'</article>').join(''):'<p class="muted">Нет записей.</p>');
  }
  document.addEventListener('DOMContentLoaded',()=>init().catch(e=>{document.getElementById('lordPage').innerHTML='<div class="warning">Ошибка: '+esc(e.message)+'</div>'}));
})();