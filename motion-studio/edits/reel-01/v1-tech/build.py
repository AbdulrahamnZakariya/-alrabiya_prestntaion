import json,re,os
P='/tmp/claude-0/-home-user--alrabiya-prestntaion/86361e0e-fe06-547a-bf25-0b60d960019a/scratchpad/edit/hf/v1'
src=open('src.html').read()
caps=json.load(open(P+'/caps.json'))
words=[{'w':w['w'],'s':w['s'],'e':w['e'],'k':w['sent']} for w in caps['words']]
names=['pen-tool','scissors','cpu','film','wand-sparkles','shield-check','eye','lightbulb','palette','layers','trending-up','bot','user','users','handshake','check','x','triangle-alert','award','sparkles','messages-square','frown','clapperboard','sliders-horizontal']
ic={}
for n in names:
    t=open(P+'/assets/icons/ui/%s.svg'%n).read().replace('\n',' ')
    t=re.sub(r'.*?<svg[^>]*>','',t,count=1); t=re.sub(r'</svg>.*','',t); t=re.sub(r'\s+',' ',t).strip()
    ic[n]=t
ic['bell']='<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>'
out=src.replace('/*WORDS*/',json.dumps(words,ensure_ascii=False)).replace('/*ICONS*/',json.dumps(ic,ensure_ascii=False))
open(P+'/index.html','w').write(out)
print('ok',len(out))
