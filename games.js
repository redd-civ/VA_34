(()=> {
  let user=null, db=null, master=false;

  const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const statusText={open:'Открыта',running:'Идёт',closed:'Закрыта',finished:'Завершена'};
  const roleText={pending:'На рассмотрении',accepted:'Принята',rejected:'Отклонена',withdrawn:'Отозвана'};

  async function init(){
    const s=document.getElementById('status');
    const r=await VA34_CLOUD.init();
    if(!r.authenticated){s.textContent='Войдите в аккаунт, чтобы работать с играми.';return;}
    user=r.user;
    db=window.supabase.createClient(VA34_SUPABASE.url,VA34_SUPABASE.publishableKey);
    const me=await db.from('players').select('display_name,is_master').eq('id',user.id).single();
    if(me.error) throw me.error;
    master=!!me.data?.is_master;
    s.textContent='Аккаунт: '+(me.data?.display_name||user.email||user.id);
    if(master) document.getElementById('masterPanel').style.display='block';
    await load();
    await loadMyApplications();
  }

  async function load(){
    const box=document.getElementById('games');
    const {data,error}=await db.from('games').select('*').order('created_at',{ascending:false});
    if(error) throw error;
    const games=data||[];
    if(!games.length){box.innerHTML='<div class="notice">Открытых игр пока нет.</div>';return;}
    const ids=games.map(g=>g.id);
    const members=await db.from('game_members').select('game_id,role').in('game_id',ids);
    const counts={};
    (members.data||[]).forEach(m=>{if(m.role==='player')counts[m.game_id]=(counts[m.game_id]||0)+1;});
    const mine=await db.from('game_applications').select('game_id,status').eq('player_id',user.id).in('game_id',ids);
    const apps={};
    (mine.data||[]).forEach(a=>apps[a.game_id]=a.status);
    box.innerHTML=games.map(g=>{
      const count=counts[g.id]||0, app=apps[g.id], full=count>=g.max_players;
      let action='';
      if(g.master_id===user.id) action='<span class="notice">Вы мастер этой игры</span>';
      else if(app) action='<span class="notice">'+esc(roleText[app]||app)+'</span>';
      else if(g.status==='open'&&!full) action='<button class="primary" data-apply="'+g.id+'">Подать заявку</button>';
      else if(full) action='<span class="notice">Мест нет</span>';
      else action='<span class="notice">Приём заявок закрыт</span>';
      return '<article class="entity"><h3>'+esc(g.name)+'</h3><p>'+esc(g.description||'Без описания')+'</p><p>Игроков: '+count+' / '+g.max_players+' · Статус: '+esc(statusText[g.status]||g.status)+'</p><div>'+action+'</div></article>';
    }).join('');
    box.querySelectorAll('[data-apply]').forEach(b=>b.onclick=()=>apply(b.dataset.apply));
    if(master) await loadMasterGames(games);
  }

  async function apply(gameId){
    const message=prompt('Сообщение мастеру (необязательно):','');
    if(message===null)return;
    const {error}=await db.from('game_applications').insert({game_id:gameId,player_id:user.id,message});
    if(error) alert(error.message); else {alert('Заявка отправлена мастеру.');await load();}
  }

  async function loadMyApplications(){
    const box=document.getElementById('myApplications');
    const {data,error}=await db.from('game_applications').select('game_id,status,message,created_at').eq('player_id',user.id).order('created_at',{ascending:false});
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    if(!data?.length){box.innerHTML='<div class="notice">Заявок пока нет.</div>';return;}
    const ids=[...new Set(data.map(a=>a.game_id))];
    const games=await db.from('games').select('id,name').in('id',ids);
    const names={};(games.data||[]).forEach(g=>names[g.id]=g.name);
    box.innerHTML=data.map(a=>'<article class="entity"><b>'+esc(names[a.game_id]||'Игра')+'</b><p>'+esc(roleText[a.status]||a.status)+(a.message?' · '+esc(a.message):'')+'</p></article>').join('');
  }

  async function loadMasterGames(games){
    const box=document.getElementById('myGames');
    const mine=games.filter(g=>g.master_id===user.id);
    if(!mine.length){box.innerHTML='<div class="notice">У вас пока нет игр.</div>';return;}
    box.innerHTML=mine.map(g=>'<article class="entity"><h3>'+esc(g.name)+'</h3><p>Статус: '+esc(statusText[g.status]||g.status)+' · лимит: '+g.max_players+'</p><button data-app="'+g.id+'">Заявки</button> <button data-start="'+g.id+'" '+(g.status!=='open'?'disabled':'')+'>Запустить игру</button><div id="app-'+g.id+'"></div></article>').join('');
    box.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>apps(b.dataset.app));
    box.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>startGame(b.dataset.start));
  }

  async function apps(gameId){
    const box=document.getElementById('app-'+gameId);
    const {data,error}=await db.from('game_applications').select('id,player_id,message,status,created_at').eq('game_id',gameId).order('created_at',{ascending:true});
    if(error){box.innerHTML='<p>'+esc(error.message)+'</p>';return;}
    if(!data?.length){box.innerHTML='<p>Заявок нет.</p>';return;}
    const ids=[...new Set(data.map(a=>a.player_id))];
    const people=await db.from('players').select('id,display_name').in('id',ids);
    const names={};(people.data||[]).forEach(p=>names[p.id]=p.display_name||p.id);
    box.innerHTML=data.map(a=>'<div class="notice"><b>'+esc(names[a.player_id]||a.player_id)+'</b> — '+esc(roleText[a.status]||a.status)+(a.message?'<br>'+esc(a.message):'')+(a.status==='pending'?' <button data-accept="'+a.id+'">Принять</button> <button data-reject="'+a.id+'">Отклонить</button>':'')+'</div>').join('');
    box.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>decide(b.dataset.accept,'accepted',gameId));
    box.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>decide(b.dataset.reject,'rejected',gameId));
  }

  async function decide(id,status,gameId){
    const {data:app,error:getError}=await db.from('game_applications').select('player_id').eq('id',id).single();
    if(getError){alert(getError.message);return;}
    if(status==='accepted'){
      const {error}=await db.from('game_members').upsert({game_id:gameId,player_id:app.player_id,role:'player'},{onConflict:'game_id,player_id'});
      if(error){alert(error.message);return;}
    }
    const {error}=await db.from('game_applications').update({status,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){alert(error.message);return;}
    await load(); await apps(gameId);
  }

  async function startGame(gameId){
    if(!confirm('Запустить игру? После этого новые заявки приниматься не будут.'))return;
    const {error}=await db.from('games').update({status:'running',updated_at:new Date().toISOString()}).eq('id',gameId).eq('master_id',user.id);
    if(error)alert(error.message);else await load();
  }

  document.getElementById('createGame').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    const max=Math.max(1,Math.min(100,Number(f.get('max'))||10));
    const {error}=await db.from('games').insert({master_id:user.id,name:String(f.get('name')).trim(),description:String(f.get('description')||'').trim(),max_players:max});
    if(error)alert(error.message);else{e.target.reset();await load();await loadMyApplications();}
  };

  document.addEventListener('DOMContentLoaded',()=>init().catch(e=>{
    const s=document.getElementById('status'); if(s)s.textContent='Ошибка: '+e.message;
  }));
})();