FROM node:16.16.0

ARG USER=node

ENV HOME=/home/${USER}

RUN mkdir ${HOME}/app

COPY . "${HOME}/app/"

RUN npm i -g knex

RUN cd ${HOME}/app \
    && yarn install \
    && npm run build

WORKDIR ${HOME}/app/

ENTRYPOINT [ "yarn", "start" ]
