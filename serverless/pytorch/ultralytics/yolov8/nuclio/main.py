import json
import base64
from PIL import Image
import io
import torch
from ultralytics import YOLO


import pandas as pd

def get_pandas(result):
  boxes_list = result.boxes.data.tolist()
  columns = ['xmin', 'ymin', 'xmax', 'ymax', 'confidence', 'class_id']

  for i in boxes_list:
    i[:4] = [round(i, 1) for i in i[:4]]
    i[5] = int(i[5])
    i.append(result.names[i[5]])

  columns.append('name')
  result_df = pd.DataFrame(boxes_list, columns=columns)

  return result_df

def init_context(context):
    context.logger.info("Init context...  0%")

    # Read the DL model
    model = YOLO("yolov8s.pt")
    context.user_data.model = model

    context.logger.info("Init context...100%")

def handler(context, event):
    context.logger.info("Run yolo-v8 model")
    data = event.body
    buf = io.BytesIO(base64.b64decode(data["image"]))
    threshold = float(data.get("threshold", 0.5))
    context.user_data.model.conf = threshold
    image = Image.open(buf)
    print(context.user_data.model(image)[0].boxes.xyxy)
    yolo_results = get_pandas(context.user_data.model(image)[0])

    encoded_results = []
    for i in range(len(yolo_results)):
        encoded_results.append({
            'confidence': yolo_results.loc[i, 'confidence'],
            'label': yolo_results.loc[i, 'name'],
            'points': [
                yolo_results.loc[i, 'xmin'],
                yolo_results.loc[i, 'ymin'],
                yolo_results.loc[i, 'xmax'],
                yolo_results.loc[i, 'ymax']
            ],
            'type': 'rectangle'
        })

    return context.Response(body=json.dumps(encoded_results), headers={},
        content_type='application/json', status_code=200)
