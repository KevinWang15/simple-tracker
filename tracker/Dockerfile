FROM alpine:3.18

# Install build dependencies
RUN apk add --no-cache \
    git \
    build-base \
    zlib-dev \
    cvs \
    make

# Get and build libowfat using CVS
RUN cvs -d :pserver:cvs@cvs.fefe.de:/cvs -z9 co libowfat && \
    cd libowfat && \
    make && \
    cd ..

# Clone opentracker
RUN git clone git://erdgeist.org/opentracker && \
    cd opentracker && \
    ln -s ../libowfat . && \
    # Enable proxy support in Makefile
    sed -i 's/#FEATURES+=-DWANT_IP_FROM_PROXY/FEATURES+=-DWANT_IP_FROM_PROXY/' Makefile && \
    make

# Copy config file
COPY opentracker.conf /opentracker/opentracker.conf

EXPOSE 6969/tcp 6969/udp

# Run opentracker with config file
CMD ["/opentracker/opentracker", "-f", "/opentracker/opentracker.conf"]
