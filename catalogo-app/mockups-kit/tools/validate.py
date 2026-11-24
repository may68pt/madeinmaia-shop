import sys,numpy as np
sys.path.insert(0,'/home/claude/tools')
from comp import *
from PIL import Image
d=sys.argv[1]
L=labels(d)
cb=None; prints={}
for i,l,c in L[1:]:
    cs,a=load(f'{d}/L_{i}.png')
    if cb is None: cb=cs*a+(1-a); continue
    if l.startswith('PRINT'): prints[l.split('GARMENT ')[1][0]]=a
    if 'fabric shading' in l:
        g=l.split('GARMENT ')[1][0]; a=a*prints[g]
    cb=blend(cb,cs,a,c)
ref,_=load(f'{d}/L_0.png')
diff=np.abs(cb-ref)*255
print(d, 'mean diff',diff.mean().round(2),'p99',np.percentile(diff,99).round(1),'max',diff.max().round(0))
Image.fromarray((np.clip(diff*4,0,255)).astype(np.uint8)).save(f'/home/claude/work/diff_{d}.png')
