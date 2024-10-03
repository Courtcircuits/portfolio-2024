---
title: migrate an old school infrastructure to the cloud [wip]
description: Through this article I will tell which challenges I encountered when migrating old virtualized infrastructures to the cloud. It will be the occasion to share some Linux hacks and good practices when it comes to deploying in the cloud.
pubDate: Oct 02 2024
heroImage: /blog-placeholder-3.jpg
tags:
  - ops
  - cloud
  - uefi
  - wip
---
Before starting, you need to know that this article is the complement of an other article that I wrote for my former employer [Kaliop](https://www.kaliop.com). The following post will mainly focus on my mindset and challenges when dealing with this kind of challenges, also I will try to demystify the QEMU virtual machine standard. Kaliop's article (to be published) tends to show the pros and cons of this migration.

## Context

One day I came to Kaliop's office as usual, ready to do some Devops stuff but my manager (we will call him Michael) had an other mission for me. For context, Kaliop is a company that provide digital expertise towards other companies therefore my team (the devops one btw) had to administrate around one hundred virtual machines. So that day, Michael wanted me to estimate how hard it would be to migrate all our virtual machines to the cloud with no alteration on the OS. He didn't want me to **rsync** the home partitions to a new disk.