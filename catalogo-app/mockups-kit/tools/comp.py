import numpy as np
from PIL import Image
def load(p):
    im=Image.open(p).convert('RGBA'); a=np.asarray(im).astype(np.float32)/255
    return a[...,:3],a[...,3:4]
def blend(cb,cs,a,mode):
    if mode=='Multiply': B=cs*cb
    elif mode=='SoftLight':
        B=np.where(cs<=.5, 2*cb*cs+cb*cb*(1-2*cs), 2*cb*(1-cs)+np.sqrt(cb)*(2*cs-1))
    elif mode=='Screen': B=1-(1-cs)*(1-cb)
    else: B=cs
    return B*a+cb*(1-a)
def labels(d):
    out=[]
    for line in open(d+'/labels.txt',encoding='utf-8',errors='replace'):
        p,l,c=line.rstrip('\n').split('|',2) if line.count('|')>=2 else (None,None,None)
        # label itself may contain '|': idx first, compose last
        parts=line.rstrip('\n').split('|'); out.append((int(parts[0]),'|'.join(parts[1:-1]).strip(),parts[-1]))
    return out
