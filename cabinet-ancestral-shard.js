(()=>{
  // При сохранении Владыки родовой осколок является частью его стартовой заявки
  // и не должен требовать отдельного создания в разделе «Мир».
  function ensureAncestralShard(){
    if(typeof state==='undefined'||!state.lord) return;
    const lord=state.lord;
    let shard=state.shards.find(x=>x.type==='ancestral');
    if(!shard){
      shard={id:typeof id==='function'?id():Date.now().toString(36),type:'ancestral',size:1,income:0,garrison:0,supply:0,defense:0,buildings:0,resources:'',description:''};
      state.shards.unshift(shard);
    }
    shard.name=lord.ancestralName||shard.name||'';
    shard.race=lord.ancestralRace||shard.race||'';
    shard.terrain=lord.ancestralTerrain||shard.terrain||'';
    shard.income=Number(lord.ancestralIncome||0);
    shard.garrison=Number(lord.ancestralGarrison||0);
    // В форме родового осколка отдельного поля снабжения нет; сохраняем
    // как минимум снабжение, достаточное для указанного стартового гарнизона.
    shard.supply=Math.max(Number(shard.supply||0),shard.garrison);
    shard.buildings=Number(shard.buildings||0);
  }

  async function persistApplicationFields(){
    try{
      if(typeof state==='undefined'||!state.lord||!window.supabase||!window.VA34_SUPABASE)return;
      const client=window.supabase.createClient(VA34_SUPABASE.url,VA34_SUPABASE.publishableKey);
      const auth=await client.auth.getUser();
      const user=auth.data.user;
      if(!user)return;
      let q=client.from('lords').select('id').eq('player_id',user.id).order('created_at',{ascending:false}).limit(1);
      const gameId=localStorage.getItem('va34_current_game_id');
      if(gameId)q=q.eq('game_id',gameId);
      const found=await q.maybeSingle();
      if(found.error||!found.data)return;
      const lord=state.lord;
      await client.from('lords').update({
        world_name:lord.worldName||'',
        player_name:lord.playerName||'',
        starting_tech:lord.startingTech||'',
        starting_magic:lord.startingMagic||'',
        starting_troops:lord.startingTroops||'',
        updated_at:new Date().toISOString()
      }).eq('id',found.data.id);
    }catch(e){
      // Основное сохранение не блокируем, если миграция дополнительных полей
      // ещё не выполнена в Supabase.
      console.warn('VA34 application fields were not persisted:',e);
    }
  }

  if(typeof save==='function'){
    const originalSave=save;
    save=function(){
      ensureAncestralShard();
      const result=originalSave.apply(this,arguments);
      persistApplicationFields();
      return result;
    };
  }

  // После загрузки облачного состояния переносим данные родового осколка
  // обратно в поля Владыки, чтобы форма не теряла их при перезагрузке.
  if(window.VA34_CLOUD&&typeof VA34_CLOUD.getState==='function'){
    const originalGetState=VA34_CLOUD.getState;
    VA34_CLOUD.getState=async function(){
      const result=await originalGetState.apply(this,arguments);
      if(result&&result.lord){
        const ancestral=(result.shards||[]).find(x=>x.type==='ancestral');
        if(ancestral){
          result.lord.ancestralName=ancestral.name||'';
          result.lord.ancestralRace=ancestral.race||'';
          result.lord.ancestralTerrain=ancestral.terrain||'';
          result.lord.ancestralIncome=Number(ancestral.income||0);
          result.lord.ancestralGarrison=Number(ancestral.garrison||0);
        }
      }
      return result;
    };
  }
})();
