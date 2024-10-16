This will contain a Dockerfile and docker-compose.yml file in the future containing an ephemeral version of langflow ideal for running in a stateless environment.

For now, it holds a DockerFile which:

    - Builds from the latest official build of langflow
    - Creates a ramdisk and mounts it at /app/data (where the langflow configs and cache goes)
    - Copies the contents of /app/data from the docker image to the ramdisk at startup so that you don't get concurrency errors when running an ro or non POSIX-compliant file system.

I made it as a quick and dirty workaround for some issues when running langflow concurrently. 

It still needs a databse connection.