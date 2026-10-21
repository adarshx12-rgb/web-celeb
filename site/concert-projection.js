/* Shared by the player and the geometric verification checks. */
((root)=>{
  function quadAt(track,time,fps){
    const position=Math.max(0,Math.min(track.length-1,time*fps));
    const index=Math.floor(position),a=track[index],b=track[Math.min(index+1,track.length-1)];
    if(!a)return null;
    if(!b)return a;
    const mix=position-index;
    return a.map((p,i)=>p.map((v,j)=>v+(b[i][j]-v)*mix));
  }
  function project(quad,scale=1){
    const q=quad.map(([x,y])=>({x:x*scale,y:y*scale}));
    const width=Math.max(...q.map(p=>p.x))-Math.min(...q.map(p=>p.x));
    const height=Math.max(...q.map(p=>p.y))-Math.min(...q.map(p=>p.y));
    const [p0,p1,p2,p3]=q;
    const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
    const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
    const denominator=dx1*dy2-dx2*dy1;
    if(width<1e-6||height<1e-6||Math.abs(denominator)<1e-8)return null;
    const g=(dx3*dy2-dx2*dy3)/denominator,h=(dx1*dy3-dx3*dy1)/denominator;
    const a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+h*p3.x;
    const d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+h*p3.y;
    return {width,height,matrix:[a/width,d/width,0,g/width,b/height,e/height,0,h/height,0,0,1,0,p0.x,p0.y,0,1]};
  }
  function inside(x,y,q){
    let sign=0;
    for(let i=0;i<4;i++){
      const a=q[i],b=q[(i+1)%4],cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
      if(Math.abs(cross)<1e-6)continue;
      if(sign&&Math.sign(cross)!==sign)return false;
      sign=Math.sign(cross);
    }
    return true;
  }
  const api={quadAt,project,inside};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.ConcertProjection=api;
})(typeof window==='undefined'?globalThis:window);
