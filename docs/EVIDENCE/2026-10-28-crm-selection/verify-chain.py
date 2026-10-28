import urllib.request,urllib.error,json,base64,time,pathlib,os,uuid
base='http://127.0.0.1:8090/api/v1/'
auth=base64.b64encode(('researcher:'+os.environ['ESPO_RESEARCH_PASSWORD']).encode()).decode()
def call(path,data=None):
 r=urllib.request.Request(base+path,data=None if data is None else json.dumps(data).encode(),headers={'Authorization':'Basic '+auth,'Content-Type':'application/json'})
 with urllib.request.urlopen(r,timeout=20) as res:return json.load(res)
suffix=uuid.uuid4().hex[:12]
name='Pilot chain '+suffix
a=call('Account',{'name':name,'website':'https://example.test'})
c=call('Contact',{'firstName':'Pilot','lastName':'Manager '+suffix,'accountsIds':[a['id']],'emailAddress':'pilot-'+suffix+'@example.test'})
n=call('Note',{'type':'Post','parentType':'Contact','parentId':c['id'],'post':'Synthetic test: customer asked for next contact. No external message.'})
u=call('App/user');uid=u.get('user',u).get('id');assert uid
start=int(time.time()+86400);due=time.strftime('%Y-%m-%d %H:%M:%S',time.gmtime(start))
t=call('Task',{'name':name+' follow-up','parentType':'Contact','parentId':c['id'],'assignedUserId':uid,'dateEnd':due})
assert call('Account/'+a['id'])['name']==name
assert a['id'] in call('Contact/'+c['id'])['accountsIds']
nr=call('Note/'+n['id']);assert nr['post']==n['post'] and nr['parentId']==c['id'] and nr['parentType']=='Contact'
tr=call('Task/'+t['id']);assert tr['parentId']==c['id'] and tr['parentType']=='Contact' and tr['dateEnd']==due and tr['assignedUserId']==uid
s=call('Account?textFilter='+urllib.request.quote(name));assert any(row['id']==a['id'] for row in s['list'])
out={'app':'EspoCRM','version':'10.0.11','fixture_only':True,'result':'PASS','checks':['account persistence','contact-company link','note persistence','linked follow-up with assignee and due date','text search'],'entities':{k:v['id'] for k,v in [('account',a),('contact',c),('note',n),('task',t)]},'methods':'real local REST API; no mocks; no external communication'}
pathlib.Path('/workspace/research/espo-runtime/chain-result.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
