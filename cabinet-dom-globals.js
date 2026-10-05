/* VA-34 compatibility layer: expose cabinet form elements explicitly before cabinet.js. */
(function(){
  const ids = [
    'lordForm','lordName','lordRace','lordMotto','lordEnergy','lordStatus','lordAbility','lordTraits',
    'lordItems','lordResources','ancestralName','ancestralRace','ancestralTerrain','ancestralIncome',
    'ancestralGarrison','startingTroops','startingMagic','startingTech','addStarterTech','addStarterMagic',
    'starterTechBuilder','starterMagicBuilder','shardsList','heroesList','troopsList','techList',
    'newShard','newHero','newTroop','newTech','exportData','importData','resetData','jsonPreview'
  ];
  ids.forEach(function(id){
    if(!Object.prototype.hasOwnProperty.call(window,id)){
      window[id]=document.getElementById(id);
    }
  });
})();
