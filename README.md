# AlexaNissanLeaf
An Alexa Skill to control the Nissan Leaf (and eNV200).
Credit to Scott Helme for the original version of this code: https://scotthelme.co.uk/using-alexa-to-control-my-car/

# Interacting with Alexa
You interact with the skill using the invocation name "my car". For example:

* Alexa, ask *my car*
* Alexa, tell *my car*
* Alexa, launch *my car*

# Commands
The skill has the following features:

* Preheat - Activate the climate control
* Cooling - Activate the climate control
* Climate Control Off - Turn off the climate control
* Update - Download the latest data from the car
* Range - Ask how much range you have
* Battery - Ask how much battery you have
* Charging - Ask if the car is currently charging
* Connected - Ask if the car is connected to a charger
* Start Charging - Ask the car to start charging
* Battery Condition - Ask how many battery bars you have

# Examples
These are examples of some of the interactions with Alexa:

* Alexa, ask my car to preheat.
* Alexa, ask my car how much power it has.
* Alexa, ask my car how much range it has.
* Alexa, ask my car to cool down. 
* Alexa, ask my car to send an update. 
* Alexa, ask my car if it's charging.
* Alexa, ask my car if it's connected to power.
* Alexa, ask my car to turn off the climate control.
* Alexa, ask my car what the condition of the battery is
* Alexa, ask my car to start charging

# Scheduled Events
The script supports updates via a scheduled event from AWS CloudWatch. I have modified this so that it uses the SendUpdate command which probably uses more power but seems to keep the data nicely up to date.
To compensate for the increased load on the car, I have also introduced the ability to modify the schedule of the AWS Cloudwatch event so that whenever battery changes are detected, the schedule is kept fast (user definable) but if the battery state doesn't change between requests, a slower schedule is used. Once the slow schedule updates have gone past a certain threshold, an even slower schedule is used.

# Lambda Environment Variables
These are the environment variables that need to be defined:

## Schedule related:
* fastUpdateTime: number
Time in minutes between updates whent the battery state is changing, or Alexa interactions occur, eg. 15
* slowUpdateTime: number
Time in minutes between updates when the battery state stops changing, eg. 60
* slowUpdateThreshold: number
Number of times the slow update should happen before moving on to the dormant update time, eg. 5
* dormantUpdateTime: number
Time in minutes between updates when the slow update threshold value has passed, eg. 360
* scheduledEventArn: arn
Identity of the CloudWatch scheduled event that will perform the regular updates, e.g. arn:aws:events:us-east-1:123123123:rule/scheduledNissanLeafUpdate
* scheduledEventName: string
Name of the CloudWatch scheduled event that will perform the regular updates, e.g. scheduledNissanLeafUpdate
* scheduledEventFunctionArn: arn
Identity of the CloudWatch scheduled event Target containing the event settings, e.g. arn:aws:lambda:us-east-1:123123123123:function:scheduledNissanLeafUpdate. You can use the getCloudWatchRuleDetails function to find this information
* scheduleEventTargetId: string
Id of the CloudWatch scheduled event Target containing the event settings, e.g. Id123123123123. You can use the getCloudWatchRuleDetails function to find this information

## General settings:
* regioncode: string
Possible value are NE (Europe), NNA (North America) and NCI (Canada)
* applicationId: arn
applicationId passed in from your Alexa skill definition
* username: string
Your NissanConnect username or email address
* password: string
Your NissanConnect account password
