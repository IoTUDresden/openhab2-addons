/*******************************************************************************
 * ******************************** Public Vars
 * **************************************
 ******************************************************************************/

var locations;
var healthMonitors = "";

var curRobot = {
	position : "",
	move : ""
};
var lastThingClicked = "";

/*******************************************************************************
 * ******************************** Requests
 * **************************************
 ******************************************************************************/

function loadPersonsTable() {
	beginPersonTable();
}

/**
 * First load locations -> then all things -> build the table
 */
function loadSemanticThingsTable() {
	loadLocationsForThings();
	loadRobotsForThings();
}

/**
 * loads all available locations
 */
function loadLocationsForThings() {
	$.ajax("/rest/semantic/extended/locations", {
		method : "GET",
		success : locationsReceived,
		error : handleResponseError
	});
}

function loadRobotsForThings() {
	$.ajax("/rest/semantic/extended/robots", {
		method : "GET",
		success : robotsReceived,
		error : handleResponseError
	});
}

/**
 * load all things
 */
function loadThings() {
	$.ajax("/rest/semantic/extended/things", {
		method : "GET",
		success : fillThingsTable,
		error : handleResponseError
	});
}

/**
 * Updates the location for a thing
 */
function updateThingLocation(thingName, locationUri) {
	var pData = {
		semanticUri : locationUri,
		realLocationName : "",
		clazz : ""
	}

	$.ajax("/rest/semantic/extended/things/" + thingName + "/location", {
		data : JSON.stringify(pData),
		contentType : "application/json",
		method : "POST",
		success : thingLocationUpdated,
		error : showFailed
	});
}

/**
 * updates the poi for a thing
 */
function updateThingPoi(thingName, poi) {
	$.ajax("/rest/semantic/extended/things/" + thingName + "/poi", {
		data : JSON.stringify(poi),
		contentType : "application/json",
		method : "POST",
		success : thingPoiUpdated,
		error : showFailed
	});
}

function getRobotLocation(poiItem) {
	$.ajax("/rest/items/" + poiItem + "/state", {
		method : "GET",
		contentType : "text/plain",
		success : setThingPoi,
		error : showFailed
	});
}

function postItemCommand(itemName, command) {
	$.ajax("/rest/items/" + itemName, {
		data : command,
		contentType : "text/plain",
		method : "POST",
		success : commandSendToItem,
		error : showFailed
	});
}

function getPersons() {
	$.ajax("/rest/semantic/extended/persons", {
		method : "GET",
		success : fillPersonsTable,
		error : handleResponseError
	});
}

function beginPersonTable() {
	$.ajax("/rest/semantic/extended/health/sensors", {
		method : "GET",
		success : beginPersonTableHealthReceived,
		error : handleResponseError
	});
}

function updatePerson(person) {
	$.ajax("/rest/semantic/extended/persons/" + person.uid, {
		data : JSON.stringify(person),
		contentType : "application/json",
		method : "POST",
		success : personUpdated,
		error : showFailed
	});
}

/*******************************************************************************
 * ******************************** Events
 * ****************************************
 ******************************************************************************/

// selected location changed
$(document).on('change', "select[name='location-select']", function() {
	var value = $(this).find(":selected").data("value");
	updateThingLocation(value.thing, value.loc);
});

// selected robot changed
$(document).on('change', "#robot_select", function() {
	var value = $(this).find(":selected").data("value");
	curRobot = value;
});

// set poi pressed
$(document)
		.on(
				'click',
				"button[name='setThingPoiBtn']",
				function() {
					var thingName = $(this).attr("value");
					if (curRobot == "" || curRobot === undefined
							|| curRobot.position == "") {
						alert("please select a robot above, which indicates the poi for this thing");
					} else {
						lastThingClicked = thingName;
						getRobotLocation(curRobot.position);
					}

				});

// delete poi pressed
$(document).on('click', "button[name='deleteThingPoiBtn']", function() {
	var thingName = $(this).attr("value");
	updateThingPoi(thingName, createPoi("", ""));
});

// move Robot clicked
$(document).on('click', "button[name='moveRobotToThingPoiBtn']", function() {
	var poiStr = $(this).val();
	if (curRobot == "" || curRobot.move == "") {
		alert("Please select a robot above before moving");
		return;
	}
	if (poiStr == "") {
		alert("Please set a poi at first.");
		return;
	}

	postItemCommand(curRobot.move, poiStr);
});

// update person clicked
$(document).on('click', "button[name='updatePersonBtn']", function() {
	var row = $(this).closest('tr')[0];
	var uid = row.cells[0].innerText;
	var fName = getInputValueOfTd(row.cells[1]);
	var lName = getInputValueOfTd(row.cells[2]);
	var age = getInputValueOfTd(row.cells[3]);
	var gender = getInputValueOfTd(row.cells[4]);
	var healthM = getInputValueOfSelect(row.cells[5]);
	
	var person = {
		firstName : fName,
		lastName : lName,
		age : age,
		gender : gender,
		uid : uid,
		healthMonitorUid : healthM
	}
	updatePerson(person);
});

/*******************************************************************************
 * ******************************** Helpers
 * ***************************************
 ******************************************************************************/

function getInputValueOfSelect(cell) {
	var select = cell.getElementsByTagName("select")[0];
	return select.options[select.selectedIndex].value;
}

function getInputValueOfTd(cell) {
	var input = cell.getElementsByTagName("input")[0];
	return input.value;
}

function commandSendToItem() {
	showSuccess("command send to item");
}

function personUpdated() {
	showSuccess("person updated");
}

function setThingPoi(data) {
	if (lastThingClicked == "") {
		return;
	}
	if (data == "NULL" || data == "" || data === undefined) {
		showFailedShort("robot position not found");
		return;
	}

	var poi = getPoiFromString(data);
	if (poi == "") {
		alert("the given poi '" + data + "' is not valid");
	} else {
		updateThingPoi(lastThingClicked, poi);
	}
}

function getPoiFromString(poiStr) {
	// regex pattern
	// ^\s*P:\s*((?:-?[0-9]+[,|\.][0-9]+\s+){2,3})\s*O:\s*((?:(?:(?:-?[0-9]+[,|\.][0-9]+(?:\s+)){3}|(?:-?[0-9]+[,|\.][0-9]+(?:\s+)){1})-?[0-9]+[,|\.][0-9]+(?:\s*)))
	var rxPoi = new RegExp(
			'^\\s*P:\\s*((?:-?[0-9]+[,|\\.][0-9]+\\s+){2,3})\\s*O:\\s*((?:(?:(?:-?[0-9]+[,|\\.][0-9]+(?:\\s+)){3}|(?:-?[0-9]+[,|\\.][0-9]+(?:\\s+)){1})-?[0-9]+[,|\\.][0-9]+(?:\\s*)))',
			'g');
	var res = rxPoi.exec(poiStr);
	if (res == null || res.length < 3) {
		showFailedShort("the poi is not valid");
		return "";
	}
	return createPoi(res[1], res[2]);
}

function thingPoiUpdated() {
	showSuccess("poi updated");
	loadSemanticThingsTable();
}

function thingLocationUpdated() {
	showSuccess("location updated");
}

function locationsReceived(data) {
	locations = data;
	loadThings();
}

/*******************************************************************************
 * ******************************** Page creation
 * ***************************************
 ******************************************************************************/

function robotsReceived(data) {
	var sel = document.getElementById('robot_select');
	var opt = "";
	var txt = "";
	var dValue = "";

	for ( var i = 0; i < data.length; i++) {
		opt = document.createElement('option');
		txt = document.createTextNode(data[i].uid);
		if ('positionUid' in data[i] && 'moveUid' in data[i]) {
			dValue = {
				position : data[i].positionUid,
				move : data[i].moveUid
			};
		} else {
			dValue = {
				position : '',
				move : ''
			};
		}
		opt.setAttribute('data-value', JSON.stringify(dValue));
		opt.appendChild(txt);
		sel.appendChild(opt);
	}
}

// fills the options in the Things table with the locations
function fillLocations(data) {
	var selects = document.getElementsByName("location-select");
	for (i = 0; i < selects.length; i++) {
		var lastVal = getLastSelectedValue(selects[i]);
		for (k = 0; k < data.length; k++) {
			if (lastVal != data[k].semanticUri) {
				var opt = createOptionAndSelect(data[k].semanticUri,
						data[k].realLocationName, false);
				selects[i].appendChild(opt);
			}
		}
	}
}

// gets the value from the option with attribute 'selected'
function getLastSelectedValue(select) {
	for (j = 0; j < select.children.length; j++) {
		if (select.children[j].hasAttribute("selected")) {
			return select.children[j].getAttribute("value");
		}
	}
	return " ";
}

// starts to build the person table
function beginPersonTableHealthReceived(data) {
	healthMonitors = data;
	getPersons();
}

// fills the persons table
function fillPersonsTable(data) {
	var tBody = document.getElementById("persons_table_body");
	removeAllChilds(tBody);
	for ( var i = 0; i < data.length; i++) {
		var obj = data[i];
		var row = document.createElement('tr');
		if (!addedEmptyRow("uid", obj, row)) {
			addValueToRow(row, obj.uid);
		}

		addInputCellToRow("firstName", obj, row);
		addInputCellToRow("lastName", obj, row);
		addInputCellToRow("age", obj, row);
		addInputCellToRow("gender", obj, row);
		addHealthSensorSelect(obj, row);
		addUpdatePersonBtn(row);
		tBody.appendChild(row);
	}
}

function addHealthSensorSelect(obj, row) {
	var cell = document.createElement('td');
	var sel = document.createElement('select');
	var curHealthMonitor = "";
	sel.setAttribute("class", "form-control");
	sel.setAttribute("name", "health-select");

	if ("healthMonitorUid" in obj) {
		curHealthMonitor = obj.healthMonitorUid;
	}

	// empty select for deleting
	var opt = createHealthOptionAndSelect("", "", curHealthMonitor == "");
	sel.appendChild(opt);

	if (healthMonitors == "") {
		cell.appendChild(sel);
		row.appendChild(cell);
		return;
	}

	for (k = 0; k < healthMonitors.length; k++) {
		var select = healthMonitors[k].uid == curHealthMonitor;
		opt = createHealthOptionAndSelect(healthMonitors[k].uid,
				healthMonitors[k].uid, select);
		sel.appendChild(opt);
	}

	cell.appendChild(sel);
	row.appendChild(cell);
}

function createHealthOptionAndSelect(text, value, select) {
	var opt = document.createElement('option');
	var txt = document.createTextNode(text);

	opt.setAttribute("value", value);
	if (select) {
		opt.setAttribute("selected", "");
	}

	opt.appendChild(txt);
	return opt;

}

function addUpdatePersonBtn(row) {
	var cell = document.createElement('td');
	// set to current btn
	var setBtn = document.createElement('button');
	var node = document.createTextNode("update");

	setBtn.setAttribute("class", "btn btn-sm btn-primary");
	setBtn.setAttribute("name", "updatePersonBtn");
	setBtn.appendChild(node);
	cell.appendChild(setBtn);
	row.appendChild(cell);
}

function addInputCellToRow(propertyName, object, row) {
	// TODO a text input
	var cell = document.createElement('td');
	var input = document.createElement('input');
	var value = "";
	if (propertyName in object) {
		value = object[propertyName];
	}

	input.setAttribute("class", "form-control");
	input.setAttribute("value", value);

	cell.appendChild(input);
	row.appendChild(cell);
}

// fills the things table
function fillThingsTable(data) {
	var tBody = document.getElementById("things_table_body");
	removeAllChilds(tBody);
	for ( var i = 0; i < data.length; i++) {
		var obj = data[i];
		var row = document.createElement('tr');
		if (!addedEmptyRow("openHabName", obj, row)) {
			addValueToRow(row, obj.openHabName);
		}

		if (!addedEmptyRow("clazz", obj, row)) {
			var split = obj.clazz.split("#");
			addValueToRow(row, split[1]);
		}

		addLocationSelect(row, obj)

		var poiStr = "";
		if ("poi" in obj) {
			poiStr = poiToString(obj.poi);
			addValueToRow(row, poiStr);
		} else {
			addValueToRow(row, "");
		}

		addThingPoiBtn(obj.openHabName, poiStr, row);
		tBody.appendChild(row);
	}
}

function addLocationSelect(row, obj) {
	var cell = document.createElement('td');
	var sel = document.createElement('select');
	var curLoc = "";
	sel.setAttribute("class", "form-control");
	sel.setAttribute("name", "location-select");

	if ("location" in obj && "semanticUri" in obj.location) {
		curLoc = obj.location.semanticUri;
	}

	// empty select for deleting
	var opt = createOptionAndSelect(obj.openHabName, "", " ", curLoc == "");
	sel.appendChild(opt);

	for (k = 0; k < locations.length; k++) {
		var select = locations[k].semanticUri == curLoc;
		opt = createOptionAndSelect(obj.openHabName, locations[k].semanticUri,
				locations[k].realLocationName, select);
		sel.appendChild(opt);
	}

	cell.appendChild(sel);
	row.appendChild(cell);
}

// select = true -> selected entry
function createOptionAndSelect(thingName, locUri, text, select) {
	var opt = document.createElement('option');
	var txt = document.createTextNode(text);
	var data = {
		thing : thingName,
		loc : locUri
	};

	opt.setAttribute("data-value", JSON.stringify(data));
	if (select) {
		opt.setAttribute("selected", "");
	}

	opt.appendChild(txt);
	return opt;
}

function addThingPoiBtn(thingName, poiStr, row) {
	var cell = document.createElement('td');

	// set to current btn
	var setBtn = document.createElement('button');
	var node = document.createTextNode("set to current");

	setBtn.setAttribute("class", "btn btn-sm btn-primary");
	setBtn.setAttribute("name", "setThingPoiBtn");
	setBtn.setAttribute("value", thingName);
	setBtn.appendChild(node);

	// del btn
	var delBtn = document.createElement('button');
	node = document.createTextNode("delete");

	delBtn.setAttribute("name", "deleteThingPoiBtn");
	delBtn.setAttribute("class", "btn btn-sm btn-danger");
	delBtn.setAttribute("value", thingName);
	delBtn.appendChild(node);

	// robot move btn
	var moveBtn = document.createElement('button');
	node = document.createTextNode("move robot");
	moveBtn.setAttribute("name", "moveRobotToThingPoiBtn");
	moveBtn.setAttribute("class", "btn btn-sm btn-warning");
	moveBtn.setAttribute("value", poiStr);

	moveBtn.appendChild(node);

	cell.appendChild(setBtn);
	cell.appendChild(delBtn);
	cell.appendChild(moveBtn);
	row.appendChild(cell);
}

function addedEmptyRowFromSub(property, sub, data, row) {
	if (property in data) {
		return false;
	}
	addValueToRow(row, "");
	return true;
}

function addedEmptyRow(property, data, row) {
	if (property in data) {
		return false;
	}
	addValueToRow(row, "");
	return true;
}

function addValueToRow(row, value) {
	var cell = document.createElement('td');
	var cont = document.createTextNode(value);
	cell.appendChild(cont);
	row.appendChild(cell);
}

// removes all childs from the parent
function removeAllChilds(root) {
	while (root.firstChild)
		root.removeChild(root.firstChild);
}

/*******************************************************************************
 * ******************************** Status Messages
 * ***************************************
 ******************************************************************************/

function showSuccess(message) {
	showStatusMessage(message, false);
}

function showFailedShort(message) {
	showStatusMessage(message, true);
}

function showFailed(jqXHR, textStatus, errorThrown) {
	showStatusMessage(errorThrown, true);
	console.log("Error: " + errorThrown + ": " + jqXHR.responseText);
}

function handleResponseError(jqXHR, textStatus, errorThrown) {
	console.log("Error: " + errorThrown + ": " + jqXHR.responseText);
}

function showStatusMessage(message, isError) {
	var container = document.getElementById("status_box");
	container.setAttribute("class", "");

	if (isError)
		container.setAttribute("class", "alert alert-danger");
	else
		container.setAttribute("class", "alert alert-success");

	container.style.visibility = 'visible';
	container.innerHTML = message;

	setTimeout(function() {
		container.style.visibility = 'hidden'
	}, 5000);
}

/*******************************************************************************
 * ******************************** Constructor
 * ***************************************
 ******************************************************************************/

function createPoi(position, orientation) {
	return {
		position : position,
		orientation : orientation
	};
}

function poiToString(poi) {
	if (!("orientation" in poi) || !("position" in poi) || poi.position == ""
			|| poi.position === undefined || poi.orientation == ""
			|| poi.orientation === undefined) {
		return "";
	}
	return "P: " + poi.position + " O: " + poi.orientation;
}
