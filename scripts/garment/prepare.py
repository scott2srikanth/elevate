"""Build the fixed garment decision head and shard the pinned FashionCLIP encoder.
Usage: python scripts/garment/prepare.py /path/to/downloaded-assets
Requires numpy, tokenizers, onnxruntime. No user photos or cloud inference.
"""
import sys,json,hashlib
from pathlib import Path
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer
assets=Path(sys.argv[1]);out=Path('public/observation/garment');out.mkdir(parents=True,exist_ok=True)
labels=[('T-shirt','Tops','a t-shirt'),('Shirt','Tops','a button down shirt'),('Blouse','Tops','a blouse'),('Sweater','Tops','a knitted sweater'),('Polo shirt','Tops','a polo shirt'),('Trousers','Bottoms','a pair of trousers'),('Jeans','Bottoms','a pair of jeans'),('Skirt','Bottoms','a skirt'),('Shorts','Bottoms','a pair of shorts'),('Dress','Dresses','a dress'),('Jumpsuit','Dresses','a jumpsuit'),('Blazer','Layers','a blazer'),('Jacket','Layers','a jacket'),('Coat','Layers','a coat'),('Cardigan','Layers','a cardigan'),('Sneakers','Shoes','a pair of sneakers'),('Dress shoes','Shoes','a pair of dress shoes'),('Sandals','Shoes','a pair of sandals'),('Boots','Shoes','a pair of boots'),('Bag','Accessories','a bag'),('Scarf','Accessories','a scarf'),('Belt','Accessories','a belt'),('Hat','Accessories','a hat'),('Not a garment','Unknown','a household object'),('Not a garment','Unknown','a landscape'),('Not a garment','Unknown','food on a plate'),('Multiple garments','Unknown','a pile of different clothes'),('Person / outfit','Unknown','a person wearing a full outfit')]
tok=Tokenizer.from_file(str(assets/'tokenizer.json'));tok.enable_padding(pad_id=49407,pad_token='<|endoftext|>');tok.enable_truncation(max_length=77)
s=ort.InferenceSession(str(assets/'text.onnx'),providers=['CPUExecutionProvider'])
rows=[]
for name,category,description in labels:
 prompts=[f'A product photograph of {description} on a plain background.',f'A photo of {description}.']
 ids=np.array([x.ids for x in tok.encode_batch(prompts)],dtype=np.int64)
 v=s.run(None,{'input_ids':ids})[0];v/=np.linalg.norm(v,axis=1,keepdims=True);v=v.mean(axis=0);v/=np.linalg.norm(v)
 rows.append({'label':name,'category':category,'prompts':prompts,'vector':[round(float(x),7) for x in v]})
b=(assets/'vision.onnx').read_bytes();parts=[]
for i,start in enumerate(range(0,len(b),20000000)):
 data=b[start:start+20000000];name=f'vision-{i}.bin';(out/name).write_bytes(data);parts.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
d={'version':'garment-one-0.1.0','source':'ff13/fashion-clip','revision':'0f99955d944c39bfd9d035a02ac273c7a44a406b','encoderSha256':hashlib.sha256(b).hexdigest(),'parts':parts,'rows':rows,'temperature':0.02,'minimumSimilarity':0.20,'minimumProbability':0.55,'minimumMargin':0.12,'preprocess':json.loads((assets/'preprocessor_config.json').read_text())}
(out/'model.json').write_text(json.dumps(d,separators=(',',':'))+'\n')
print('Vision bytes:',len(b),'Head rows:',len(rows),'Head bytes:',(out/'model.json').stat().st_size)
