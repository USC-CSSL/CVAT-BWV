# Copyright (C) 2023 CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

import base64
from io import BytesIO
from deepface import DeepFace
from deepface.detectors import FaceDetector


class ModelHandler:
    def __init__(self):
        self.detector_backend = 'retinaface'
        self.model = 'Facenet'
        FaceDetector.build_model(self.detector_backend)
        DeepFace.build_model(self.model)

    def infer(self, images, target, boxes, targetbox):
        left, top, right, bottom = targetbox
        target = target.crop((left, top, right, bottom))
        buffer = BytesIO()
        target.save(buffer,format="PNG")
        target_str = "data:image/png;base64,"+base64.b64encode(buffer.getvalue()).decode('utf-8')
        for (idx, image) in enumerate(images):
            left, top, right, bottom = boxes[idx]
            img = image.crop((left, top, right, bottom))

            buffer = BytesIO()
            img.save(buffer,format="PNG")
            image_str = "data:image/png;base64,"+base64.b64encode(buffer.getvalue()).decode('utf-8')


            try:
                d = DeepFace.verify(image_str, target_str, self.model, self.detector_backend)
                if d.get('verified'):

                    return {
                        'verified': True,
                        'distance': d['distance'],
                        'idx': idx,
                        'facial_areas': d['facial_areas'],
                        'time': d['time']
                    }
            except Exception:
                continue

        return {'idx': -1}
