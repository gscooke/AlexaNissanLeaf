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
THe script supports updates via a scheduled event from AWS CloudWatch. I have modified this so that it uses the SendUpdate command which probably uses more power but seems to keep the data nicely up to date
