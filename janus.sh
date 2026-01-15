docker run -it --rm \
  -p 7088:7088 \
  -p 8088:8088 \
  -p 8188:8188 \
  -p 10000-10200:10000-10200/udp \
  canyan/janus-gateway:latest
