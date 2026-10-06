(()=>{
  function ensureAncestralShard(){
    if(typeof state==='undefined'||!state.lord) return;
    const lord=state.lord;
    let shard=state.shards.find(x=>x.type==='ancestral');
    if(!shard){
      shard={id:typeof id==='function'?id():Date.now().toString(36),type:'ancestral',size:Number(lord.ancestralSize||1),income:0,garrison:0,supply:0,defense:0,buildings:0,resources:'',description:''};
      state.shards.unshift(shard);
    }
    shard.name=lord.ancestralName||shard.name||'';
    shard.race=lord.ancestralRace||shard.race||'';
    shard.terrain=lord.ancestralTerrain||shard.terrain||'';
    shard.size=Number(lord.ancestralSize||shard.size||1);
    shard.income=Number(lord.ancestralIncome||0);
    shard.garrison=Number(lord.ancestralGarrison||0);
    shard.supply=Math.max(Number(shard.supply||0),shard.garrison);
    shard.buildings=Number(shard.buildings||0);
  }

  function addAncestralSizeField(){
    const anchor=document.getElementById('ancestralName');
    if(!anchor||document.getElementById('ancestralSize')) return;
    const label=document.createElement('label');
    label.innerHTML='Размер родового осколка<select id="ancestralSize"></select>';
    anchor.closest('label')?.after(label);
    const select=document.getElementById('ancestralSize');
    const sizes=window.VA34_RULES?.shardSizes||[];
    select.innerHTML=sizes.map(x=>`<option value="${String(x.value)}">${String(x.name)} — ${String(x.value)}</option>`).join('');
    select.value=String(state?.lord?.ancestralSize||1);
    if(![...select.options].some(x=>x.value===select.value) && select.options.length)select.selectedIndex=0;
  }

  function localizeAncestralTypeText(){
    const root=document.getElementById('shardsList');
    if(!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(node.nodeValue.trim()==='ancestral') node.nodeValue='Родовой';
    });
  }

  addAncestralSizeField();
  localizeAncestralTypeText();
  const world=document.getElementById('shardsList');
  if(world) new MutationObserver(localizeAncestralTypeText).observe(world,{childList:true,subtree:true});

  if(typeof save==='function'){
    const originalSave=save;
    save=function(){
      const size=document.getElementById('ancestralSize');
      if(typeof state!=='undefined'&&state.lord&&size) state.lord.ancestralSize=Number(size.value||1);
      ensureAncestralShard();
      const result=originalSave.apply(this,arguments);
      persistApplicationFields();
      return result;
    };
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
      await client.from('lords').update({world_name:lord.worldName||'',player_name:lord.playerName||'',starting_tech:lord.startingTech||'',starting_magic:lord.startingMagic||'',starting_troops:lord.startingTroops||'',updated_at:new Date().toISOString()}).eq('id',found.data.id);
    }catch(e){console.warn('VA34 application fields were not persisted:',e)}
  }

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
          result.lord.ancestralSize=Number(ancestral.size||1);
          result.lord.ancestralIncome=Number(ancestral.income||0);
          result.lord.ancestralGarrison=Number(ancestral.garrison||0);
        }
      }
      return result;
    };
  }
})();
