(()=>{
  // При сохранении Владыки родовой осколок является частью его стартовой заявки
  // и не должен требовать отдельного создания в разделе «Мир».
  function ensureAncestralShard(){
    if(!window.state || !window.state.lord) return;
    const lord=window.state.lord;
    let shard=window.state.shards.find(x=>x.type==='ancestral');
    if(!shard){
      shard={id:typeof id==='function'?id():Date.now().toString(36),type:'ancestral',size:1,income:0,garrison:0,supply:0,defense:0,buildings:0,resources:'',description:''};
      window.state.shards.unshift(shard);
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

  if(typeof save==='function'){
    const originalSave=save;
    window.save=function(){
      ensureAncestralShard();
      return originalSave.apply(this,arguments);
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
