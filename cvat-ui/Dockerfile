FROM node:lts-slim

WORKDIR /tmp
COPY ./package.json /tmp/
COPY ./yarn.lock /tmp/
COPY ./cvat-core/package.json /tmp/cvat-core/
COPY ./cvat-canvas/package.json /tmp/cvat-canvas/
COPY ./cvat-canvas3d/package.json /tmp/cvat-canvas3d/
COPY ./cvat-ui/package.json /tmp/cvat-ui/
COPY ./cvat-data/package.json /tmp/cvat-data/
# CMD [ "yarn", "install", "--ignore-scripts", "--frozen-lockfile" ]
