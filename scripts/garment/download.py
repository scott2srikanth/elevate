"""Download pinned public model assets for prepare.py. No inference endpoint is used."""
import hashlib,sys,urllib.request
from pathlib import Path
out=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/elevate-fashion');out.mkdir(parents=True,exist_ok=True)
base='https://huggingface.co/ff13/fashion-clip/resolve/0f99955d944c39bfd9d035a02ac273c7a44a406b/'
for remote,local in [('onnx/vision_model_quantized.onnx','vision.onnx'),('onnx/text_model_quantized.onnx','text.onnx'),('tokenizer.json','tokenizer.json'),('preprocessor_config.json','preprocessor_config.json'),('README.md','README.md')]:
 urllib.request.urlretrieve(base+remote,out/local)
 print(local,hashlib.sha256((out/local).read_bytes()).hexdigest())
