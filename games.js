(()=> {
  let user=null, db=null, master=false, game=null;

  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const statusText={open:'Приём заявок открыт',running:'Игра идёт',closed:'Приём заявок закрыт',finished:'Игра завершена'};
  const roleText={pending:'На рассмотрении',accepted:'Принята',rejected:'Отклонена',withdrawn:'Отозвана'};

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

    // Игра одна. Если её ещё нет, она создаётся автоматически при первом входе назначенного Мастера.
    if(!game && master){
      const created=await db.from('games').insert({
        master_id:user.id,
        name:'Вдохновение Астрала',
        description:'Основная кампания VA-34.',
        max_players:100,
        status:'open'
      }).select('*').single();
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

    if(member){
      box.innerHTML='<div class="notice">✓ Вы приняты в игру. <a class="primary" href="cabinet.html">Открыть игровой кабинет</a></div>';
      return;
    }

    if(data){
      if(data.status==='pending'){
        box.innerHTML='<div class="notice">Ваша заявка находится на рассмотрении у Мастера.</div>';
      }else if(data.status==='accepted'){
        box.innerHTML='<div class="notice">✓ Заявка принята. <a class="primary" href="cabinet.html">Открыть игровой кабинет</a></div>';
      }else{
        box.innerHTML='<div class="notice">Статус заявки: '+esc(roleText[data.status]||data.status)+'</div>';
      }
      return;
    }

    if(game.status!=='open'){
      box.innerHTML='<div class="notice">Приём новых игроков сейчас закрыт.</div>';
      return;
    }

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

  async function loadApplications(){
    const box=document.getElementById('applications');
    const {data,error}=await db.from('game_applications').select('id,player_id,message,status,created_at').eq('game_id',game.id).order('created_at',{ascending:true});
    if(error){box.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return;}
    if(!data?.length){box.innerHTML='<div class="notice">Заявок пока нет.</div>';return;}

    const ids=[...new Set(data.map(a=>a.player_id))];
    const people=await db.from('players').select('id,display_name,player_name').in('id',ids);
    const names={};(people.data||[]).forEach(p=>names[p.id]=p.player_name||p.display_name||p.id);

    box.innerHTML=data.map(a=>'<div class="notice"><b>'+esc(names[a.player_id]||a.player_id)+'</b> — '+esc(roleText[a.status]||a.status)+(a.message?'<br>'+esc(a.message):'')+(a.status==='pending'?' <button data-accept="'+a.id+'">Принять</button> <button data-reject="'+a.id+'">Отклонить</button>':'')+'</div>').join('');
    box.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>decide(b.dataset.accept,'accepted'));
    box.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>decide(b.dataset.reject,'rejected'));
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