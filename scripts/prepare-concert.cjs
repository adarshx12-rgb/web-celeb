// One-time asset preparation. Runtime uses the generated local assets only.
const sharp=require(process.env.CONCERT_SHARP_PATH||'sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const downloads=process.argv[2],destination=process.argv[3];
if(!downloads||!destination)throw new Error('Usage: node prepare-concert.cjs <downloads> <destination>');
const opening=path.join(downloads,'layer-z2-relight-this-exact-concert-image-into-the-moment.png');
const layerRoot=path.join(downloads,'Telegram Desktop/concert');
const files=[
  [opening,'arena-cyan.webp',2560,false],
  [path.join(downloads,'layer-z1-preserve-this-exact-image-camera-crowd-placards.png'),'arena-fire.webp',2560,false],
  [path.join(downloads,'hf_20261020_183413_0e12ce7a-43ea-47f1-818b-a4af1995b71c.png'),'stage-finale.webp',2560,false],
  [opening,'concert-cover.webp',800,false],
  [path.join(layerRoot,'layer-z1-relight-this-exact-concert-image-into-the-moment.png'),'arena-back.webp',2560,false],
  [path.join(layerRoot,'layer-z2-relight-this-exact-concert-image-into-the-moment (1).png'),'arena-upper.webp',2560,true],
  [path.join(layerRoot,'layer-z3-relight-this-exact-concert-image-into-the-moment.png'),'stage-layer.webp',2048,true],
  [path.join(layerRoot,'layer-z4-relight-this-exact-concert-image-into-the-moment.png'),'runway-layer.webp',318,true],
  [path.join(layerRoot,'layer-z5-relight-this-exact-concert-image-into-the-moment.png'),'crowd-front.webp',2560,true]
];
(async()=>{
  await fs.mkdir(destination,{recursive:true});
  for(const [source,name,width,alpha]of files){
    const result=await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:87,alphaQuality:100,effort:5}).toFile(path.join(destination,name));
    console.log(name,result.width,result.height,result.size);
  }
  // Estimate the crop offsets of the extracted layers against the master.
  const master=await sharp(opening).resize({width:960}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const placements={};
  for(const [source,name]of files.filter(([,name])=>['stage-layer.webp','runway-layer.webp','crowd-front.webp'].includes(name))){
    const meta=await sharp(source).metadata();
    const layer=await sharp(source).resize({width:Math.round(meta.width/4)}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const samples=[];
    for(let y=2;y<layer.info.height;y+=7)for(let x=2;x<layer.info.width;x+=7){
      const i=(y*layer.info.width+x)*4;
      if(layer.data[i+3]>190&&layer.data[i]+layer.data[i+1]+layer.data[i+2]>55)samples.push([x,y,layer.data[i],layer.data[i+1],layer.data[i+2]]);
    }
    const chosen=samples.filter((_,i)=>i%Math.max(1,Math.floor(samples.length/180))===0);
    let best={error:Infinity,x:0,y:0};
    for(let y=0;y<=master.info.height-layer.info.height;y+=2)for(let x=0;x<=master.info.width-layer.info.width;x+=2){
      let error=0;
      for(const [sx,sy,r,g,b]of chosen){const j=((y+sy)*master.info.width+x+sx)*4;error+=Math.abs(r-master.data[j])+Math.abs(g-master.data[j+1])+Math.abs(b-master.data[j+2]);}
      if(error<best.error)best={error,x:x*4,y:y*4};
    }
    placements[name]={x:best.x,y:best.y,width:meta.width,height:meta.height,sourceWidth:3840,sourceHeight:2160};
  }
  await fs.writeFile(path.join(destination,'placements.json'),JSON.stringify(placements,null,2)+'\n');
  console.log('Estimated placements:',placements);
})();
