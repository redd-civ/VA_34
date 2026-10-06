(()=> {
  let db=null,user=null,allUsers=[];

  const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const status=()=>document.getElementById('status');
  const users=()=>document.getElementById('users');
  const summary=()=>document.getElementById('summary');

  async function init(){
    const cfg=window.VA34_SUPABASE||{};
    if(!cfg.url||!cfg.publishableKey||!window.supabase){status().textContent='Supabase не настроен.';return;}
    db=window.supabase.createClient(cfg.url,cfg.publishableKey);
    const auth=await db.auth.getUser();
    user=auth.data?.user;
    if(!user){location.href='auth.html';return;}

    const me=await db.from('players').select('id,display_name,player_name,is_admin,is_master').eq('id',user.id).single();
    if(me.error){status().textContent='Ошибка проверки статуса: '+me.error.message;return;}
    if(!me.data?.is_admin){status().textContent='Доступ только для пользователей со статусом администратора.';return;}

    status().textContent='Администратор: '+(me.data.player_name||me.data.display_name||user.email||user.id);
    document.getElementById('adminPanel').style.display='block';
    document.getElementById('search').addEventListener('input',renderUsers);
    document.getElementById('roleFilter').addEventListener('change',renderUsers);
    document.getElementById('refresh').addEventListener('click',loadUsers);
    await loadUsers();
  }

  async function loadUsers(){
    const button=document.getElementById('refresh');
    if(button){button.disabled=true;button.textContent='↻ Обновление…';}
    const {data,error}=await db.from('players')
      .select('id,display_name,player_name,is_admin,is_master,created_at,updated_at')
      .order('created_at',{ascending:true});
    if(button){button.disabled=false;button.textContent='↻ Обновить';}
    if(error){users().innerHTML='<div class="notice warning">'+esc(error.message)+'</div>';return;}
    allUsers=data||[];
    renderUsers();
  }

  function renderUsers(){
    const query=document.getElementById('search').value.trim().toLowerCase();
    const filter=document.getElementById('roleFilter').value;
    const filtered=allUsers.filter(p=>{
      const name=(p.player_name||p.display_name||'').toLowerCase();
      const matchesSearch=!query||name.includes(query)||String(p.id).toLowerCase().includes(query);
      const matchesRole=filter==='all'||(filter==='admin'&&p.is_admin)||(filter==='master'&&!p.is_admin&&p.is_master)||(filter==='player'&&!p.is_admin&&!p.is_master);
      return matchesSearch&&matchesRole;
    });

    const admins=allUsers.filter(p=>p.is_admin).length;
    const masters=allUsers.filter(p=>!p.is_admin&&p.is_master).length;
    const players=allUsers.filter(p=>!p.is_admin&&!p.is_master).length;
    summary().innerHTML='<div><strong>'+allUsers.length+'</strong><span>всего игроков</span></div><div><strong>'+players+'</strong><span>игроков</span></div><div><strong>'+masters+'</strong><span>Мастеров</span></div><div><strong>'+admins+'</strong><span>администраторов</span></div>';

    if(!filtered.length){users().innerHTML='<div class="notice">По заданным условиям игроки не найдены.</div>';return;}

    users().innerHTML=filtered.map(p=>{
      const name=p.player_name||p.display_name||'Без имени';
      const isSelf=p.id===user.id;
      const role=p.is_admin?'Администратор':p.is_master?'Мастер':'Игрок';
      const roleClass=p.is_admin?'role-admin':p.is_master?'role-master':'role-player';
      let action='';
      if(p.is_admin){
        action='<span class="muted">Статус администратора управляется отдельно.</span>';
      }else if(p.is_master){
        action='<button data-master="false" data-id="'+esc(p.id)+'">Снять статус Мастера</button>';
      }else{
        action='<button class="primary" data-master="true" data-id="'+esc(p.id)+'">Назначить Мастером</button>';
      }
      return '<article class="user-card">'+
        '<h3>'+esc(name)+(isSelf?' <span class="muted">(это вы)</span>':'')+'</h3>'+
        '<div class="role-badges"><span class="role-badge '+roleClass+'">'+role+'</span>'+(p.is_admin?'<span class="role-badge">Мастер: нет</span>':'')+'</div>'+
        '<div class="user-meta">'+
        '<div><b>Имя игрока:</b> '+esc(p.player_name||'—')+'</div>'+ 
        '<div><b>ID:</b> <small>'+esc(p.id)+'</small></div>'+ 
        '<div><b>Создан:</b> '+esc(formatDate(p.created_at))+'</div>'+ 
        '</div>'+
        '<div class="user-actions">'+action+'</div>'+
        '</article>';
    }).join('');

    users().querySelectorAll('[data-master]').forEach(b=>b.onclick=()=>setMaster(b.dataset.id,b.dataset.master==='true'));
  }

  function formatDate(value){
    if(!value)return '—';
    const d=new Date(value);
    return Number.isNaN(d.getTime())?'—':d.toLocaleString('ru-RU');
  }

  async function setMaster(playerId,grant){
    const target=allUsers.find(p=>p.id===playerId);
    if(!target)return;
    const name=target.player_name||target.display_name||playerId;
    const action=grant?'назначить пользователя Мастером':'снять с пользователя статус Мастера';
    if(!confirm('Вы уверены, что хотите '+action+'?\n\nИгрок: '+name))return;

    const buttons=[...users().querySelectorAll('[data-id="'+CSS.escape(playerId)+'"]')];
    buttons.forEach(b=>b.disabled=true);
    const {error}=await db.rpc('va34_set_master',{target_player_id:playerId,grant_master:grant});
    if(error){alert('Не удалось изменить роль: '+error.message);buttons.forEach(b=>b.disabled=false);return;}
    await loadUsers();
  }

  init().catch(err=>{
    console.error(err);
    status().textContent='Ошибка: '+(err.message||err);
  });
})();