import sys,os,json,re,struct,numpy as np
sys.path.insert(0,'/home/claude/tools')
from comp import *
from PIL import Image
import cv2
from scipy import ndimage as ndi
LAY='/home/claude/layers'; SRC='/home/claude/src'; OUT=sys.argv[1]
def trnfs(path):
    b=open(path,'rb').read(); out=[]
    for m in re.finditer(b'Trnf',b):
        i=m.end(); n=struct.unpack('>I',b[i+4:i+8])[0]; j=i+8; v=[]
        for _ in range(n): v.append(struct.unpack('>d',b[j+4:j+12])[0]); j+=12
        out.append(v)
    return out
def bbox(a,th=0.002):
    ys,xs=np.nonzero(a>th); return [int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
def hexc(c): return '#%02x%02x%02x'%tuple(int(round(x*255)) for x in c)
manifest=[]
for d in sorted(os.listdir(LAY)):
    p=f'{LAY}/{d}'; L=labels(p); od=f'{OUT}/{d}'; os.makedirs(od,exist_ok=True)
    idx={i:(l,c) for i,l,c in L}
    colorIdx=[i for i,l,c in L if l.startswith('COLOR')]
    printIdx=[i for i,l,c in L if l.startswith('PRINT')]
    shadeIdx=[i for i,l,c in L if 'fabric shading' in l]
    textIdx=[i for i,l,c in L if 'Type tool' in l]
    first=colorIdx[0]; last=shadeIdx[-1]
    # plate: base + overlay non-text
    cb=None; overlay_alpha=np.zeros((2000,1600,1),np.float32)
    for i,l,c in L[1:]:
        if first<=i<=last or i in textIdx: continue
        cs,a=load(f'{p}/L_{i}.png')
        if cb is None: cb=cs*a+(1-a); continue
        if i>last: overlay_alpha=np.maximum(overlay_alpha,a)
        cb=blend(cb,cs,a,c)
    Image.fromarray((cb*255+.5).astype(np.uint8)).save(f'{od}/plate.jpg',quality=90,optimize=True,progressive=True)
    # text layer (Over only)
    tc=np.zeros((2000,1600,3),np.float32); ta=np.zeros((2000,1600,1),np.float32)
    for i in textIdx:
        cs,a=load(f'{p}/L_{i}.png'); tc=cs*a+tc*(1-a); ta=a+ta*(1-a)
    tcs=np.where(ta>0,tc/np.maximum(ta,1e-6),0)
    Image.fromarray((np.concatenate([tcs,ta],2)*255+.5).astype(np.uint8),'RGBA').save(f'{od}/text.png',optimize=True)
    # garments
    tr=trnfs(f'{SRC}/{d}/{d}.psd')
    prints={}
    for k,i in enumerate(printIdx):
        g=int(re.search(r'GARMENT (\d)',idx[i][0]).group(1))
        q=tr[k]; prints[g]={'quad':q,'idx':i,'shade':shadeIdx[k]}
    garments=[]
    for ci in colorIdx:
        col,m=load(f'{p}/L_{ci}.png'); tex,ta2=load(f'{p}/L_{ci+1}.png')
        assert 'Fabric texture' in idx[ci+1][0]
        # which garment
        best=None
        for g,pr in prints.items():
            q=pr['quad']; cx=int((q[0]+q[2])/2); cy=int((q[1]+q[5])/2)
            if m[cy,cx,0]>.5: best=g
        bb=bbox(np.maximum(m[...,0],ta2[...,0]))
        x0,y0,x1,y1=bb
        defcol=col[m[...,0]>.99].mean(0)
        # smooth + slightly grow the PSD mask: anti-aliased edge that also covers the original shirt's fringe
        m0=np.maximum(m[...,0],ta2[...,0])
        k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7))
        ms=cv2.GaussianBlur(cv2.dilate(m0,k),(0,0),0.9)
        ms=np.clip(np.maximum(ms,m0*(ms>0.5)),0,1)
        bb=bbox(ms); x0,y0,x1,y1=bb
        Image.fromarray((ms[y0:y1,x0:x1]*255+.5).astype(np.uint8),'L').save(f'{od}/g{best}_mask.png',optimize=True)
        tg=tex.mean(2)
        valid=cv2.erode((ta2[...,0]>0.98).astype(np.uint8),np.ones((5,5),np.uint8))>0
        _,(iy,ix)=ndi.distance_transform_edt(~valid,return_indices=True)
        T=tg[iy,ix]
        M=(1-ms+ms*T)[...,None]
        Image.fromarray((M[y0:y1,x0:x1,0]*255+.5).astype(np.uint8),'L').save(f'{od}/g{best}_shade.png',optimize=True)
        pr=prints[best]; S,sa=load(f'{p}/L_{pr["shade"]}.png')
        Image.fromarray((np.concatenate([S[y0:y1,x0:x1].mean(2,keepdims=True),sa[y0:y1,x0:x1]],2)*255+.5).astype(np.uint8),'LA').save(f'{od}/g{best}_printlight.png',optimize=True)
        # displacement map
        os.system(f'convert "{SRC}/{d}/garment-{best}-fabric-displacement.psd[0]" -colorspace gray "{od}/g{best}_disp.png"')
        q=pr['quad']
        # overlap check
        ov=float((overlay_alpha[...,0]*m[...,0]).sum())
        garments.append({'n':best,'bbox':bb,'color':hexc(defcol),'print':[round(q[0],1),round(q[1],1),round(q[2],1),round(q[5],1)],'overlayOverlapPx':round(ov,1)})
    garments.sort(key=lambda g:g['n'])
    num,kind,name=d.split('-',3)[0],d.split('-')[2],'-'.join(d.split('-')[3:])
    manifest.append({'id':d,'num':int(num),'name':name.replace('-',' ').title(),'layout':kind,'garmentType':'tshirt','w':1600,'h':2000,'garments':garments})
    print(d,[ (g['n'],g['color'],g['print'],g['overlayOverlapPx']) for g in garments])
json.dump(manifest,open(f'{OUT}/manifest.json','w'),indent=1)
