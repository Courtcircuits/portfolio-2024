---
title: hacking dagger to play starcraft
description: during 2025 dagger hack night, with two friends, we managed to play starcraft in dagger while being on linux. this is a deep dive into how we managed to do it.
pubDate: Apr 5, 2025
heroImage: /blog-placeholder-3.jpg
tags:
  - virt&chips
  - DaaS 
  - rex
---

> TLDR: we played starcraft in dagger. it was a lot of fun.

For context (if you only care about the technical stuff just go to [the trick](#the_trick) section), this week I had the opportunity to go to london for the [Kubecon 2025](https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/) with [Dorian Grasset](https://github.com/dorian-grst) and [Mathias Durat](https://github.com/duratm) (by the way thanks to [Polytech Montpellier](https://www.polytech.umontpellier.fr/formation/cycle-ingenieur/devops) for the tickets, you're just the best :)). During this event, there was a co-located event called the [Dagger Hack Night](https://lu.ma/hlx7s6ym). Has the name says it is a hackathon hosted by dagger, a start-up founded by docker's co-founder and that builds a ci-engine making CI's cleaner by getting rid of YAML.

During this hackathon, there were different tracks possible. The first one was a lab to get introduced to the dagger ecosystem. The second one was another lab to get a grasp of the AI agent features provided by Dagger and the last one (and the most interesting) was "just have fun with dagger" and...drum roll 🥁... that's what we did.

Disclaimer : we discovered dagger the night of the event, so I might make mistakes in the explanations below. Please send me a message on [bluesky](https://bsky.app/profile/courtcircuits.bsky.social) if you spot any. Second disclaimer, this is not a tutorial but more about *a little fun story about a hackathon*.

## deep dive into dagger
To understand how we did it, we need to take a step back and give an explanation on how dagger works. So in a nutshell, dagger is somehow a wrapper around [buildkit](https://github.com/moby/buildkit). Buildkit is a concurrent, cache-efficient and Dockerfile-agnostic builder toolkit (at least that's what the official github repository says). In other words, buildkit provides a powerful SDK to build efficiently OCI images thanks to some great features distributed workers, smart caching strategies and more. If you are having issues about build time with the barebone `docker build` command, you should definitely have a look at buildkit. Wait I have a great news for you, Dagger already did.

So, what does Dagger do? Well, it provides a great interface on top of buildkit to build images, you can add breakpoints to your build, cache volumes, etc. When working with Dagger, you need to init a Dagger project by picking a language. In our case we picked Golang because we love it and the Rust SDK is not mature yet :(. Then you need to write a script that will be executed by a container always alive on your machine.

Let's take a look at a basic script with Dagger:

```go
package main

import (
	"context"
	"dagger/quatrevm/internal/dagger"
)

type Quatrevm struct{}

// Returns a container that echoes whatever string argument is provided
func (m *Quatrevm) ContainerEcho(stringArg string) *dagger.Container {
	return dag.Container().From("alpine:latest").WithExec([]string{"echo", stringArg})
}
```

This command will spin up a `alpine:latest` container and execute the `echo` command with the string argument provided. All these operations are executed within the "Dagger engine" container. If you look at your running containers you will be able to see it.

```bash
$ docker ps
CONTAINER ID   IMAGE                               COMMAND                  CREATED      STATUS             PORTS     NAMES
0753053fc30e   registry.dagger.io/engine:v0.18.1   "dagger-entrypoint.s…"   6 days ago   Up About an hour             dagger-engine-v0.18.1
```

And if you list processes inside that container, you will see the `echo` command executed.

```bash
$ docker exec -it 0753053fc30e ps aux
PID   USER     TIME  COMMAND
    1 root      0:56 /usr/local/bin/dagger-engine --config /etc/dagger/engine.toml --debug
[...]
 7558 root      0:00 /usr/local/bin/runc --log /var/lib/dagger/worker/executor/runc-log.json --log-format json run --bundle /var/lib/dagger/worker/executor/vqa3v89tkzujrr61wkp6mwaza --ke
 7571 root      0:00 echo hello
```

Look at the process **7558** carefully, it is runc which is the container runtime used by Dagger (and many others). Inside the container, if try to run `runc list`, we can see that the container managed by runc is indeed our `echo` command since they show the same PID !

```bash
# runc list
ID                          PID         STATUS      BUNDLE                                                      CREATED                          OWNER
rdge01xd9nzpqapovhihpj3kq   7571        running     /var/lib/dagger/worker/executor/rdge01xd9nzpqapovhihpj3kq   2025-04-08T17:36:05.913629566Z   root
```

Ok great, so to summarize, now we know that Dagger starts a container called the "engine" which will be the parent/host for every other container created by the user code. My assumption is that they use that pattern to make Dagger as portable as possible. The user only have to install dagger and docker and they should be good to go. Now let's focus on our goal : run a virtual machine inside Dagger.

## the trick

During the hackathon, we first made a quick google search to find out if anyone had already try to run a virtual machine inside Docker since we had the intuition that it would be somehow the same process. And (thanks stackoverlow) we found [this](https://stackoverflow.com/questions/48422001/how-to-launch-qemu-kvm-from-inside-a-docker-container). Basically the article says that the container starting QEMU, the hypervisor that we picked, needed to be ran in privileged mode. By default a container have access to a subset of the kernel [capabilities](https://man7.org/linux/man-pages/man7/capabilities.7.html) for security reasons. However, QEMU **needs** to have access to capabilities that aren't provided to a container by default.

<small>Btw I will skip the fact that for some reason my Docker would not work without running with `sudo`.</small>

First we built a test container with the following Dockerfile.

```Dockerfile
FROM ubuntu:16.04
RUN apt-get update && apt-get install -y qemu
CMD qemu-system-x86_64 [...]
```

And then we tried to run it.

```bash
$ docker run --name ub16 -i --privileged -t mycontainer:latest bash
```

It worked surprisingly well ! So far, we were really hopeful that we could manage to play starcraft from inside our CI even though my docker was still very flaky and Dorian's Golang toolchain was totally broken. The next steps were first, create a script to run starcraft from QEMU, write a dagger pipeline to execute the starcraft script from a privileged container and finally stream the output console thanks to some kind of keyboard/mouse and console protocol. Since we were three we could parallelize each of these steps. Dorian focused on the output console part, Mathias on how to run starcraft in a VM and for my part I focused on writing the dagger code.

About how to run starcraft in a VM, I stumbled upon [this great article](https://devnonsense.com/posts/starcraft-qemu/) by [Will Daly](https://github.com/wedaly) that explains is journey in trying to run starcraft in windows XP like in the 90s. I strongly encourage you to read is blog post, it gives a great introduction to QEMU and retro-computing. Still, to sum up how to make it work, first you must find two .iso images : an installation disk of Windows XP and a Starcraft ROM. Then you will need to install Windows XP on a QCOW2 virtual hard disk has you would do for any other operating system. From that point the next step will be directly executed inside Dagger.

Noowww, let's have a look at our final script : 

```go
func (m *Quatrevm) Run(ctx context.Context, directoryArg *dagger.Directory) *dagger.Service {
    cdrom := "/mnt/starcraft.iso"
	return dag.Container().
		From("ubuntu:16.04").
		WithMountedDirectory("/mnt", directoryArg).
		WithWorkdir("/mnt").
		WithExec(
			[]string{"apt-get", "update", "-y"},
		).WithExec(
		[]string{"apt-get", "install", "qemu", "-y"}, // We hope it gets cached
	).WithExposedPort(5930).
		AsService(dagger.ContainerAsServiceOpts{Args: []string{
			"qemu-system-x86_64",
			"--enable-kvm",
			"-hda", "/mnt/winxp.img",
			"-m", "6144",
			"-net", "user",
			"-cdrom", cdrom,
			"-boot", "d",
			"-rtc", "base=localtime,clock=host",
			"-smp", "cores=1,threads=1",
			"-usb",
			"-device", "usb-tablet",
			"-vga", "cirrus",
			"-device", "virtio-serial-pci",
			"-spice", "port=5930,disable-ticketing=on",
			"-device", "virtserialport,chardev=spicechannel0,name=com.redhat.spice.0",
			"-chardev", "spicevmc,id=spicechannel0,name=vdagent",
		}, InsecureRootCapabilities: true})
}
```
In the code snippet above, we first mount the directory containing the Starcraft ROM and the Windows XP installation disk which is passed thanks to the `--directory-arg` argument.
Then we install QEMU inside the container thanks to the `apt-get` command. We also use the `--enable-kvm` flag to enable the KVM virtualization, after trying to remove it later we figured out that we can disable the `InsecureRootCapabilities` since KVM (kernel-based virtual machine) is an hypervisor running at the kernel level which not surprisingly needs special capabilities to be ran by a program from the userland. QEMU can also act as a virtual machine manager (VMM) if used without KVM but this setup leads to huge performance loss. Since we want starcraft to run as smoothly as possible we used QEMU+KVM even though standalone QEMU would only need default kernel capabilities.

About the console, we used the [spice protocol](https://en.wikipedia.org/wiki/Simple_Protocol_for_Independent_Computing_Environments) created by Red Hat which allows to stream a desktop environment from a virtual machine on a server managed by the hypervisor itself. Now QEMU acts as a server that exposes the port `5930`.

Now that we had all the pieces in place, we could finally make the starcraft thing happen.

```bash
$ dagger call run --directory-arg=. up
```

And ...drum roll 🥁... it didn't work :( We waited for a while in front of my computer but dagger was hanging on the `finding module configuration` step. When making the logs more verbose we discovered that message : 
```
│ ● .directory(include: ["./dagger.json", "./**/*"], path: "/home/courtcircuits/projects/quatrevm"): Directory! 26.2s
│ │ │ │ ● upload /home/courtcircuits/projects/quatrevm from h9qyncxb2hrxb3edukved5x99
```
Dagger seemed to have a hard time loading our project directory. One cool thing with open source is that when you get stuck with that kind of issue, you can just have a look at the code. [In Dagger's codebase in the `modulesource.go` file](https://github.com/dagger/dagger/blob/main/core/modulesource.go#L381C1-L381C20) we can see that Dagger does a `diffcopy` of the module into the action container. And in our case dagger was taking so much time because we were trying to copy bit by bit a QCOW2 image of 16 giga bytes...

So we went back to install a fresh windows XP virtual machine that would only weight 1 gigabyte. We tried again to run the script and it worked. It was finally time to call the `spice-protocol`.

```bash
$ spicy -p 5930
```

And we were able to see Windows XP !

![starcraft in dagger](/winxp.png)

Unfortunately, we were not able to launch starcraft in the VM because there was not enough memory. But we think that if we waited for the file copy to finish with our initial image, it could have been possible.


## now what ?

There were some leads that we didn't go through because of the lack of time. But maybe by mounting the docker socket inside dagger we could somehow create a mounting point inside the running container. Still it's likely to not work since dagger doesn't use docker to manage the workloads.

If you want to have a look at the code, you can find it [here](https://github.com/418-Error/418starcraft).

Update : two days after the hackathon, I tried launching my 16 giga image in dagger but for some reason dagger was eating more and more memory. There might be a memory leak or Golang's garbage collector might have a hard time dealing the image in memory. To be frank, I don't know, I'll keep you updated on that (if I don't fall into another rabbit hole) !

Finally, I want to thank [Justin](https://github.com/jedevc) and [Tom](https://github.com/TomChv) from Dagger that gave us a lot of tips about the product and how we could make the starcraft thing happen.


