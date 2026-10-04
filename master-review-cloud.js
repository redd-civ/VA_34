/* VA-34 persistent Master review queue. Requires Supabase client + VA34_SUPABASE. */
(()=>{
  const cfg=window.VA34_SUPABASE||{};
  const configured=Boolean(cfg.url&&cfg.publishableKey&&window.supabase);
  let db=null,user=null;
  if(configured)db=window.supabase.createClient(cfg.url,cfg.publishableKey);
  const currentGame=()=>localStorage.getItem('va34_current_game_id')||null;
  async function init(){if(!db)return {configured:false,authenticated:false};const r=await db.auth.getUser();user=r.data.user||null;return {configured:true,authenticated:!!user,user};}
  async function currentLord(){
    if(!db||!user)return null; const gid=currentGame(); if(!gid)return null;
    const r=await db.from('lords').select('id,game_id,name,player_id').eq('game_id',gid).eq('player_id',user.id).limit(1).maybeSingle();
    if(r.error)throw r.error; return r.data||null;
  }
  async function request(item){
    if(!db||!user)throw new Error('Облачное хранилище недоступно.');
    const lord=await currentLord(); if(!lord)throw new Error('Сначала выберите игру и создайте Владыку.');
    const payload={game_id:lord.game_id,lord_id:lord.id,player_id:user.id,type:item.type||'special_tz',item_id:item.item_id||item.id||null,title:item.title||'',description:item.description||'',payload:item.payload||{},status:'pending'};
    const r=await db.from('master_reviews').insert(payload).select('*').single(); if(r.error)throw r.error; return r.data;
  }
  async function listForPlayer(){
    if(!db||!user)return[]; const lord=await currentLord(); if(!lord)return[];
    const r=await db.from('master_reviews').select('*').eq('lord_id',lord.id).order('created_at',{ascending:false}); if(r.error)throw r.error; return r.data||[];
  }
  async function listForMaster(gameId){
    if(!db||!user)return[]; let q=db.from('master_reviews').select('*').order('created_at',{ascending:false}); if(gameId)q=q.eq('game_id',gameId); const r=await q; if(r.error)throw r.error; return r.data||[];
  }
  async function decide(id,status,note=''){
    if(!db||!user)throw new Error('Облачное хранилище недоступно.');
    const r=await db.from('master_reviews').update({status,master_id:user.id,decision_note:note||'',updated_at:new Date().toISOString()}).eq('id',id).select('*').single(); if(r.error)throw r.error; return r.data;
  }
  window.VA34_MASTER_CLOUD={configured,init,request,listForPlayer,listForMaster,decide};
})();
