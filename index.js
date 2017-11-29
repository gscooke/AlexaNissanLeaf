"use strict";

var AWS = require("aws-sdk");

// Require the leaf.js file with specific vehicle functions.
let car = require("./leaf");

// Build a response to send back to Alexa.
function buildResponse(output, card, shouldEndSession) {
	return {
		version: "1.0",
		response: {
			outputSpeech: {
				type: "PlainText",
				text: output,
			},
			card,
			shouldEndSession
		}
	};
}

// Helper to build the text response for range/battery status.
function buildBatteryStatus(battery) {
	console.log(battery);
	const milesPerMeter = 0.000621371;
	let response = `You have ${Math.floor((battery.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount / battery.BatteryStatusRecords.BatteryStatus.BatteryCapacity) * 100)}% battery which will get you approximately ${Math.floor(battery.BatteryStatusRecords.CruisingRangeAcOn * milesPerMeter)} miles. `;

	if (battery.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus != "NOT_CHARGING") {
		
		if (battery.BatteryStatusRecords.hasOwnProperty("TimeRequiredToFull200_6kW")) {
			response += buildChargeTimeResponse(battery.BatteryStatusRecords.TimeRequiredToFull200_6kW.HourRequiredToFull, battery.BatteryStatusRecords.TimeRequiredToFull200_6kW.MinutesRequiredToFull);
		} else if (battery.BatteryStatusRecords.hasOwnProperty("TimeRequiredToFull200")) {
			response += buildChargeTimeResponse(battery.BatteryStatusRecords.TimeRequiredToFull200.HourRequiredToFull, battery.BatteryStatusRecords.TimeRequiredToFull200.MinutesRequiredToFull);
		} else if (battery.BatteryStatusRecords.hasOwnProperty("TimeRequiredToFull")) {
			response += buildChargeTimeResponse(battery.BatteryStatusRecords.TimeRequiredToFull.HourRequiredToFull, battery.BatteryStatusRecords.TimeRequiredToFull.MinutesRequiredToFull);
		} else {
			response += "The car is plugged in and charging";
		}
	} else if (battery.BatteryStatusRecords.PluginState == "CONNECTED") {
		response += "The car is plugged in";
	} else {
		response += "The car is not plugged in";
	}

	return response + ".";
}

function buildChargeTimeResponse(hoursToFull, minutesToFull) {
	let response = "The car will be fully charged in ";

	if (hoursToFull > 0) {
		response += hoursToFull;
		response += " hour";
		if (hoursToFull > 1) {
			response += "s";
		}
		if (minutesToFull > 0) {
			response += " and "
		}
	}

	if (minutesToFull > 0) {
		response += minutesToFull;
		response += " minute";
		if (minutesToFull > 1) {
			response += "s";
		}
	}

	return response;
}

// Helper to build the text response for charging status.
function buildChargingStatus(charging) {
	let response = "";
	if(charging.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus == "NOT_CHARGING") {
		response += "Your car is not on charge.";
	} else {
		response += "Your car is on charge.";
	}
	
	return response;
}

// Helper to build the text response for connected to power status.
function buildConnectedStatus(connected) {
	let response = "";
	if(connected.BatteryStatusRecords.PluginState == "NOT_CONNECTED") {
		response += "Your car is not connected to a charger.";
	} else {
		response += "Your car is connected to a charger.";
	}
	
	return response;
}

// Helper to build the text response for battery condition status.
function buildBatteryConditionStatus(connected) {
	let response = "Your car has ";
	let maxBars = 12;
	
	if (connected.BatteryStatusRecords.BatteryStatus.BatteryCapacity > 200) {
		maxBars = Math.round((connected.BatteryStatusRecords.BatteryStatus.BatteryCapacity / 20) * 10);
		maxBars = maxBars / 10;
	}
		
	response += maxBars + " bars remaining.";
	
	return response;
}

function rescheduleUpdate(batteryRemainingAmount, event) {
	console.log("Updating schedule")

	if (batteryRemainingAmount == event.currentBatteryLevel)
	{
		// Battery status has not changed - set to slow updates
		console.log("Set slow schedule");
		rescheduleCloudWatchEvent(process.env.slowUpdateTime, batteryRemainingAmount, event);
	} else {
		// Battery status is changing - set to fast updates
		console.log("Set fast schedule");
		rescheduleCloudWatchEvent(process.env.fastUpdateTime, batteryRemainingAmount, event);
	} 
}

function handleScheduledUpdate(success, battery, event) {
	if (success) {
		rescheduleUpdate(battery.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount, event)
	} else {
		console.log("Could not get battery state, force fast update");
		rescheduleUpdate(-1, event);
	}

	car.sendUpdateCommand(
		() => console.log("Scheduled battery update requested"),
		() => console.log("Scheduled battery update failed")
	);
}

// Handling incoming requests
exports.handler = (event, context) => {
		
	// Helper to return a response with a card.		
	const sendResponse = (title, text) => {
		context.succeed(buildResponse(text, {
			"type": "Simple",
			"title": title,
			"content": text
		}));
	};

	try {
		// Check if this is a CloudWatch scheduled event.
		// if ((event.source == "aws.events" && event["detail-type"] == "Scheduled Event") || 
		if (event.mechanism && event.mechanism == 'scheduledUpdate') {
			console.log(event);
			// The en{vironmnet variable scheduledEventArn should have a value as shown in the trigger configuration for this lambda function,
			// e.g. "arn:aws:events:us-east-1:123123123:rule/scheduledNissanLeafUpdate",
			// if (event.resources && event.resources[0] == process.env.scheduledEventArn)  {
				console.log("Beginning scheduled update");
				// Update the schedule
				car.getBatteryStatus(
					response => handleScheduledUpdate(true, response, event),
					() => handleScheduledUpdate(false, null, event)
				);

				// Scheduled data update
				// car.sendUpdateCommand(
				// 	() => console.log("Scheduled battery update requested"),
				// 	() => console.log("Scheduled battery update failed")
				// );
				return;
			// }
			// sendResponse("Invalid Scheduled Event", "This service is not configured to allow the source of this scheduled event.");
			// return;
		}
		// Verify the person calling the script. Get your Alexa Application ID here: https://developer.amazon.com/edw/home.html#/skills/list
		// Click on the skill and look for the "Application ID" field.
		// Set the applicationId as an environment variable or hard code it here.
		if(event.session.application.applicationId !== process.env.applicationId) {
			sendResponse("Invalid Application ID", "You are not allowed to use this service. Application ID provided was " + event.session.application.applicationId);
			return;
		}

		// Shared callbacks.
		const exitCallback = () => context.succeed(buildResponse("Goodbye!"));
		const helpCallback = () => context.succeed(buildResponse("What would you like to do? You can preheat the car or ask for battery status.", null, false));
		const loginFailureCallback = () => sendResponse("Authorisation Failure", "Unable to login to Nissan Services, please check your login credentials.");

		// Handle launches without intents by just asking what to do.		
		if (event.request.type === "LaunchRequest") {
			helpCallback();
		} else if (event.request.type === "IntentRequest") {
			// Handle different intents by sending commands to the API and providing callbacks.
			switch (event.request.intent.name) {
				case "PreheatIntent":
					car.sendPreheatCommand(
						response => sendResponse("Car Preheat", "The car is warming up for you."),
						() => sendResponse("Car Preheat", "I can't communicate with the car at the moment.")
					);
					break;
				case "CoolingIntent":
					car.sendCoolingCommand(
						response => sendResponse("Car Cooling", "The car is cooling down for you."),
						() => sendResponse("Car Cooling", "I can't communicate with the car at the moment.")
					);
					break;
				case "ClimateControlOffIntent":
					car.sendClimateControlOffCommand(
						response => sendResponse("Climate Control Off", "The cars climate control is off."),
						() => sendResponse("Climate Control Off", "I can't communicate with the car at the moment.")
					);
					break;
				case "StartChargingIntent":
					car.sendStartChargingCommand(
						response => sendResponse("Start Charging Now", "The car is now charging for you."),
						() => sendResponse("Start Charging Now", "I can't communicate with the car at the moment.")
					);
					break;
				case "UpdateIntent":
					car.sendUpdateCommand(
						response => sendResponse("Car Update", "I'm downloading the latest data for you."),
						() => sendResponse("Car Update", "I can't communicate with the car at the moment.")
					);
					break;
				case "RangeIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Range Status", buildBatteryStatus(response)),
						() => sendResponse("Car Range Status", "Unable to get car battery status.")
					);
					break;
				case "ChargeIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Battery Status", buildBatteryStatus(response)),
						() => sendResponse("Car Battery Status", "Unable to get car battery status.")
					);
					break;
				case "ChargingIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Charging Status", buildChargingStatus(response)),
						() => sendResponse("Car Charging Status", "Unable to get car battery status.")
					);
					break;
				case "ConnectedIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Connected Status", buildConnectedStatus(response)),
						() => sendResponse("Car Connected Status", "Unable to get car battery status.")
					);
					break;
				case "BatteryConditionIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Battery Condition Status", buildBatteryConditionStatus(response)),
						() => sendResponse("Car Battery Condition Status", "Unable to get battery condition status.")
					);
					break;
				case "AMAZON.HelpIntent":
					helpCallback();
					break;
				case "AMAZON.StopIntent":
				case "AMAZON.CancelIntent":
					exitCallback();
					break;
			}
		} else if (event.request.type === "SessionEndedRequest") {
			exitCallback();
		}
	} catch (err) {
		console.error(err.message);
		console.log(event);
		sendResponse("Error Occurred", "An error occurred. Fire the programmer! " + err.message);
	}
};

function rescheduleCloudWatchEvent(minutesToAdd, newBatteryState, event) {
	var cloudwatchevents = new AWS.CloudWatchEvents();
	var currentTime = new Date().getTime(); // UTC Time
	var nextTime = dateAdd(currentTime, "minute", minutesToAdd);
	var nextMinutes = nextTime.getMinutes();
	var nextHours = nextTime.getHours();
	
	// var ruleParams = {
	// 	"Rule": process.env.scheduledEventName
	// };
	// cloudwatchevents.listTargetsByRule(ruleParams, function(err, data) {
    //     if (err) {
    //         console.log(err, err.stack);  
    //     }
    //     else {
    //         console.log(data);
    //     }
	// });
	
	var timesRunInState = event.timesRunInState;
	if (event.interval == minutesToAdd) {
		timesRunInState += 1;
	} else {
		timesRunInState = 0;
	}

	// Build the input parameters
	var ruleDetails = {
        Rule: process.env.scheduledEventName,
        Targets: [ 
            {
				Id: process.env.scheduleEventTargetId,
                Arn: process.env.scheduledEventFunctionArn,
                Input: '{ "mechanism": "scheduledUpdate", "currentBatteryLevel": ' + newBatteryState + ', "interval": ' + minutesToAdd + ', "timesRunInState": ' + timesRunInState + ' }'
            }
        ]
	};
	
	console.log(ruleDetails);

	// Build the new schedule
	var scheduleExpression = "cron(" + nextMinutes + " " + nextHours + " * * ? *)";
    var params = {
        Name: process.env.scheduledEventName,
        ScheduleExpression: scheduleExpression
	};
	
	// Set the schedule
    cloudwatchevents.putRule(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);  
        }
        else {
            console.log(data);
        }
	})
	// Set the targets
    cloudwatchevents.putTargets(ruleDetails, function(err, data) {
        if (err) {
            console.log(err, err.stack);  
        }
        else {
            console.log(data);
        }
    })
}

var dateAdd = function(date, interval, units) {
    var ret = new Date(date); // don't change original date
    switch(interval.toLowerCase()) {
        case 'year'   :  ret.setFullYear(ret.getFullYear() + units);  break;
        case 'quarter':  ret.setMonth(ret.getMonth() + 3*units);  break;
        case 'month'  :  ret.setMonth(ret.getMonth() + units);  break;
        case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
        case 'day'    :  ret.setDate(ret.getDate() + units);  break;
        case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
        case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
        case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
        default       :  ret = undefined;  break;
    }
    return ret;
}
