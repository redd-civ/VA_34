(()=> {
  let user=null, db=null, master=false, game=null;

  const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const statusText={open:'Приём заявок открыт',running:'Игра идёт',closed:'Приём заявок закрыт',finished:'Игра завершена'};
  const roleText={pending:'На рассмотрении',accepted:'Принята',rejected:'Отклонена',withdrawn:'Отозвана'};
  const turnText={draft:'Черновик',submitted:'Отправлен',approved:'Принят',rejected:'Отклонён',resolved:'Разрешён'};
  const list=v=>Array.isArray(v)?v:(v?[String(v)]:[]);
  const val=v=>v===null||v===undefined||v===''?'—':esc(v);
  const section=(title,html)=>'<div class="notice game-subcard"><h4>'+title+'</h4>'+html+'</div>';
  const row=(label,value)=>'<div><b>'+label+':</b> '+val(value)+'</div>';
  const chips=items=>list(items).map(x=>'<span class="badge">'+esc(x)+'</span>').join(' ')||'—';

  async function init(){
    const s=document.getElementById('status');
    const r=await VA34_CLOUD.init();
    if(!r.authenticated){s.textContent='Войдите в аккаунт, чтобы открыть игру.';return;}
    user=r.user;
    db=window.supabase.createClient(VA34_SUPABASE.url,VA34_SUPABASE.publishableKey);
    const me=await db.from('players').select('display_name,player_name,is_master').eq('id',user.id).single();
    if(me.error)throw me.error;
    master=!!me.data?.is_master;
    s.textContent='Аккаунт: '+(me.data?.player_name||me.data?.display_name||user.email||user.id);

    const requested=new URLSearchParams(location.search).get('game');
    let q=db.from('games').select('*');
    if(requested)q=q.eq('id',requested);
    const result=await q.order('created_at',{ascending:true}).limit(1).maybeSingle();
    if(result.error)throw result.error;
    game=result.data;

    if(!game && master){
      const created=await db.from('games').insert({master_id:user.id,name:'Вдохновение Астрала',description:'Основная кампания VA-34.',max_players:100,status:'open'}).select('*').single();
      if(created.error)throw created.error;
      game=created.data;
    }
    if(!game){
      document.getElementById('game').innerHTML='<div class="notice">Игра не найдена.</div>';
      return;
    }
    if(game.master_id===user.id)master=true;
    localStorage.setItem('va34_current_game_id',game.id);
    renderGame();
    bindTabs();
    await Promise.all([loadMyApplication(),loadLords(),loadShards(),loadTurns(),loadMyTurn()]);
    if(master && game.master_id===user.id){
      document.getElementById('masterPanel').style.display='block';
      await loadApplications();
      initShardCreator();
    }
  }

  function renderGame(){
    const box=document.getElementById('game');
    box.innerHTML='<article class="entity game-hero"><div><span class="badge">'+esc(statusText[game.status]||game.status)+'</span><h2>'+esc(game.name)+'</h2><p>'+esc(game.description||'Основная кампания VA-34.')+'</p></div><div class="data-actions"><a class="primary" href="cabinet.html?game='+encodeURIComponent(game.id)+'">🧭 Мой кабинет</a>'+(master?'<a href="master.html">👑 Кабинет мастера</a>':'')+'</div></article>';
  }

  function bindTabs(){
    document.querySelectorAll('[data-game-tab]').forEach(b=>b.onclick=()=>{
      const tab=b.dataset.gameTab;
      document.querySelectorAll('[data-game-tab]').forEach(x=>x.classList.toggle('active',x===b));
      document.querySelectorAll('.game-tab-panel').forEach(x=>x.hidden=x.id!=='tab-'+tab);
    });
  }

  async function loadMyApplication(){
    const box=document.getElementById('myApplication'); if(!box)return;
    const {data,error}=await db.from('game_applications').select('id,status,message,created_at').eq('game_id',game.id).eq('player_id',user.id).maybeSingle();
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    const member=await db.from('game_members').select('role').eq('game_id',game.id).eq('player_id',user.id).maybeSingle();
    if(member.error){box.innerHTML='<div class="notice">'+esc(member.error.message)+'</div>';return;}
    if(member.data){box.innerHTML='<div class="notice">✓ Вы участник игры. <a class="primary" href="cabinet.html?game='+encodeURIComponent(game.id)+'">Открыть свой игровой кабинет</a></div>';return;}
    if(data){
      box.innerHTML='<div class="notice">Статус заявки: <b>'+esc(roleText[data.status]||data.status)+'</b>'+(data.message?'<p>'+esc(data.message)+'</p>':'')+'</div>';
      return;
    }
    if(game.status!=='open'){box.innerHTML='<div class="notice">Приём новых игроков сейчас закрыт.</div>';return;}
    box.innerHTML='<p>Чтобы присоединиться к игре, отправьте заявку Мастеру.</p><button class="primary" id="applyButton">Подать заявку</button>';
    document.getElementById('applyButton').onclick=async()=>{
      const message=prompt('Сообщение Мастеру (необязательно):','');
      if(message===null)return;
      const {error}=await db.from('game_applications').insert({game_id:game.id,player_id:user.id,message});
      if(error){alert(error.message);return;} await loadMyApplication(); await loadLords();
    };
  }

  async function loadLords(){
    const box=document.getElementById('lordsList'); if(!box)return;
    const members=await db.from('game_members').select('player_id,role').eq('game_id',game.id);
    if(members.error){box.innerHTML='<div class="notice">'+esc(members.error.message)+'</div>';return;}
    const players=(members.data||[]).filter(x=>x.role==='player').map(x=>x.player_id);
    if(!players.length){box.innerHTML='<div class="notice">Принятых игроков пока нет.</div>';return;}
    const [lords,people]=await Promise.all([
      db.from('lords').select('*').eq('game_id',game.id).in('player_id',players).order('created_at',{ascending:true}),
      db.from('players').select('id,display_name,player_name').in('id',players)
    ]);
    if(lords.error){box.innerHTML='<div class="notice">'+esc(lords.error.message)+'</div>';return;}
    const names={};(people.data||[]).forEach(p=>names[p.id]=p.player_name||p.display_name||'Игрок');
    const ids=(lords.data||[]).map(x=>x.id);
    const [shards,heroes,troops,devs]=await Promise.all([
      ids.length?db.from('shards').select('*').in('lord_id',ids):{data:[]},
      ids.length?db.from('heroes').select('*').in('lord_id',ids):{data:[]},
      ids.length?db.from('troops').select('*').in('lord_id',ids):{data:[]},
      ids.length?db.from('developments').select('*').in('lord_id',ids):{data:[]}
    ]);
    const lordShards={},lordHeroes={},lordTroops={},lordDevs={};
    (shards.data||[]).forEach(x=>(lordShards[x.lord_id]??=[]).push(x));
    (heroes.data||[]).forEach(x=>(lordHeroes[x.lord_id]??=[]).push(x));
    (troops.data||[]).forEach(x=>(lordTroops[x.lord_id]??=[]).push(x));
    (devs.data||[]).forEach(x=>(lordDevs[x.lord_id]??=[]).push(x));
    if(!lords.data?.length){box.innerHTML='<div class="notice">Игроки приняты, но Владыки ещё не созданы.</div>';return;}
    box.innerHTML='<div class="entity-list">'+lords.data.map(l=>{
      const ss=lordShards[l.id]||[],hs=lordHeroes[l.id]||[],ts=lordTroops[l.id]||[],ds=lordDevs[l.id]||[];
      const ancestral=ss.find(x=>x.type==='ancestral');
      return '<article class="entity lord-game-card"><div class="section-head"><div><h3>👑 '+val(l.name||'Безымянный Владыка')+'</h3><p>Игрок: '+esc(names[l.player_id]||l.player_id)+' · '+val(l.race)+'</p></div><span class="badge">'+val(l.status)+'</span></div><p><a class="primary" href="lord.html?id='+encodeURIComponent(l.id)+'">Открыть страницу Владыки</a></p>'+
        '<div class="game-card-grid">'+row('Мир',l.world_name||l.worldName)+row('Энергия',l.energy)+row('Девиз',l.motto)+row('Способность',l.ability)+row('Особенности',l.traits)+row('Осколки',ss.length)+row('Герои',hs.length)+row('Рода войск',ts.length)+row('Развития',ds.length)+'</div>'+
        (ancestral?section('🌿 Родовой осколок',row('Название',ancestral.name)+row('Размер',ancestral.size)+row('Доход',ancestral.income)+row('Ландшафт',ancestral.terrain)+row('Гарнизон',ancestral.garrison)+row('Защита',ancestral.defense)):'')+
        (ss.length?section('🌍 Осколки',ss.map(x=>'<div class="game-list-row"><b>'+val(x.name)+'</b> · '+val(x.type)+' · размер '+val(x.size)+' · доход '+val(x.income)+'</div>').join('')):'')+
        (hs.length?section('🎭 Герои',hs.map(x=>'<div class="game-list-row"><b>'+val(x.name)+'</b> · ур. '+val(x.level)+' · '+chips(x.skills)+' '+chips(x.perks)+'</div>').join('')):'')+
        (ts.length?section('⚔️ Войска',ts.map(x=>'<div class="game-list-row"><b>'+val(x.name)+'</b> · '+val(x.type)+' · '+val(x.quantity)+'</div>').join('')):'')+
        '</article>';
    }).join('')+'</div>';
  }

  async function loadShards(){
    const box=document.getElementById('shardsList'); if(!box)return;
    const {data,error}=await db.from('free_shards').select('*').eq('game_id',game.id).order('created_at',{ascending:false});
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    if(!data?.length){box.innerHTML='<div class="notice">Мастер пока не создал свободных осколков.</div>';return;}
    const assigned=data.filter(x=>x.assigned_lord_id).length;
    box.innerHTML='<p class="muted">Свободных/созданных осколков: '+data.length+' · передано игрокам: '+assigned+'</p><div class="entity-list">'+data.map(s=>
      '<article class="entity shard-game-card"><div class="section-head"><h3>🏝️ '+val(s.name||'Без названия')+'</h3><span class="badge">'+(s.assigned_lord_id?'Передан':'Свободен')+'</span></div>'+
      '<p>'+val(s.type)+' · размер '+val(s.size)+' · доход '+val(s.income)+' · '+val(s.terrain||'ландшафт не указан')+'</p>'+
      row('Раса',s.race)+row('Население',s.population)+row('Настроение',s.mood)+row('Гарнизон',s.garrison)+row('Снабжение',s.supply)+row('Защита',s.defense)+
      (s.description?'<p>'+esc(s.description)+'</p>':'')+
      (master&&!s.assigned_lord_id?'<div class="data-actions"><select data-assign-select="'+s.id+'"><option value="">— выбрать Владыку —</option></select><button class="primary" data-assign="'+s.id+'">Передать Владыке</button><button class="danger" data-delete-free="'+s.id+'">Удалить</button></div>':'')+
      '</article>').join('')+'</div>';
    if(master){await fillAssignSelectors(box,data);box.querySelectorAll('[data-assign]').forEach(b=>b.onclick=()=>assignShard(b.dataset.assign,box.querySelector('[data-assign-select="'+b.dataset.assign+'"]').value));box.querySelectorAll('[data-delete-free]').forEach(b=>b.onclick=()=>deleteShard(b.dataset.deleteFree));}
  }

  async function fillAssignSelectors(box,shards){
    const members=await db.from('game_members').select('player_id').eq('game_id',game.id).eq('role','player');
    const ids=(members.data||[]).map(x=>x.player_id);
    const lords=ids.length?await db.from('lords').select('id,name,player_id').eq('game_id',game.id).in('player_id',ids):{data:[]};
    const people=ids.length?await db.from('players').select('id,display_name,player_name').in('id',ids):{data:[]};
    const names={};(people.data||[]).forEach(x=>names[x.id]=x.player_name||x.display_name||'Игрок');
    const options=(lords.data||[]).map(l=>'<option value="'+l.id+'">'+esc(l.name||'Безымянный')+' — '+esc(names[l.player_id]||'Игрок')+'</option>').join('');
    box.querySelectorAll('[data-assign-select]').forEach(s=>s.insertAdjacentHTML('beforeend',options));
  }

  async function assignShard(id,lordId){
    if(!lordId){alert('Выберите Владыку.');return;}
    const free=await db.from('free_shards').select('*').eq('id',id).eq('game_id',game.id).single();
    if(free.error){alert(free.error.message);return;}
    const created=await db.from('shards').insert({lord_id:lordId,name:free.data.name,type:free.data.type,size:free.data.size,income:free.data.income,race:free.data.race,population:free.data.population,mood:free.data.mood,garrison:free.data.garrison,supply:free.data.supply,defense:free.data.defense,terrain:free.data.terrain,buildings:free.data.buildings||0,resources:free.data.resources||[],trophies:free.data.trophies||[],description:free.data.description}).select('id').single();
    if(created.error){alert(created.error.message);return;}
    const {error}=await db.from('free_shards').update({assigned_lord_id:lordId,assigned_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
    if(error){await db.from('shards').delete().eq('id',created.data.id);alert(error.message);return;}
    await loadShards();await loadLords();
  }

  async function deleteShard(id){
    if(!confirm('Удалить этот свободный осколок?'))return;
    const {error}=await db.from('free_shards').delete().eq('id',id).eq('game_id',game.id);
    if(error)alert(error.message);else await loadShards();
  }

  async function loadApplications(){
    const box=document.getElementById('applications');if(!box)return;
    const {data,error}=await db.from('game_applications').select('id,player_id,message,status,created_at').eq('game_id',game.id).order('created_at',{ascending:true});
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    if(!data?.length){box.innerHTML='<div class="notice">Заявок пока нет.</div>';return;}
    const ids=[...new Set(data.map(a=>a.player_id))];
    const people=await db.from('players').select('id,display_name,player_name').in('id',ids);
    const names={};(people.data||[]).forEach(p=>names[p.id]=p.player_name||p.display_name||'Игрок');
    box.innerHTML=data.map(a=>'<article class="entity"><h3>'+esc(names[a.player_id]||'Игрок')+' · '+esc(roleText[a.status]||a.status)+'</h3>'+(a.message?'<p>'+esc(a.message)+'</p>':'')+(a.status==='pending'?'<div class="data-actions"><button class="primary" data-app="'+a.id+'" data-app-status="accepted">Принять</button><button data-app="'+a.id+'" data-app-status="rejected">Отклонить</button></div>':'')+'</article>').join('');
    box.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>decideApplication(b.dataset.app,b.dataset.appStatus));
  }

  async function decideApplication(id,status){
    const app=await db.from('game_applications').select('player_id').eq('id',id).eq('game_id',game.id).single();
    if(app.error){alert(app.error.message);return;}
    if(status==='accepted'){
      const member=await db.from('game_members').upsert({game_id:game.id,player_id:app.data.player_id,role:'player'},{onConflict:'game_id,player_id'});
      if(member.error){alert(member.error.message);return;}
    }
    const {error}=await db.from('game_applications').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('game_id',game.id);
    if(error){alert(error.message);return;}
    await loadApplications();await loadLords();
  }

  function initShardCreator(){
    const panel=document.getElementById('shardCreator'); if(!panel)return;
    const form=document.getElementById('shardCreatorForm'); if(!form)return;
    const fill=(id,items,label,value)=>{document.getElementById(id).innerHTML=items.map(x=>'<option value="'+esc(value(x))+'">'+esc(label(x))+'</option>').join('')};
    fill('shardType',VA34_RULES.shardTypes,x=>x.name,x=>x.id);fill('shardSize',VA34_RULES.shardSizes,x=>x.name+' — '+x.value,x=>x.value);fill('shardMood',VA34_RULES.moods,x=>x,x=>x);fill('shardTerrain',VA34_RULES.terrains,x=>x,x=>x);
    form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form);const payload={game_id:game.id,created_by:user.id,name:String(f.get('name')||'').trim(),type:String(f.get('type')||'ordinary'),size:Number(f.get('size')||1),income:Number(f.get('income')||0),race:String(f.get('race')||''),population:String(f.get('population')||''),mood:String(f.get('mood')||'Спокойное'),garrison:Number(f.get('garrison')||0),supply:Number(f.get('supply')||0),defense:Number(f.get('defense')||0),terrain:String(f.get('terrain')||''),description:String(f.get('description')||'')};if(!payload.name){alert('Укажите название осколка.');return;}const {error}=await db.from('free_shards').insert(payload);if(error){alert(error.message);return;}form.reset();await loadShards();};
    panel.hidden=false;
  }

  async function loadMyTurn(){
    const box=document.getElementById('myTurnEditor'); if(!box)return;
    const mine=await db.from('lords').select('id,name').eq('game_id',game.id).eq('player_id',user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();
    if(mine.error){box.innerHTML='<div class="notice">'+esc(mine.error.message)+'</div>';return;}
    if(!mine.data){box.innerHTML='<div class="notice">У вас пока нет Владыки в этой игре.</div>';return;}

    const turns=await db.from('turns').select('*').eq('lord_id',mine.data.id).order('turn_number',{ascending:false}).limit(1);
    if(turns.error){box.innerHTML='<div class="notice">'+esc(turns.error.message)+'</div>';return;}
    let turn=turns.data?.[0]||null;

    if(turn && turn.status!=='draft'){
      if(turn.status==='submitted'){
        const actions=await db.from('turn_actions').select('*').eq('turn_id',turn.id).order('action_order',{ascending:true});
        if(actions.error){box.innerHTML='<div class="notice">'+esc(actions.error.message)+'</div>';return;}
        box.innerHTML='<article class="entity"><h3>Ход №'+turn.turn_number+' — '+val(mine.data.name)+'</h3><p class="muted">Статус: <b>'+esc(turnText[turn.status]||turn.status)+'</b></p><p>Ход уже отправлен Мастеру и сейчас ожидает рассмотрения.</p><div class="notice">'+(actions.data||[]).map(renderMyTurnAction).join('')+'</div></article>';
        return;
      }
      const nextNumber=Number(turn.turn_number||0)+1;
      const created=await db.from('turns').insert({lord_id:mine.data.id,turn_number:nextNumber,status:'draft'}).select('*').single();
      if(created.error){box.innerHTML='<div class="notice">'+esc(created.error.message)+'</div>';return;}
      turn=created.data;
    } else if(!turn){
      const created=await db.from('turns').insert({lord_id:mine.data.id,turn_number:1,status:'draft'}).select('*').single();
      if(created.error){box.innerHTML='<div class="notice">'+esc(created.error.message)+'</div>';return;}
      turn=created.data;
    }

    const actions=await db.from('turn_actions').select('*').eq('turn_id',turn.id).order('action_order',{ascending:true});
    if(actions.error){box.innerHTML='<div class="notice">'+esc(actions.error.message)+'</div>';return;}

    box.innerHTML='<article class="entity"><div class="section-head"><div><h3>Ход №'+turn.turn_number+' — '+val(mine.data.name)+'</h3><p class="muted">Статус: '+esc(turnText[turn.status]||turn.status)+'</p></div></div>'+
      '<div id="myTurnActions">'+(actions.data||[]).map(renderMyTurnAction).join('')+'</div>'+
      '<div class="data-actions"><button id="addTurnAction">＋ Добавить действие</button><button class="primary" id="submitMyTurn">Отправить Мастеру</button></div>'+
      '</article>';

    document.getElementById('addTurnAction').onclick=()=>addMyTurnAction(turn.id);
    document.getElementById('submitMyTurn').onclick=()=>submitMyTurn(turn.id);
    box.querySelectorAll('[data-delete-action]').forEach(b=>b.onclick=()=>deleteMyTurnAction(b.dataset.deleteAction,turn.id));
  }

  const actionMechanics={
    main:[{id:'attack',name:'Атака'} ,{id:'other',name:'Прочее'}],
    extra:[{id:'technology',name:'Развитие технологий'},{id:'magic',name:'Развитие магии'},{id:'other',name:'Прочее'}]
  };

  function developmentChoices(kind){
    if(kind==='technology') return '<label>Технология<select name="development_name" required><option value="">— выбрать технологию —</option>'+list(window.VA34_RULES?.technologies).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select></label><label>Уровень развития<select name="development_level">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label>';
    if(kind==='magic') return '<label>Школа магии<select name="development_name" required><option value="">— выбрать школу магии —</option>'+list(window.VA34_RULES?.magicSchools).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select></label><label>Уровень развития<select name="development_level">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label>';
    return '';
  }

  function renderMechanicFields(form,kind){
    const fields=form.querySelector('[data-mechanic-fields]');
    if(fields)fields.innerHTML=developmentChoices(kind);
  }

  function renderMyTurnAction(a){
    const mechanism=a.validation?.mechanic_name||a.validation?.mechanic||'Прочее';
    const target=a.validation?.development_name?'<p><b>'+esc(a.validation.development_type==='magic'?'Школа магии':'Технология')+':</b> '+esc(a.validation.development_name)+' · уровень '+esc(a.validation.development_level)+'</p>':'';
    return '<article class="notice" data-action-card="'+a.id+'"><div class="section-head"><b>'+val(a.title||'Без названия')+'</b><button type="button" data-delete-action="'+a.id+'">Удалить</button></div><p>'+esc(a.action_kind==='main'?'Основное действие':'Дополнительное действие')+' · <b>'+esc(mechanism)+'</b></p>'+target+'<p>'+esc(a.description||'')+'</p></article>';
  }

  async function addMyTurnAction(turnId){
    const box=document.getElementById('myTurnEditor');
    const old=box.querySelector('#myTurnActionForm');
    if(old){old.remove();return;}
    const form=document.createElement('form');
    form.id='myTurnActionForm';
    form.className='entity';
    form.innerHTML='<h3>Новое действие</h3><div class="form-grid"><label>Тип действия<select name="action_kind" required><option value="main">Основное</option><option value="extra">Дополнительное</option><option value="other">Прочее</option></select></label><label>Механика<select name="mechanic" required></select></label><div class="wide" data-mechanic-fields></div><label class="wide">Название действия<input name="title" required></label><label class="wide">Описание / цель<textarea name="description" rows="4" placeholder="Что именно вы хотите сделать и чего хотите добиться?"></textarea></label><div class="wide data-actions"><button class="primary" type="submit">Добавить действие</button><button type="button" id="cancelTurnAction">Отмена</button></div></div>';
    box.querySelector('.data-actions')?.before(form);
    const kindSelect=form.querySelector('[name="action_kind"]');
    const mechanicSelect=form.querySelector('[name="mechanic"]');
    const otherMechanics=[{id:'other',name:'Прочее'}];
    const refresh=()=>{
      const kind=kindSelect.value;
      const choices=kind==='other'?otherMechanics:actionMechanics[kind];
      mechanicSelect.innerHTML=choices.map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join('');
      renderMechanicFields(form,mechanicSelect.value);
    };
    kindSelect.onchange=refresh;
    mechanicSelect.onchange=()=>renderMechanicFields(form,mechanicSelect.value);
    form.querySelector('#cancelTurnAction').onclick=()=>form.remove();
    form.onsubmit=async e=>{
      e.preventDefault();
      const data=new FormData(form), kind=data.get('action_kind'), mechanic=data.get('mechanic');
      const title=String(data.get('title')||'').trim();
      if(!title){alert('Укажите название действия.');return;}
      const current=await db.from('turn_actions').select('action_order').eq('turn_id',turnId).order('action_order',{ascending:false}).limit(1);
      const order=Number(current.data?.[0]?.action_order||0)+1;
      const validation={mechanic,mechanic_name:(kind==='other'?'Прочее':(actionMechanics[kind]||[]).find(x=>x.id===mechanic)?.name||mechanic)};
      if(mechanic==='technology'||mechanic==='magic'){
        const developmentName=String(data.get('development_name')||'').trim();
        if(!developmentName){alert(mechanic==='technology'?'Выберите технологию.':'Выберите школу магии.');return;}
        validation.development_type=mechanic;
        validation.development_name=developmentName;
        validation.development_level=Number(data.get('development_level')||1);
      }
      const {error}=await db.from('turn_actions').insert({turn_id:turnId,action_order:order,action_kind:kind==='extra'?'extra':'main',title,description:String(data.get('description')||'').trim(),energy_cost:0,status:'pending',validation});
      if(error){alert(error.message);return;}
      await loadMyTurn();
    };
    refresh();
  }

  async function deleteMyTurnAction(actionId,turnId){
    if(!confirm('Удалить действие из черновика?'))return;
    const {error}=await db.from('turn_actions').delete().eq('id',actionId).eq('turn_id',turnId);
    if(error){alert(error.message);return;}
    await loadMyTurn();
  }

  async function submitMyTurn(turnId){
    const actions=await db.from('turn_actions').select('id').eq('turn_id',turnId);
    if(actions.error){alert(actions.error.message);return;}
    if(!actions.data?.length){alert('Добавьте хотя бы одно действие.');return;}
    if(!confirm('Отправить ход Мастеру? После отправки редактирование будет закрыто.'))return;
    const {error}=await db.from('turns').update({status:'submitted',submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',turnId).eq('status','draft');
    if(error){alert(error.message);return;}
    await loadMyTurn();
    await loadTurns();
  }

  async function loadTurns(){
    const box=document.getElementById('turnsList');if(!box)return;
    const members=await db.from('game_members').select('player_id').eq('game_id',game.id).eq('role','player');
    const ids=(members.data||[]).map(x=>x.player_id);
    const lords=ids.length?await db.from('lords').select('id,name,player_id').eq('game_id',game.id).in('player_id',ids):{data:[]};
    const lordIds=(lords.data||[]).map(x=>x.id);
    if(!lordIds.length){box.innerHTML='<div class="notice">Ходов пока нет.</div>';return;}
    const turns=await db.from('turns').select('*').in('lord_id',lordIds).order('turn_number',{ascending:false}).order('updated_at',{ascending:false});
    if(turns.error){box.innerHTML='<div class="notice">'+esc(turns.error.message)+'</div>';return;}
    const map={};(lords.data||[]).forEach(l=>map[l.id]=l);
    const people=await db.from('players').select('id,display_name,player_name').in('id',ids);const names={};(people.data||[]).forEach(p=>names[p.id]=p.player_name||p.display_name||'Игрок');
    if(!turns.data?.length){box.innerHTML='<div class="notice">Ходов пока нет.</div>';return;}
    box.innerHTML='<div class="entity-list">'+turns.data.map(t=>{const l=map[t.lord_id]||{};return '<article class="entity"><h3>📋 Ход №'+t.turn_number+' — '+val(l.name||'Владыка')+'</h3><p>Игрок: '+esc(names[l.player_id]||'—')+' · <span class="badge">'+esc(turnText[t.status]||t.status)+'</span></p><p>Изменён: '+esc(new Date(t.updated_at||Date.now()).toLocaleString())+'</p><button data-open-turn="'+t.id+'">Открыть ход</button></article>';}).join('')+'</div>';
    box.querySelectorAll('[data-open-turn]').forEach(b=>b.onclick=()=>openTurn(b.dataset.openTurn));
  }

  async function openTurn(turnId){
    const t=await db.from('turns').select('*').eq('id',turnId).single();if(t.error){alert(t.error.message);return;}
    const acts=await db.from('turn_actions').select('*').eq('turn_id',turnId).order('action_order',{ascending:true});if(acts.error){alert(acts.error.message);return;}
    const lord=await db.from('lords').select('name,player_id').eq('id',t.data.lord_id).single();
    const person=lord.data?await db.from('players').select('display_name,player_name').eq('id',lord.data.player_id).single():{data:null};
    const detail=document.getElementById('turnDetail');
    detail.hidden=false;detail.innerHTML='<div class="entity"><span class="badge">'+esc(turnText[t.data.status]||t.data.status)+'</span><h3>Ход №'+t.data.turn_number+' — '+val(lord.data?.name)+'</h3><p>Игрок: '+val(person.data?.player_name||person.data?.display_name)+'</p>'+(acts.data||[]).map((a,i)=>'<div class="notice"><b>'+(i+1)+'. '+val(a.title)+'</b><p>'+esc(a.action_kind==='main'?'Основное':'Дополнительное')+' · '+Number(a.energy_cost||0)+' энергии</p><p>'+esc(a.description||'')+'</p></div>').join('')+(master?'<div class="data-actions"><button class="primary" data-turn-status="approved">Принять</button><button data-turn-status="rejected">Отклонить</button><button data-turn-status="resolved">Разрешён</button></div>':'')+'</div>';
    detail.querySelectorAll('[data-turn-status]').forEach(b=>b.onclick=()=>setTurnStatus(t.data.id,b.dataset.turnStatus));
  }

  async function setTurnStatus(id,status){
    const {error}=await db.from('turns').update({status,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){alert(error.message);return;}document.getElementById('turnDetail').hidden=true;await loadTurns();
  }

  document.addEventListener('DOMContentLoaded',()=>init().catch(e=>{const s=document.getElementById('status');if(s)s.textContent='Ошибка: '+e.message;console.error(e)}));
})();