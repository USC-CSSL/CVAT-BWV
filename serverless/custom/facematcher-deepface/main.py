
import base64
import io
import json

from model_handler import ModelHandler
from PIL import Image

def init_context(context):
    context.logger.info("Init context...  0%")


    model = ModelHandler()
    context.user_data.model = model
    context.logger.info("Init context...100%")


def handler(context, event):
    context.logger.info("Run Custom Facematcher model")
    data = event.body
    # mime = data["mime"]


    images = [Image.open(io.BytesIO(base64.b64decode(image))) for image in data["images"]]
    target = Image.open(io.BytesIO(base64.b64decode(data["target"])))
    boxes = data["boxes"]
    targetbox = data["targetbox"]
    results = context.user_data.model.infer(images, target, boxes, targetbox)

    return context.Response(body=json.dumps(results), headers={},
        content_type='application/json', status_code=200)
