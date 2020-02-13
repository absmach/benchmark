# Mainflux IIoT Distributed MQTT Load Testing.
Repository contains [mzbench](https://github.com/satori-com/mzbench) production ready scenarios for  Mainflux IIoT MQTT loadtest.

## Introduction
[Mainflux](https://github.com/mainflux/mainflux) is a scalable, secure, open-source, and patent-free IIoT cloud platform.

[MQTT](http://mqtt.org/) is a messaging backbone protocol in Mainflux and in general most commonly used protocol for IoT. 
Mainflux uses [mproxy](https://github.com/mainflux/mproxy) which follow [sidecar pattern](https://www.oreilly.com/library/view/designing-distributed-systems/9781491983638/ch02.html)
to proxy MQTT traffic betwen client and broker. For more info checkout [architecture diagram](https://github.com/mainflux/mproxy#architecture).

Motivation comes due to MQTT complexity in real-life and production environments, reliable, secure and scalable connectivity and messaging is hard.
We decided to remove the limitation and introduced mproxy with "Bring your own broker" philosophy. Thanks to this idea, Mainflux is capable to work with any MQTT Broker from the market. AuthN and AuthZ (mTLS, RBAC policies) if fully offloaded to mproxy and we left MQTT part to MQTT broker.

Default MQTT broker which comes with the Mainflux IIoT platform, out of the box is [VerneMQ](https://github.com/vernemq/vernemq). 

It's our preferred and recommended broker, highly scalable and clustered on Kubernetes with [Mainflux Helm charts](https://github.com/mainflux/devops) but **NOT required**,
you are free to **use ANY MQTT broker**, thanks to mproxy you are welcome to "Bring your own broker" which suits best for your use case.

As I said, reliable, secure and scalable communication is hard, the holy grail of IoT. Different environments and use cases require different test cases and testing is hard.
This repository and test case scenarios will help you to test Mainflux platform MQTT messaging with the most commonly used connectivity patterns like fan-in, fan-out, etc... 
with periodic high load on production-ready Kubernetes cluster. 

How this is supposed to be a production environment load testing, you will not see single node's here, testing on localhost, "tested on my Mac",  etc... no fairy tales!

## Testing toolbelt
* Running [Mainflux platform](https://github.com/mainflux/mainflux) on Kubernetes.

  Thanks to [Helm](https://helm.sh/), you can sping Mainflux on running Kubernetes cluster in 2min using [Mainflux helm charts](https://github.com/mainflux/devops).
* [mzbench](https://github.com/satori-com/mzbench) Thanks to [@satori-com](https://github.com/satori-com)

   Follow official [installtion guide](https://satori-com.github.io/mzbench/)
   For UI follow [How to use Dashboard](https://github.com/satori-com/mzbench/blob/master/doc/dashboard.md)

* [vmq_mzbenc](vmq_mzbench) worker plugin for MQTT testing. Thanks to [@vernemq](https://github.com/vernemq)

  You don't need to install it, it will be pulled from Github with running scenario. For more info check out great [VerneMQ blog](https://vernemq.com/blog/2016/08/26/loadtesting-mqtt-brokers.html)
* [mzb_api_ec2_plugin](https://satori-com.github.io/mzbench/cloud_plugins/#amazon-ec2) built-in AWS cloud plugin for workers distribution.

## Prerequisites
Two provisioned Mainflux things connected to the same channel. We will call it thing_1 and thing_2 in our test scenarios. We need two things because we need to pub and sub at the same time.

 For more details on how to do provisioning, checkout [Mainflux provisioning documentation](https://mainflux.readthedocs.io/en/latest/provisioning/#provisioning-things)

## How it works
You can't get the right number of concurred connections from one host/client, due to OS limit, client library, socket limit, etc...
Testing from a single client is not realistic and far away from production-ready environments, but it's better than no testing at all.
Besides connections and load, it's crucial to test real-life scenarios, together with AuthN and AuthZ, TLS determination, etc... everything that one production environment requires. 
All those layers and network hops add extra delays and milliseconds are important, especially with a high number of connections or messages.

## Scenarios 
Here is a list of scenarios that we will test.
- [Fan in](https://github.com/nmarcetic/mainflux-loadtest/scenarios/fan_in.bdlhttps://github.com/nmarcetic/mainflux-loadtest/blob/master/mzbench/scenarios/fan_in.bdl)
- [Fan out](https://github.com/nmarcetic/mainflux-loadtest/blob/master/mzbench/scenarios/fan_out.bdl)

## Results
Kubernetes is a defacto standard for production-grade container orchestration, that's why we use Kubernetes in all our test environments with all scenarios. 
Testing is done on different infrastructures, regarding cluster resources, a number of nodes,  compute power, etc... with different cloud providers.
Each report contains details about cluster resources, testing scenario, test report and rough monthly cost estimate (its impossible to do precise costs estimation due to variable costs and use case details).

- [x] Digitalocean Kubernetes cluster. Detailed report available [here](https://github.com/nmarcetic/mainflux-loadtest/blob/master/reports/digitalocean.md)
- [ ] [Google GKE](https://cloud.google.com/kubernetes-engine)
- [ ] [AWS EKS](https://aws.amazon.com/eks/)


## AWS Distributed testing
There is a mzbench community [optimized AMI](https://thecloudmarket.com/image/ami-ee8d718e--mzbench-erlang-18) available on AWS (search for mzbench AMI)
which can be used with AWS [built in cloud plugin](https://github.com/satori-com/mzbench/blob/master/doc_old/cloud_plugins.md)  for distributed testing.

