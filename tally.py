import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from pprint import pprint as pp
from collections import Counter

# Fetch the service account key JSON file contents
cred = credentials.Certificate('creds.json')
# Initialize the app with a service account, granting admin privileges
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://experiments-573d7.firebaseio.com/'
})

#def val(x): assert(len(x) == 1); return x[0] if isinstance(x, list) else [v for v in x.values()][0]

def val(x):
  #assert(len(x) == 1);
  #if len(x) >= 1:
  if len(x) == 1:
    if isinstance(x, list):
      return x[0]
    return [v for v in x.values()][0]

ref = db.reference('/')

tree = ref.get()

def user(u):
  #[k for k, v in tree['users'].items() if v['displayName'] == 'Shawn Presser'][0]
  return tree['users'][u]

#for k, v in tree['results']['ffhq_512_run00Gs_vs_run03Gs']:

def partition(l):
  r = {}
  for x in l:
    k = x[0]
    v = x[1:]
    if k not in r:
      r[k] = []
    r[k].append(v)
  return r

#pp(Counter([val(v)['vote'] for k, v in tree['results']['ffhq_512_run00Gs_vs_run03Gs'][[k for k, v in tree['users'].items() if v['displayName'] == 'Shawn Presser'][0]].items()]))
#pp([(k, Counter([x[0] for x in v])) for k, v in partition([[user(u)['displayName'], val(v)['vote']] for u in tree['users'].keys() for k, v in tree['results']['ffhq_512_run00Gs_vs_run03Gs'][u].items() if val(v) is not None]).items()])
for u, results in [(k, dict([[k, Counter([z[0] for z in v1])] for k, v1 in partition(v).items()])) for k, v in partition([[user(u)['displayName'], r, val(v)['vote']] for u in tree['users'].keys() for r in tree['results'].keys() for k, v in tree['results'][r][u].items() if val(v) is not None]).items()]:
  print(u)
  pp(results['ffhq_512_run00Gs_vs_run03Gs'])
  print('')

#import pdb; pdb.set_trace()
