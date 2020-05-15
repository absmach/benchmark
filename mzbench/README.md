# Scenarios

Folder [scenarios](scenarios/) contains .bdl files ([Benchmark Definition Language](https://github.com/mzbench/mzbench/blob/master/doc/scenarios/spec.md)) that represents different testing scenarios for MZbench.


List of scenarios that we will test.
- [Fan-in](scenarios/fan_in.bdl)
- [Fan-out](scenarios/fan_out.bdl)

A prerequisite for running these test scenarios is to have Mainflux instance where you should:
- create one Channel
- create two Things
- connect both Things to Channel

Required parameters are then set with running mzbench with --env param:

`$ ./bin/mzbench run --env foo=bar --env n=42`

or when using MZBench dashboard by importing and setting environment variables from scenario.


| Environment variable | Description | Default |
| --- | --- | --- |
| MF_MZBENCH_MQTT_ENDPOINT | IP/domain of MQTT endpoint on Mainflux | 127.0.0.1 |
| MF_MZBENCH_MQTT_PORT | Port of MQTT endpoint on Mainflux | 1883 |
| MF_MZBENCH_CHANNEL_ID | ID of pre-provisioned channel on which both things are connected| |
| MF_MZBENCH_THING_1_ID | First thing ID of pre-provisioned Mainflux thing | |
| MF_MZBENCH_THING_1_KEY | First thing key of pre-provisioned Mainflux thing | |
| MF_MZBENCH_THING_2_ID | Second thing ID of pre-provisioned Mainflux thing | |
| MF_MZBENCH_THING_2_KEY | Second thing key of pre-provisioned Mainflux thing| |

Scenarios have its own parameters (like duration of test, rate of publishing...) that are set through environment variables, also. You can redefine an environment variable even during the benchmark without interrupting the benchmark itself with [change env](https://github.com/mzbench/mzbench/blob/master/doc/cli.md#change_env) command.

## Fan-in

In [fan-in](https://en.wikipedia.org/wiki/Fan-in) scenario numerous MQTT clients are sending messages on same Mainflux channel, but every client to exclusive subtopic on that channel. One subscriber is consuming all those messages.

| Environment variable | Description | Default |
| --- | --- | --- |
| MF_MZBENCH_PUB_NUM | Number of publishers | 10000 |
| MF_MZBENCH_PUB_RATE | Message rate per publihser in rps. Number of messages that every publisher is sending per second | 1 |
| MF_MZBENCH_PUB_TIME | Duration of publishing messages in minutes | 5 |
| MF_MZBENCH_MSG_SIZE | Size of messages in bytes. Messages are a sequence of random bytes | 100 |
| MF_MZBENCH_QOS | MQTT QoS level | 2 |

## Fan-out

In [fan-out](https://en.wikipedia.org/wiki/Fan-out) scenario one MQTT client is sending messages on Mainflux channel. Numerous subscribers are connected to that channel and consuming  messages.

| Environment variable | Description | Default |
| --- | --- | --- |
| MF_MZBENCH_SUB_NUM | Number of subscribers | 10000 |
| MF_MZBENCH_PUB_RATE | Message rate in rps. Number of messages that publisher is sending per second | 1 |
| MF_MZBENCH_PUB_TIME | Duration of publishing messages in minutes | 5 |
| MF_MZBENCH_MSG_SIZE | Size of messages in bytes. Messages are a sequence of random bytes | 100 |
| MF_MZBENCH_QOS | MQTT QoS level | 2 |


