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

To compensate for the increased load on the car, I have also introduced the ability for the script to modify the schedule of the AWS Cloudwatch event so that whenever battery changes are detected, the schedule is kept fast, but if the battery state doesn't change between requests, a slower schedule is used. Once the slow schedule updates have gone past a certain threshold, an even slower schedule is used.
In order to use this mechanism, two requests are made from Nissan Connect so I have had to increase my Timeout.

When setting up your scheduled event, you will need to configure an input on the Target. Use Constant (Json text) and use the following format:
`{"mechanism":"scheduledUpdate","currentBatteryLevel":0,"interval":1,"timesRunInState":0,"resources":["arn:aws:events:us-east-1:123123123:rule/scheduledNissanLeafUpdate"]}`
Ensure you replace the 'resources' value with your arn as defined in **scheduledEvent**.

# Lambda Environment Variables
These are the environment variables that need to be defined:

## General settings:
* **regioncode** : _string_
: Possible value are _NE_ (Europe), _NNA_ (North America) and _NCI_ (Canada)
* **applicationId** : _amazon resource name_
: applicationId passed in from your Alexa skill definition, eg. _amzn1.ask.skill.eb25aa45-e137-4482-be5a-741ff7a28224_
* **username** : _string_
: Your NissanConnect username or email address
* **password** : _string_
: Your NissanConnect account password

## Schedule related:
* **fastUpdateTime** : _number_
: Time in minutes between updates whent the battery state is changing, or Alexa interactions occur, eg. _15_
* **slowUpdateTime** : _number_
: Time in minutes between updates when the battery state stops changing, eg. _60_
* **slowUpdateThreshold** : _number_
: Number of times the slow update should happen before moving on to the dormant update time, eg. _5_
* **dormantUpdateTime** : _number_
: Time in minutes between updates when the slow update threshold value has passed, eg. _360_
* **scheduledEventArn** : _amazon resource name_
: Identity of the CloudWatch scheduled event that will perform the regular updates, e.g. _arn:aws:events:us-east-1:123123123:rule/scheduledNissanLeafUpdate_
* **scheduledEventName** : _string_
: Name of the CloudWatch scheduled event that will perform the regular updates, e.g. _scheduledNissanLeafUpdate_
* **scheduledEventFunctionArn** : _amazon resource name_
: Identity of the CloudWatch scheduled event Target containing the event settings, e.g. _arn:aws:lambda:us-east-1:123123123123:function:scheduledNissanLeafUpdate_. This is the ARN value of this Lambda function, which you can get from the top of the page.
* **scheduleEventTargetId** : _string_
: Id of the CloudWatch scheduled event Target containing the event settings, e.g. _Id123123123123_. You can use the getCloudWatchRuleDetails function to find this information by using the 'Alexa, ask *my car* to log my rules' statement

## Advanced settings:
If you have LeafSpy, you can get more accurate data by entering some of the values here

* **leafSpyTotalCapacity** : _number_
: Total WH battery capacity

## Other:
* **debugLogging** : _boolean_
: Creates additional logging entries when set to anything truthy, set to blank or remove if you want to disable
