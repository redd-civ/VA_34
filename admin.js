(()=> {
  let db=null,user=null;

  const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const status=()=>document.getElementById('status');
  const users=()=>document.getElementById('users');

  async function init(){
    const cfg=window.VA34_SUPABASE||{};
    if(!cfg.url||!cfg.publishableKey||!window.supabase){
      status().textContent='Supabase не настроен.';
      return;
    }
    db=window.supabase.createClient(cfg.url,cfg.publishableKey);
    const auth=await db.auth.getUser();
    user=auth.data?.user;
    if(!user){location.href='auth.html';return;}

    const me=await db.from('players').select('id,display_name,player_name,is_admin,is_master').eq('id',user.id).single();
    if(me.error){status().textContent='Ошибка проверки статуса: '+me.error.message;return;}
    if(!me.data?.is_admin){
      status().textContent='Доступ только для пользователей со статусом администратора.';
      return;
    }

    status().textContent='Администратор: '+(me.data.display_name||me.data.player_name||user.email||user.id);
    document.getElementById('adminPanel').style.display='block';
    await loadUsers();
  }

  async function loadUsers(){
    const {data,error}=await db.from('players')
      .select('id,display_name,player_name,is_admin,is_master,created_at')
      .order('created_at',{ascending:true});
    if(error){users().innerHTML='<div class="notice warning">'+esc(error.message)+'</div>';return;}

    users().innerHTML=(data||[]).map(p=>{
      const name=p.display_name||p.player_name||'Без имени';
      const account=p.id===user.id?' (это вы)':'';
      return '<article class="entity">'+
        '<h3>'+esc(name)+esc(account)+'</h3>'+
        '<p class="muted">'+esc(p.player_name||'Логин/имя игрока не указано')+'</p>'+
        '<p>Администратор: <strong>'+(p.is_admin?'да':'нет')+'</strong> · Мастер: <strong>'+(p.is_master?'да':'нет')+'</strong></p>'+
        '<div class="data-actions">'+
          (p.is_master
            ? '<button data-master="false" data-id="'+p.id+'">Снять статус Мастера</button>'
            : '<button class="primary" data-master="true" data-id="'+p.id+'">Назначить Мастером</button>')+
        '</div>'+
      '</article>';
    }).join('')||'<div class="notice">Пользователей пока нет.</div>';

    users().querySelectorAll('[data-master]').forEach(b=>{
      b.onclick=()=>setMaster(b.dataset.id,b.dataset.master==='true');
    });
  }

  async function setMaster(playerId,grant){
    const action=grant?'назначить пользователя Мастером':'снять с пользователя статус Мастера';
    if(!confirm('Вы уверены, что хотите '+action+'?'))return;

    const {error}=await db.rpc('va34_set_master',{
      target_player_id:playerId,
      grant_master:grant
    });
    if(error){alert(error.message);return;}
    await loadUsers();
  }

  init().catch(err=>{
    console.error(err);
    status().textContent='Ошибка: '+(err.message||err);
  });
})();