(()=> {
  let db=null,user=null;

  const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const statusText={open:'Открыта',running:'Идёт',closed:'Закрыта',finished:'Завершена'};
  const turnText={draft:'Черновик',submitted:'Отправлен',approved:'Принят',rejected:'Отклонён',resolved:'Разрешён'};

  async function init(){
    const info=await VA34_CLOUD.init();
    if(!info.authenticated){location.href='auth.html';return;}
    user=info.user;
    db=window.supabase.createClient(VA34_SUPABASE.url,VA34_SUPABASE.publishableKey);
    const me=await db.from('players').select('display_name,is_master').eq('id',user.id).single();
    if(me.error)throw me.error;
    if(!me.data?.is_master){document.getElementById('status').textContent='Доступ только для пользователей с ролью мастера.';return;}
    document.getElementById('status').textContent='Мастер: '+(me.data.display_name||user.email||user.id);
    await loadGames();
    await initFreeShards();
  }


  async function initFreeShards(){
    const panel=document.getElementById('freeShardPanel');
    const gameSelect=document.getElementById('freeShardGame');
    if(!panel||!gameSelect)return;
    const {data:games,error}=await db.from('games').select('*').eq('master_id',user.id).order('created_at',{ascending:false});
    if(error){panel.style.display='block';document.getElementById('freeShardList').innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    panel.style.display='block';
    gameSelect.innerHTML=(games||[]).map(g=>'<option value="'+g.id+'">'+esc(g.name)+'</option>').join('');
    const fill=(id,items,labelFn,valueFn)=>{const el=document.getElementById(id);el.innerHTML=items.map(x=>'<option value="'+esc(valueFn(x))+'">'+esc(labelFn(x))+'</option>').join('');};
    fill('freeShardType',VA34_RULES.shardTypes,x=>x.name,x=>x.id);
    fill('freeShardSize',VA34_RULES.shardSizes,x=>x.name+' — '+x.value,x=>x.value);
    fill('freeShardMood',VA34_RULES.moods,x=>x,x=>x);
    fill('freeShardTerrain',VA34_RULES.terrains,x=>x,x=>x);
    gameSelect.onchange=()=>loadFreeShards(gameSelect.value);
    const form=document.getElementById('freeShardForm');
    form.onsubmit=async e=>{
      e.preventDefault();
      const f=new FormData(form),gameId=String(f.get('game'));
      const payload={game_id:gameId,created_by:user.id,name:String(f.get('name')||'').trim(),type:String(f.get('type')||'ordinary'),size:Number(f.get('size')||1),income:Number(f.get('income')||0),race:String(f.get('race')||''),population:String(f.get('population')||''),mood:String(f.get('mood')||'Спокойное'),garrison:Number(f.get('garrison')||0),supply:Number(f.get('supply')||0),defense:Number(f.get('defense')||0),terrain:String(f.get('terrain')||''),description:String(f.get('description')||'')};
      const {error}=await db.from('free_shards').insert(payload);
      if(error){alert(error.message);return;}
      form.reset(); gameSelect.value=gameId; await loadFreeShards(gameId);
    };
    if(games?.length) await loadFreeShards(games[0].id);
    else document.getElementById('freeShardList').innerHTML='<div class="notice">Сначала создайте игру.</div>';
  }

  async function loadFreeShards(gameId){
    if(!gameId)return;
    const box=document.getElementById('freeShardList');
    const {data:shards,error}=await db.from('free_shards').select('*').eq('game_id',gameId).order('created_at',{ascending:false});
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    const {data:members,error:me}=await db.from('game_members').select('player_id,role').eq('game_id',gameId);
    if(me){box.innerHTML='<div class="notice">'+esc(me.message)+'</div>';return;}
    const players=(members||[]).filter(x=>x.role==='player').map(x=>x.player_id);
    const lords=players.length?await db.from('lords').select('id,name,player_id').in('player_id',players).eq('game_id',gameId):{data:[]};
    const people=players.length?await db.from('players').select('id,display_name').in('id',players):{data:[]};
    const names={};(people.data||[]).forEach(x=>names[x.id]=x.display_name||x.id);
    const lordOptions=(lords.data||[]).map(l=>'<option value="'+l.id+'">'+esc(l.name||'Безымянный Владыка')+' — '+esc(names[l.player_id]||l.player_id)+'</option>').join('');
    box.innerHTML=shards?.length?'<div class="entity-list">'+shards.map(s=>'<article class="entity"><h3>'+esc(s.name||'Без названия')+'</h3><p>'+esc(s.type)+' · размер '+s.size+' · доход '+s.income+' · '+esc(s.terrain||'ландшафт не указан')+'</p><p>'+esc(s.description||'')+'</p><p>Статус: '+(s.assigned_lord_id?'передан игроку':'свободен')+'</p>'+(s.assigned_lord_id?'':'<div class="data-actions"><select data-assign-select="'+s.id+'"><option value="">— выбрать Владыку —</option>'+lordOptions+'</select><button class="primary" data-assign="'+s.id+'">Передать</button><button class="danger" data-delete-free="'+s.id+'">Удалить</button></div>')+'</article>').join('')+'</div>':'<div class="notice">Свободных осколков пока нет.</div>';
    box.querySelectorAll('[data-assign]').forEach(b=>b.onclick=()=>assignFreeShard(b.dataset.assign,box.querySelector('[data-assign-select="'+b.dataset.assign+'"]').value));
    box.querySelectorAll('[data-delete-free]').forEach(b=>b.onclick=()=>deleteFreeShard(b.dataset.deleteFree));
  }

  async function assignFreeShard(id,lordId){
    if(!lordId){alert('Выберите Владыку.');return;}
    const {data:free,error}=await db.from('free_shards').select('*').eq('id',id).single();
    if(error){alert(error.message);return;}
    const {data:lord,error:le}=await db.from('lords').select('id,game_id').eq('id',lordId).single();
    if(le){alert(le.message);return;}
    const {data:created,error:ce}=await db.from('shards').insert({lord_id:lord.id,name:free.name,type:free.type,size:free.size,income:free.income,race:free.race,population:free.population,mood:free.mood,garrison:free.garrison,supply:free.supply,defense:free.defense,terrain:free.terrain,buildings:free.buildings||0,resources:free.resources||[],trophies:free.trophies||[],description:free.description}).select('id').single();
    if(ce){alert(ce.message);return;}
    const {error:ue}=await db.from('free_shards').update({assigned_lord_id:lord.id,assigned_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
    if(ue){await db.from('shards').delete().eq('id',created.id);alert(ue.message);return;}
    const gameId=document.getElementById('freeShardGame').value;await loadFreeShards(gameId);
  }

  async function deleteFreeShard(id){
    if(!confirm('Удалить этот свободный осколок?'))return;
    const {error}=await db.from('free_shards').delete().eq('id',id);
    if(error)alert(error.message);else await loadFreeShards(document.getElementById('freeShardGame').value);
  }

  async function loadGames(){
    document.getElementById('turnSection').style.display='none';
    document.getElementById('detailSection').style.display='none';
    const sec=document.getElementById('gamesSection');sec.style.display='block';
    const {data,error}=await db.from('games').select('*').eq('master_id',user.id).order('created_at',{ascending:false});
    if(error)throw error;
    if(!data?.length){sec.innerHTML='<div class="notice">У вас пока нет игр. Создайте игру в разделе <a href="games.html">Игры</a>.</div>';return;}
    const ids=data.map(g=>g.id);
    const members=await db.from('game_members').select('game_id,player_id,role').in('game_id',ids);
    const counts={};(members.data||[]).forEach(m=>{if(m.role==='player')counts[m.game_id]=(counts[m.game_id]||0)+1;});
    sec.innerHTML='<h2>Мои игры</h2>'+data.map(g=>'<article class="entity"><h3>'+esc(g.name)+'</h3><p>'+esc(g.description||'')+'</p><p>Игроков: '+(counts[g.id]||0)+' / '+g.max_players+' · '+esc(statusText[g.status]||g.status)+'</p><button class="primary" data-game="'+g.id+'">Открыть управление</button></article>').join('');
    sec.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>openGame(b.dataset.game));
  }

  async function openGame(gameId){
    const g=await db.from('games').select('*').eq('id',gameId).eq('master_id',user.id).single();
    if(g.error)throw g.error;
    document.getElementById('gamesSection').style.display='none';
    document.getElementById('turnSection').style.display='block';
    document.getElementById('detailSection').style.display='none';
    const box=document.getElementById('turns');
    const {data:members}=await db.from('game_members').select('player_id,role').eq('game_id',gameId);
    const players=(members?.data||[]).filter(m=>m.role==='player').map(m=>m.player_id);
    if(!players.length){box.innerHTML='<div class="notice">В игре пока нет принятых игроков.</div>';return;}
    const lords=await db.from('lords').select('id,player_id,name').in('player_id',players).eq('game_id',gameId);
    if(lords.error)throw lords.error;
    const lordIds=(lords.data||[]).map(l=>l.id);
    if(!lordIds.length){box.innerHTML='<div class="notice">Игроки ещё не создали Владык для этой игры.</div>';return;}
    const turns=await db.from('turns').select('*').in('lord_id',lordIds).order('updated_at',{ascending:false});
    if(turns.error)throw turns.error;
    const people=await db.from('players').select('id,display_name').in('id',players);
    const names={};(people.data||[]).forEach(p=>names[p.id]=p.display_name||p.id);
    const lordMap={};(lords.data||[]).forEach(l=>lordMap[l.id]=l);
    box.innerHTML='<div class="section-head"><h2>'+esc(g.data.name)+'</h2><button id="backGames">← К играм</button></div>'+
      ((turns.data||[]).length?(turns.data||[]).map(t=>{const l=lordMap[t.lord_id]||{};return '<article class="entity"><h3>Ход №'+t.turn_number+' — '+esc(l.name||'Владыка')+'</h3><p>Игрок: '+esc(names[l.player_id]||l.player_id||'—')+' · '+esc(turnText[t.status]||t.status)+'</p><p>Изменён: '+esc(new Date(t.updated_at).toLocaleString())+'</p><button data-turn="'+t.id+'">Открыть ход</button></article>';}).join(''):'<div class="notice">Ходов пока нет.</div>');
    const back=document.getElementById('backGames');if(back)back.onclick=loadGames;
    box.querySelectorAll('[data-turn]').forEach(b=>b.onclick=()=>openTurn(b.dataset.turn,g.data.name));
  }

  async function openTurn(turnId,gameName){
    const {data:t,error}=await db.from('turns').select('*').eq('id',turnId).single();
    if(error)throw error;
    const acts=await db.from('turn_actions').select('*').eq('turn_id',turnId).order('action_order',{ascending:true});
    if(acts.error)throw acts.error;
    const lord=await db.from('lords').select('name,player_id').eq('id',t.lord_id).single();
    const person=lord.data?await db.from('players').select('display_name').eq('id',lord.data.player_id).single():{data:null};
    document.getElementById('turnSection').style.display='none';
    document.getElementById('detailSection').style.display='block';
    document.getElementById('detailTitle').textContent=gameName+' — ход №'+t.turn_number;
    const v=acts.data||[];
    document.getElementById('turnDetail').innerHTML='<div class="hero-panel"><div><span class="badge">'+esc(turnText[t.status]||t.status)+'</span><h2>'+esc(lord.data?.name||'Владыка')+'</h2><p>Игрок: '+esc(person.data?.display_name||lord.data?.player_id||'—')+'</p></div></div>'+
      (v.length?'<div class="entity-list">'+v.map((a,i)=>'<article class="entity"><h3>'+(i+1)+'. '+esc(a.title)+'</h3><p>'+esc(a.action_kind==='main'?'Основное':'Дополнительное')+' · '+Number(a.energy_cost||0)+' энергии</p><p>'+esc(a.description||'')+'</p><p>Статус: '+esc(a.status||'pending')+'</p></article>').join('')+'</div>':'<div class="notice">Действий нет.</div>')+
      '<div class="data-actions">'+
      '<button class="primary" data-status="approved" '+(t.status==='submitted'?'':'disabled')+'>Принять ход</button>'+
      '<button data-status="rejected" '+(t.status==='submitted'?'':'disabled')+'>Отклонить</button>'+
      '<button data-status="resolved" '+(t.status==='approved'?'':'disabled')+'>Отметить разрешённым</button></div>';
    document.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>setTurnStatus(t.id,b.dataset.status));
    document.getElementById('backTurns').onclick=()=>openGameByLord(t.lord_id);
  }

  async function openGameByLord(lordId){
    const l=await db.from('lords').select('game_id').eq('id',lordId).single();
    if(l.error)throw l.error;
    const g=await db.from('games').select('name').eq('id',l.data.game_id).single();
    await openGame(l.data.game_id);
  }

  function validateTurnForMaster(turn, actions){
    const errors=[];
    const main=actions.filter(a=>a.action_kind==='main').length;
    const extra=actions.filter(a=>a.action_kind==='extra').length;
    const total=main+extra;
    if(total>5) errors.push('Более 5 действий за ход.');
    if(main>2) errors.push('Более 2 основных действий.');
    if(extra>5) errors.push('Более 5 дополнительных действий.');
    if(total===5 && main>0) errors.push('При 5 действиях все они должны быть дополнительными.');
    if(main===2 && extra>2) errors.push('При 2 основных действиях допускается не более 2 дополнительных.');
    if(main===1 && extra>3) errors.push('При 1 основном действии допускается не более 3 дополнительных.');
    let levels=0; const techLevels=new Map(); const techNames=new Set();
    actions.forEach((a,i)=>{
      const v=a.validation||{};
      const level=Number(v.developmentLevel||0);
      const isDev=v.actionType==='technology'||v.actionType==='magic'||v.actionType==='development';
      if(isDev){
        if(!Number.isFinite(level)||level<1||level>6) errors.push('Действие '+(i+1)+': неверный уровень развития.');
        levels+=level||0;
        if(v.actionType!=='magic'){
          const name=String(v.developmentName||'').trim().toLowerCase();
          if(!name) errors.push('Действие '+(i+1)+': не указана технология.');
          else { techNames.add(name); techLevels.set(name,(techLevels.get(name)||0)+(level||0)); }
        }
        if(level>3) errors.push('Действие '+(i+1)+': за один ход нельзя развить одно развитие более чем на 3 уровня.');
        if(level===6 && v.masterDecision!==true && !v.specialTZ) errors.push('Действие '+(i+1)+': Epic VI требует специального ТЗ или решения Мастера.');
      }
      if(Number(a.energy_cost||0)<0) errors.push('Действие '+(i+1)+': отрицательная стоимость энергии.');
    });
    techLevels.forEach((n,name)=>{if(n>3)errors.push('Технология «'+name+'» повышается более чем на 3 уровня за ход.');});
    if(techNames.size>3)errors.push('За ход можно развивать не более 3 разных технологий.');
    if(levels>6)errors.push('Суммарно развития за ход более 6 уровней.');
    return errors;
  }

  async function setTurnStatus(turnId,status){
    const label=status==='approved'?'принять':status==='rejected'?'отклонить':'отметить разрешённым';
    const check=await db.from('turn_actions').select('*').eq('turn_id',turnId).order('action_order',{ascending:true});
    if(check.error){alert(check.error.message);return;}
    const turnRow=await db.from('turns').select('*').eq('id',turnId).single();
    if(turnRow.error){alert(turnRow.error.message);return;}
    if(status==='approved' && turnRow.data.status==='submitted'){
      const errors=validateTurnForMaster(turnRow.data,check.data||[]);
      if(errors.length){alert('Ход не прошёл повторную проверку Мастера:\\n\\n'+errors.join('\\n'));return;}
    }
    if(!confirm('Вы уверены, что хотите '+label+' этот ход?'))return;
    const {error}=await db.from('turns').update({status,updated_at:new Date().toISOString()}).eq('id',turnId);
    if(error){alert(error.message);return;}
    await openTurn(turnId,document.getElementById('detailTitle').textContent.split(' — ')[0]);
  }

  document.addEventListener('DOMContentLoaded',()=>init().catch(e=>document.getElementById('status').textContent='Ошибка: '+e.message));
})();