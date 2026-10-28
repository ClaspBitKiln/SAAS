import urllib.request,urllib.error,urllib.parse,json,base64,os,uuid,pathlib
base='http://127.0.0.1:8090/api/v1/'
auth=base64.b64encode(('researcher:'+os.environ['ESPO_RESEARCH_PASSWORD']).encode()).decode()
def call(path,data=None,method=None,admin=True):
 headers={'Content-Type':'application/json'}
 if admin:headers['Authorization']='Basic '+auth
 req=urllib.request.Request(base+path,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=20) as r:
   body=r.read();return r.status,json.loads(body) if body else None
 except urllib.error.HTTPError as e:return e.code,None
suffix=uuid.uuid4().hex[:12]
code,capture=call('LeadCapture',{'name':'Local native capture '+suffix,'isActive':True,'fieldList':['firstName','lastName','emailAddress','description'],'fieldParams':{'lastName':{'required':True},'emailAddress':{'required':True}},'duplicateCheck':True,'leadSource':'Web Site','optInConfirmation':False,'subscribeToTargetList':False,'subscribeContactToTargetList':False})
assert code in (200,201),'capture create status '+str(code)
key=capture['apiKey'];cid=capture['id']
email='capture-'+suffix+'@example.test'
data={'firstName':'Capture','lastName':'Pilot '+suffix,'emailAddress':email,'description':'Synthetic website request; no email delivery','assignedUserId':'00000000000000000','status':'Converted','source':'Hacked'}
code,_=call('LeadCapture/'+key,data,admin=False);assert code==200,'native submission status '+str(code)
code,result=call('Lead?textFilter='+urllib.parse.quote(email));assert code==200 and result['total']==1,'lead lookup'
lead=call('Lead/'+result['list'][0]['id'])[1]
assert lead['source']=='Web Site' and lead['status']!='Converted' and lead.get('assignedUserId')!='00000000000000000','unlisted-field protection'
assert call('LeadCapture/'+key,data,admin=False)[0]==200
assert call('Lead?textFilter='+urllib.parse.quote(email))[1]['total']==1,'duplicate suppression'
code,logs=call('LeadCapture/'+cid+'/logRecords');assert code==200 and logs['total']>=2,'capture log'
assert any(row['isCreated'] for row in logs['list']) and any(not row['isCreated'] for row in logs['list']),'create/duplicate log'
code,_=call('LeadCapture/'+key,{'firstName':'Missing required fields'},admin=False);assert code in (400,422),'required fields status '+str(code)
assert call('LeadCapture/'+cid,{'isActive':False},method='PUT')[0]==200
code,_=call('LeadCapture/'+key,data,admin=False);assert code in (403,404),'inactive capture status '+str(code)
out={'result':'PASS','app':'EspoCRM10.0.11','synthetic_only':True,'capture_id':cid,'lead_id':lead['id'],'checks':['public native endpoint creates lead','server-controlled source','unlisted status and assignee ignored','duplicate email does not create second lead','create and duplicate capture log','missing required fields rejected','inactive capture rejected'],'emails_and_subscriptions_disabled':True,'capture_left_inactive':True,'limits':'Sequential duplicate test, not concurrent atomic idempotency; no real site integration or enrichment'}
pathlib.Path('/workspace/research/espo-runtime/capture-result.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
