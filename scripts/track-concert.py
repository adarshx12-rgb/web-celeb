"""Track LED frame edges in the supplied flight, then export browser corner tracks.

Uses local NumPy/Pillow only. Placard keys are manually measured from this clip;
insets keep writing clear of the fingers gripping each board. Coordinates use
the 1024x576 analysis frames and are interpolated at the source frame rate.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
frames = sorted((ROOT / 'output/concert-frames').glob('*.jpg'))
initial = {
    'main': [[384,141],[634,141],[635,232],[383,232]],
    'left': [[210,134],[277,134],[273,311],[202,311]],
    'right': [[742,134],[807,134],[816,310],[744,310]],
}
board_keys = {
    'signLeft': [
        [0,[[97,295],[211,307],[201,378],[84,367]]],
        [6,[[87,292],[204,307],[192,382],[75,372]]],
        [12,[[61,289],[187,305],[170,389],[44,377]]],
        [18,[[8,286],[148,300],[132,394],[-9,382]]],
        [24,[[-57,272],[96,285],[72,397],[-82,385]]],
        [30,[[-175,260],[-5,275],[-29,404],[-200,389]]],
    ],
    'signRight': [
        [0,[[817,310],[913,300],[925,371],[828,378]]],
        [6,[[842,297],[947,289],[953,367],[849,373]]],
        [12,[[865,288],[979,277],[985,360],[876,371]]],
        [18,[[893,286],[1025,268],[1036,359],[906,370]]],
        [24,[[944,263],[1091,248],[1108,350],[961,363]]],
        [30,[[1028,246],[1181,232],[1202,344],[1049,358]]],
    ],
}

def edge_line(score, p, q, horizontal):
    # Sample perpendicular to the last frame's edge, then fit a robust line.
    if not horizontal:
        p, q = p[::-1], q[::-1]
        score = score.T
    lo, hi = sorted([p[0], q[0]])
    xs = np.arange(int(lo)+7, int(hi)-6, dtype=int)
    expected = p[1] + (xs-p[0])*(q[1]-p[1])/(q[0]-p[0])
    candidates = np.rint(expected[:,None]+np.arange(-10,11)).astype(int)
    candidates = np.clip(candidates,0,score.shape[0]-1)
    weights = score[candidates,xs[:,None]]
    # A weak distance prior rejects nearby stage lights without locking the track.
    best = np.argmax(weights - np.abs(np.arange(-10,11))[None,:]*.9,axis=1)
    ys = candidates[np.arange(len(xs)),best]
    valid = weights[np.arange(len(xs)),best] > 28
    xs,ys=xs[valid],ys[valid]
    if len(xs)<6:
        # Foreground paper briefly occludes a few borders. Predict through the
        # occlusion; the visible edges reacquire the frame on subsequent samples.
        a=(q[1]-p[1])/(q[0]-p[0]);b=p[1]-a*p[0]
        return np.array([-a,1,-b] if horizontal else [1,-a,-b])
    for _ in range(3):
        a,b=np.polyfit(xs,ys,1)
        residual=np.abs(ys-(a*xs+b))
        keep=residual < max(1.2,float(np.median(residual))*2.8)
        if keep.sum()<6: break
        xs,ys=xs[keep],ys[keep]
    return np.array([-a,1,-b] if horizontal else [1,-a,-b])

def intersect(a,b):
    p=np.cross(a,b)
    return p[:2]/p[2]

def inset(q,factor):
    # Interpolate within the plane rather than padding its axis-aligned bounds.
    q=np.asarray(q,dtype=float)
    center=q.mean(axis=0)
    return center+(q-center)*factor

tracks={name:[] for name in [*initial,*board_keys]}
previous={name:np.array(q,dtype=float) for name,q in initial.items()}
velocity={name:np.zeros((4,2)) for name in initial}
diagnostics=[]
for i,path in enumerate(frames):
    im=Image.open(path).convert('RGB')
    rgb=np.asarray(im,dtype=float)
    r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    score=np.maximum(0,np.minimum(r-b,g-b)*1.5 + np.minimum(r,g)*.25)
    score[(r<70)|(g<42)|(r<g*1.03)|(g<b*1.08)]=0
    drawn=im.copy(); draw=ImageDraw.Draw(drawn)
    for name,last in previous.items():
        tl,tr,br,bl=last+velocity[name]
        try:
            top=edge_line(score,tl,tr,True)
        except RuntimeError as exc:
            raise RuntimeError(f'{name} top edge at frame {i}: {last.tolist()}') from exc
        try:
            bottom=edge_line(score,bl,br,True)
        except RuntimeError:
            if name=='main': raise
            main=previous['main']
            main_height=((main[2,1]+main[3,1])-(main[0,1]+main[1,1]))/2
            bottom=top.copy()
            bottom[2]-=main_height*1.94
        left=edge_line(score,tl,bl,False)
        right=edge_line(score,tr,br,False)
        q=np.array([intersect(top,left),intersect(top,right),intersect(bottom,right),intersect(bottom,left)])
        if np.max(np.abs(q-last))>12:
            raise RuntimeError(f'Unstable track: {name}, frame {i}, {q.tolist()}')
        velocity[name]=np.clip((q-last)*.6+velocity[name]*.4,-1.5,1.5)
        previous[name]=q
        inner=inset(q,.975 if name=='main' else .955)
        tracks[name].append(np.round(inner,2).tolist())
        draw.line([tuple(p) for p in inner]+[tuple(inner[0])],fill='#00ff66',width=2)
    for name,keys in board_keys.items():
        if i>30:
            tracks[name].append(None)
            continue
        before,after=keys[0],keys[-1]
        for a,z in zip(keys,keys[1:]):
            if a[0]<=i<=z[0]:before,after=a,z;break
        f=(i-before[0])/max(1,after[0]-before[0])
        q=np.array(before[1])*(1-f)+np.array(after[1])*f
        inner=inset(q,.74)
        tracks[name].append(np.round(inner,2).tolist())
        draw.line([tuple(p) for p in inner]+[tuple(inner[0])],fill='#ff66cc',width=2)
    if i in [0,6,12,18,24,48,96,144,192,240]:
        draw.text((12,12),f'Frame {i} / {i/24:.2f}s',fill='white')
        drawn.save(ROOT/f'output/tracking-{i:03d}.jpg',quality=93)
        diagnostics.append(drawn.resize((512,288)))

sheet=Image.new('RGB',(512*2,288*5))
for i,im in enumerate(diagnostics):sheet.paste(im,((i%2)*512,(i//2)*288))
sheet.save(ROOT/'output/concert-tracking-review.jpg',quality=93)
data={'width':1024,'height':576,'fps':24,'frameCount':len(frames),'lastTime':(len(frames)-1)/24,'tracks':tracks}
(ROOT/'site/concert-tracking.js').write_text('window.CONCERT_TRACKING='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf8')
print(f'Tracked {len(frames)} frames, 3 LED surfaces, 2 manually keyed placards.')
print('Final screen corners:',json.dumps({n:v[-1] for n,v in tracks.items() if n in initial}))
