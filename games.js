(()=> {
  let user=null, db=null, master=false, game=null;

  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const statusText={open:'Приём заявок открыт',running:'Игра идёт',closed:'Приём заявок закрыт',finished:'Игра завершена'};
  const roleText={pending:'На рассмотрении',accepted:'Принята',rejected:'Отклонена',withdrawn:'Отозвана'};
  const list=v=>Array.isArray(v)?v:(v?[String(v)]:[]);
  const val=v=>v===null||v===undefined||v===''?'—':esc(v);

  async function init(){
    const s=document.getElementById('status');
    const r=await VA34_CLOUD.init();
    if(!r.authenticated){s.textContent='Войдите в аккаунт, чтобы подать заявку на участие.';return;}
    user=r.user;
    db=window.supabase.createClient(VA34_SUPABASE.url,VA34_SUPABASE.publishableKey);

    const me=await db.from('players').select('display_name,player_name,is_master').eq('id',user.id).single();
    if(me.error) throw me.error;
    master=!!me.data?.is_master;
    s.textContent='Аккаунт: '+(me.data?.player_name||me.data?.display_name||user.email||user.id);

    let result=await db.from('games').select('*').order('created_at',{ascending:true}).limit(1).maybeSingle();
    if(result.error) throw result.error;
    game=result.data;

    if(!game && master){
      const created=await db.from('games').insert({master_id:user.id,name:'Вдохновение Астрала',description:'Основная кампания VA-34.',max_players:100,status:'open'}).select('*').single();
      if(created.error) throw created.error;
      game=created.data;
    }

    if(!game){
      document.getElementById('game').innerHTML='<div class="notice">Основная игра пока не настроена. Обратитесь к Мастеру.</div>';
      document.getElementById('myApplicationSection').style.display='none';
      return;
    }

    if(game.master_id===user.id) master=true;
    renderGame();
    await loadMyApplication();
    if(master && game.master_id===user.id){
      document.getElementById('masterPanel').style.display='block';
      await loadApplications();
    }
  }

  function renderGame(){
    const box=document.getElementById('game');
    box.innerHTML='<article class="entity"><h3>'+esc(game.name)+'</h3><p>'+esc(game.description||'Основная кампания VA-34.')+'</p><p>Статус: '+esc(statusText[game.status]||game.status)+'</p></article>';
  }

  async function loadMyApplication(){
    const box=document.getElementById('myApplication');
    const {data,error}=await db.from('game_applications').select('id,status,message,created_at').eq('game_id',game.id).eq('player_id',user.id).maybeSingle();
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    const {data:member,error:memberError}=await db.from('game_members').select('role').eq('game_id',game.id).eq('player_id',user.id).maybeSingle();
    if(memberError){box.innerHTML='<div class="notice">'+esc(memberError.message)+'</div>';return;}
    if(member){box.innerHTML='<div class="notice">✓ Вы приняты в игру. <a class="primary" href="cabinet.html">Открыть игровой кабинет</a></div>';return;}
    if(data){
      if(data.status==='pending')box.innerHTML='<div class="notice">Ваша заявка находится на рассмотрении у Мастера.</div>';
      else if(data.status==='accepted')box.innerHTML='<div class="notice">✓ Заявка принята. <a class="primary" href="cabinet.html">Открыть игровой кабинет</a></div>';
      else box.innerHTML='<div class="notice">Статус заявки: '+esc(roleText[data.status]||data.status)+'</div>';
      return;
    }
    if(game.status!=='open'){box.innerHTML='<div class="notice">Приём новых игроков сейчас закрыт.</div>';return;}
    box.innerHTML='<p>Чтобы присоединиться к игре, отправьте заявку Мастеру.</p><button class="primary" id="applyButton">Подать заявку</button>';
    document.getElementById('applyButton').onclick=apply;
  }

  async function apply(){
    const button=document.getElementById('applyButton');
    if(button)button.disabled=true;
    const message=prompt('Сообщение Мастеру (необязательно):','');
    if(message===null){if(button)button.disabled=false;return;}
    const {error}=await db.from('game_applications').insert({game_id:game.id,player_id:user.id,message});
    if(error){alert(error.message);if(button)button.disabled=false;return;}
    await loadMyApplication();
  }

  function section(title,html){return '<div class="notice" style="margin-top:12px"><h4 style="margin-top:0">'+title+'</h4>'+html+'</div>';}
  function row(label,value){return '<div><b>'+label+':</b> '+val(value)+'</div>';}
  function chips(items){return list(items).map(x=>'<span class="badge">'+esc(x)+'</span>').join(' ')||'—';}

  async function findLordId(playerId){
    // Основной вариант: Владыка привязан к текущей игре.
    let res=await db.from('lords').select('id').eq('game_id',game.id).eq('player_id',playerId).order('created_at',{ascending:false}).limit(1);
    // Совместимость со старыми записями: если game_id ещё не был добавлен/заполнен,
    // ищем Владыку по игроку. Это позволяет Мастеру увидеть уже созданную заявку
    // до завершения миграции старых данных.
    if(res.error && ['42703','PGRST204','PGRST205'].includes(res.error.code)){
      res=await db.from('lords').select('id').eq('player_id',playerId).order('created_at',{ascending:false}).limit(1);
    }
    if(res.error)throw res.error;
    return {ids:(res.data||[]).map(x=>x.id)};
  }

  async function openApplication(playerId,targetId){
    const target=document.getElementById(targetId);
    if(!target)return;
    if(target.dataset.loaded==='1'){target.hidden=!target.hidden;return;}
    target.hidden=false;
    target.innerHTML='<div class="notice">Загрузка полной заявки…</div>';

    let lordIds=[];
    try{lordIds=(await findLordId(playerId)).ids;}catch(e){target.innerHTML='<div class="warning">Не удалось найти Владыку: '+esc(e.message)+'</div>';return;}
    const playerRes=await db.from('players').select('display_name,player_name').eq('id',playerId).maybeSingle();
    let lordRes=await db.from('lords').select('*').eq('game_id',game.id).eq('player_id',playerId).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(lordRes.error && ['42703','PGRST204','PGRST205'].includes(lordRes.error.code)){
      lordRes=await db.from('lords').select('*').eq('player_id',playerId).order('created_at',{ascending:false}).limit(1).maybeSingle();
    }
    const [shardRes,devRes,heroRes,troopRes]=await Promise.all([
      db.from('shards').select('*').in('lord_id',lordIds),
      db.from('developments').select('*').in('lord_id',lordIds),
      db.from('heroes').select('*').in('lord_id',lordIds),
      db.from('troops').select('*').in('lord_id',lordIds)
    ]);
    const errors=[lordRes,shardRes,devRes,heroRes,troopRes].filter(x=>x.error&&x.error.code!=='PGRST116');
    if(errors.length){target.innerHTML='<div class="warning">Не удалось загрузить полную заявку: '+esc(errors[0].error.message)+'</div>';return;}

    const lord=lordRes.data||null, shards=shardRes.data||[], developments=devRes.data||[], heroes=heroRes.data||[], troops=troopRes.data||[];
    const player=playerRes.data||{};
    let html='';
    if(!lord)html='<div class="warning">Карточка Владыки ещё не создана.</div>';
    else{
      html+=section('👑 Владыка',row('Имя',lord.name)+row('Игрок',lord.player_name||player.player_name||player.display_name||'—')+row('Раса',lord.race)+row('Мир',lord.world_name||lord.worldName)+row('Статус',lord.status)+row('Начальная энергия',lord.energy)+row('Девиз',lord.motto)+row('Способность',lord.ability)+row('Особенности',lord.traits)+row('Артефакты / предметы',lord.items)+row('Ресурсы и постоянные источники дохода',lord.resources)+row('Стартовые рода войск',lord.starting_troops)+row('Стартовые технологии',lord.starting_tech)+row('Стартовые школы магии',lord.starting_magic));
    }

    const ancestral=shards.find(x=>x.type==='ancestral'), ordinary=shards.filter(x=>x.type!=='ancestral');
    if(ancestral)html+=section('🌿 Родовой осколок',row('Название',ancestral.name)+row('Раса',ancestral.race)+row('Ландшафт',ancestral.terrain)+row('Размер',ancestral.size)+row('Доход',ancestral.income)+row('Гарнизон',ancestral.garrison)+row('Снабжение',ancestral.supply)+row('Защита',ancestral.defense)+row('Здания',ancestral.buildings)+row('Ресурсы / трофеи',ancestral.resources));
    else html+=section('🌿 Родовой осколок','<span class="muted">Родовой осколок ещё не сохранён.</span>');

    html+=section('🌍 Обычные осколки',ordinary.length?ordinary.map((x,i)=>'<div style="margin-bottom:10px"><b>'+(i+1)+'. '+val(x.name)+'</b>'+row('Тип',x.type)+row('Размер',x.size)+row('Раса',x.race)+row('Ландшафт',x.terrain)+row('Доход',x.income)+row('Население',x.population)+row('Настроение',x.mood)+row('Гарнизон',x.garrison)+row('Снабжение',x.supply)+row('Защита',x.defense)+row('Здания',x.buildings)+row('Ресурсы / трофеи',x.resources)+'</div>').join(''):'<span class="muted">Обычных осколков нет.</span>');
    html+=section('⚙️ Технологии и магия',developments.length?developments.map(x=>'<div style="margin-bottom:8px"><b>'+val(x.name)+'</b>'+row('Тип',x.kind)+row('Уровень',x.level)+row('Стоимость',x.cost)+(x.description?row('Описание',x.description):'')+'</div>').join(''):'<span class="muted">Сохранённых технологий/школ магии нет.</span>');
    html+=section('🎭 Герои',heroes.length?heroes.map(x=>'<div style="margin-bottom:8px"><b>'+val(x.name)+'</b>'+row('Раса',x.race)+row('Уровень',x.level)+row('Опыт',x.xp)+row('Навыки',chips(x.skills))+row('Перки',chips(x.perks))+row('Витязи',chips(x.knights))+row('Предметы',chips(x.items))+row('Артефакты',chips(x.artifacts))+'</div>').join(''):'<span class="muted">Героев пока нет.</span>');
    html+=section('⚔️ Войска',troops.length?troops.map(x=>'<div style="margin-bottom:8px"><b>'+val(x.name)+'</b>'+row('Тип',x.type)+row('Уровень',x.tier)+row('Количество',x.quantity)+row('Особенности',chips(x.traits))+'</div>').join(''):'<span class="muted">Родов войск пока нет.</span>');
    target.innerHTML=html;
    target.dataset.loaded='1';
  }

  async function loadApplications(){
    const box=document.getElementById('applications');
    const {data,error}=await db.from('game_applications').select('id,player_id,message,status,created_at').eq('game_id',game.id).order('created_at',{ascending:true});
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    if(!data?.length){box.innerHTML='<div class="notice">Заявок пока нет.</div>';return;}
    const ids=[...new Set(data.map(a=>a.player_id))];
    const people=await db.from('players').select('id,display_name,player_name').in('id',ids);
    const names={};(people.data||[]).forEach(p=>names[p.id]=p.player_name||p.display_name||'Игрок');
    if(people.error){console.warn('Не удалось загрузить имена игроков:',people.error.message);}
    const lords=await db.from('lords').select('id,player_id,name').eq('game_id',game.id).in('player_id',ids);
    const lordNames={};(lords.data||[]).forEach(l=>lordNames[l.player_id]=l.name||'Безымянный Владыка');
    box.innerHTML=data.map(a=>{
      const playerName=names[a.player_id]||'Игрок без имени', lordName=lordNames[a.player_id]||'Владыка ещё не создан', detailId='applicationDetail_'+a.id;
      return '<div class="notice" style="margin-bottom:12px"><div><b>'+esc(playerName)+'</b> · 👑 '+esc(lordName)+' — '+esc(roleText[a.status]||a.status)+'</div>'+(a.message?'<div class="muted" style="margin-top:6px">Сообщение: '+esc(a.message)+'</div>':'')+'<div style="margin-top:10px"><button type="button" class="primary" data-view-application="'+a.player_id+'" data-target="'+detailId+'">👁 Просмотреть полную заявку</button>'+(a.status==='pending'?' <button data-accept="'+a.id+'">Принять</button> <button data-reject="'+a.id+'">Отклонить</button>':'')+'</div><div id="'+detailId+'" style="margin-top:10px" hidden></div></div>';
    }).join('');
    box.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>decide(b.dataset.accept,'accepted'));
    box.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>decide(b.dataset.reject,'rejected'));
    box.querySelectorAll('[data-view-application]').forEach(b=>b.onclick=()=>openApplication(b.dataset.viewApplication,b.dataset.target));
  }

  async function decide(id,status){
    const {data:app,error:getError}=await db.from('game_applications').select('player_id').eq('id',id).eq('game_id',game.id).single();
    if(getError){alert(getError.message);return;}
    if(status==='accepted'){
      const {error}=await db.from('game_members').upsert({game_id:game.id,player_id:app.player_id,role:'player'},{onConflict:'game_id,player_id'});
      if(error){alert(error.message);return;}
    }
    const {error}=await db.from('game_applications').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('game_id',game.id);
    if(error){alert(error.message);return;}
    await loadApplications();
  }

  document.addEventListener('DOMContentLoaded',()=>init().catch(e=>{
    const s=document.getElementById('status');
    if(s)s.textContent='Ошибка: '+e.message;
    console.error('VA34 game page failed',e);
  }));
})();