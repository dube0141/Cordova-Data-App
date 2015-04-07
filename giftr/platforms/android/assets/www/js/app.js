var db = null;
var person_id, occ_nameGlobal;

var app = {
	loadRequirements: 0,
	init: function () {
		document.addEventListener("deviceready", app.onDeviceReady, false);
		document.addEventListener("DOMContentLoaded", app.onDomReady);
	},
	onDeviceReady: function () {
		app.loadRequirements++;
		console.log("Device is ready.");
		if (app.loadRequirements === 2) {
			app.start();
		}
	},
	onDomReady: function () {
		app.loadRequirements++;
		console.log("DOM is ready.");
		if (app.loadRequirements === 2) {
			app.start();
		}
	},
	start: function () {
		console.log("Connecting to database...");
		db = openDatabase('giftrDB', '', 'Giftr Database', 1048576);

		if (db.version == "") {
			console.info('First time running database... Creating new tables.');

			db.changeVersion("", "1.0",
				function (trans) {

					trans.executeSql("CREATE TABLE IF NOT EXISTS people(person_id INTEGER PRIMARY KEY AUTOINCREMENT, person_name TEXT)", [],
						function (tx, rs) {
							console.info("Table people created.");
						},
						function (tx, err) {
							console.info(err.message);
						});
					trans.executeSql("CREATE TABLE IF NOT EXISTS occasions(occ_id INTEGER PRIMARY KEY AUTOINCREMENT, occ_name TEXT)", [],
						function (tx, rs) {
							console.info("Table occasions created.");
						},
						function (tx, err) {
							console.info(err.message);
						});
					trans.executeSql("CREATE TABLE IF NOT EXISTS gifts(gift_id INTEGER PRIMARY KEY AUTOINCREMENT, person_id INTEGER, occ_id INTEGER, gift_idea TEXT, purchased BOOLEAN)", [],
						function (tx, rs) {
							console.info("Table gifts created.");
						},
						function (tx, err) {
							console.info(err.message);
						});
				},
				function (err) {
					console.info(err.message);
				},
				function () {
					addNavHandlers();
				});
		} else {
			console.log("Successfully connected to database!");
			navHandlers();
			loadData();
		}
	}
}

function loadData() {
	loadPeople();
	loadOccasions();
}

function navHandlers() {

	//show-hide pages
	var hammertime = new Hammer(document.body);
	hammertime.on('swipeleft', function (ev) {
		document.querySelector("#people-list").style.display = "none";
		document.querySelector("#occasion-list").style.display = "block";
	});
	hammertime.on('swiperight', function (ev) {
		document.querySelector("#people-list").style.display = "block";
		document.querySelector("#occasion-list").style.display = "none";
	});

	//Handle modal cancel button
	var btnCancel = document.querySelectorAll(".btnCancel");
	for (var i = 0; i < btnCancel.length; i++) {
		var hammertime = new Hammer(btnCancel[i]);
		hammertime.on('tap', function (ev) {
			document.querySelector("div[data-role='overlay']").style.display = "none";
			var modals = document.querySelectorAll("div[data-role='modal']");
			for (var i = 0; i < modals.length; i++) {
				modals[i].style.display = "none";
			}
		});
	}

	//All back button handlers
	var back1 = document.querySelector("#occasion-list .btnBack");
	var back2 = document.querySelector("#gifts-for-person .btnBack");
	var back3 = document.querySelector("#gifts-for-occasion .btnBack");

	var back1Tap = new Hammer(back1);
	back1Tap.on('tap', function (ev) {
		document.querySelector("#occasion-list").style.display = "none";
		document.querySelector("#people-list").style.display = "block";
	});

	var back2Tap = new Hammer(back2);
	back2Tap.on('tap', function (ev) {
		document.querySelector("#gifts-for-person").style.display = "none";
		document.querySelector("#people-list").style.display = "block";
	});

	var back3Tap = new Hammer(back3);
	back3Tap.on('tap', function (ev) {
		document.querySelector("#gifts-for-occasion").style.display = "none";
		document.querySelector("#occasion-list").style.display = "block";
	});

	//All 4 button handlers
	var button1 = document.querySelector("#people-list .btnAdd");
	var button2 = document.querySelector("#occasion-list .btnAdd");
	var button3 = document.querySelector("#gifts-for-person .btnAdd");
	var button4 = document.querySelector("#gifts-for-occasion .btnAdd");

	var button1Tap = new Hammer(button1);
	button1Tap.on('tap', function (ev) {
		document.querySelector("div[data-role='overlay']").style.display = "block";
		document.querySelector("#add-person").style.display = "block";
		addPerson();
	});

	var button2Tap = new Hammer(button2);
	button2Tap.on('tap', function (ev) {
		document.querySelector("div[data-role='overlay']").style.display = "block";
		document.querySelector("#add-occasion").style.display = "block";
		addOccasion();
	});

	var button3Tap = new Hammer(button3);
	button3Tap.on('tap', function (ev) {
		document.querySelector("div[data-role='overlay']").style.display = "block";
		document.querySelector("#person-gift").style.display = "block";
		addGiftForPerson();
	});

	var button4Tap = new Hammer(button4);
	button4Tap.on('tap', function (ev) {
		document.querySelector("div[data-role='overlay']").style.display = "block";
		document.querySelector("#occasion-gift").style.display = "block";
		addGiftForOccasion();
	});
}

function loadPeople() {
	var peopleList = document.querySelector("#people-list ul[data-role='listview']");

	db.transaction(function (trans) {
		trans.executeSql('SELECT * FROM people', [], transSuccess, transErr);

		function transSuccess(trans, results) {
			peopleList.innerHTML = "";
			for (var i = 0; i < results.rows.length; i++) {
				var li = document.createElement("li");

				li.innerHTML = results.rows.item(i).person_name;
				li.id = results.rows.item(i).person_id;
				peopleList.appendChild(li);

				var mc = new Hammer.Manager(li);
				mc.add(new Hammer.Tap({
					event: 'doubletap',
					taps: 2
				}));
				mc.add(new Hammer.Tap({
					event: 'singletap'
				}));
				mc.get('doubletap').recognizeWith('singletap');
				mc.get('singletap').requireFailure('doubletap');

				mc.on("doubletap", function (ev) {
					var p = ev.target;
					db.transaction(function (tr) {
						tr.executeSql("DELETE FROM people WHERE person_id = '" + p.id + "'", [],
							function (tx, rs) {
								console.info(p.innerHTML + " " + "has been deleted from the list.")
								loadPeople();
							},
							function (tx, err) {
								console.info(err.message);
							});
					});
				});
				mc.on("singletap", function (ev) {
					var p = ev.target;
					document.querySelector("#people-list").style.display = "none";
					document.querySelector("#gifts-for-person h2").innerHTML = "Gifts for " + p.innerHTML;
					document.querySelector("#gifts-for-person span").innerHTML = p.innerHTML;
					document.querySelector("#gifts-for-person").style.display = "block";
					person_id = p.id;
					loadGiftsForPerson();
				});
			}
		}
	});
}

function loadOccasions() {
	var occasionsList = document.querySelector("#occasion-list ul[data-role='listview']");

	db.transaction(function (trans) {
		trans.executeSql('SELECT * FROM occasions', [], transSuccess, transErr);

		function transSuccess(trans, results) {
			occasionsList.innerHTML = "";
			for (var i = 0; i < results.rows.length; i++) {
				var li = document.createElement("li");

				li.innerHTML = results.rows.item(i).occ_name;
				li.id = results.rows.item(i).occ_id;
				occasionsList.appendChild(li);

				var mc = new Hammer.Manager(li);
				mc.add(new Hammer.Tap({
					event: 'doubletap',
					taps: 2
				}));
				mc.add(new Hammer.Tap({
					event: 'singletap'
				}));
				mc.get('doubletap').recognizeWith('singletap');
				mc.get('singletap').requireFailure('doubletap');

				mc.on("doubletap", function (ev) {
					var p = ev.target;
					db.transaction(function (tr) {
						tr.executeSql("DELETE FROM occasions WHERE occ_id = '" + p.id + "'", [],
							function (tx, rs) {
								console.info(p.innerHTML + " " + "has been deleted from the list.")
								loadOccasions();
							},
							function (tx, err) {
								console.info(err.message);
							});
					});
				});
				mc.on("singletap", function (ev) {
					var p = ev.target;
					document.querySelector("#occasion-list").style.display = "none";
					document.querySelector("#gifts-for-occasion h2").innerHTML = "Gifts for " + p.innerHTML;
					document.querySelector("#gifts-for-occasion span").innerHTML = p.innerHTML;
					document.querySelector("#gifts-for-occasion").style.display = "block";
					occ_nameGlobal = p.innerHTML;
					loadGiftsForOccasion(p.innerHTML, p.id);
				});
			}
		}
	});
}

function loadGiftsForPerson() {
	var personGiftList = document.querySelector("#gifts-for-person ul[data-role='listview']");
	var modalList = document.querySelector("#person-gift #list-per-occ");

	db.transaction(function (trans) {
		trans.executeSql('SELECT * FROM occasions', [], transSuccess, transErr);

		function transSuccess(trans, results) {
			modalList.innerHTML = "";

			for (var i = 0; i < results.rows.length; i++) {

				var option = document.createElement("option");

				option.innerHTML = results.rows.item(i).occ_name;
				option.value = results.rows.item(i).occ_id;

				modalList.appendChild(option);
			}
		}
	});

	db.transaction(function (trans) {
		trans.executeSql('SELECT g.gift_idea, g.purchased, o.occ_name FROM gifts AS g INNER JOIN occasions AS o ON g.occ_id = o.occ_id WHERE person_id = ' + person_id + '', [], transSuccess, transErr);

		function transSuccess(trans, results) {
			personGiftList.innerHTML = "";

			for (var i = 0; i < results.rows.length; i++) {
				var li = document.createElement("li");
				li.id = results.rows.item(i).gift_idea;
				li.setAttribute("class", results.rows.item(i).occ_name);
				li.setAttribute("data-role", "s" + results.rows.item(i).purchased);
				li.innerHTML = results.rows.item(i).gift_idea + " - " + results.rows.item(i).occ_name;

				var mc = new Hammer.Manager(li);
				mc.add(new Hammer.Tap({
					event: 'doubletap',
					taps: 2
				}));
				mc.add(new Hammer.Tap({
					event: 'singletap'
				}));
				mc.get('doubletap').recognizeWith('singletap');
				mc.get('singletap').requireFailure('doubletap');

				mc.on("doubletap", function (ev) {
					var p = ev.target;

					db.transaction(function (tr) {
						tr.executeSql("DELETE FROM gifts WHERE gift_idea = '" + p.id + "'", [],
							function (tx, rs) {
								console.info(p.innerHTML + " " + "has been deleted from the list.")
								loadGiftsForPerson();
							},
							function (tx, err) {
								console.info(err.message);
							});
					});
				});
				mc.on("singletap", function (ev) {
					document.querySelector("div[data-role='overlay']").style.display = "block";
					document.querySelector("#gift-status").style.display = "block";
					addGiftStatus(ev.target);
				});
				personGiftList.appendChild(li);
			}
		}
	});
}

function loadGiftsForOccasion(personName, occ_id) {
	var occasionGiftList = document.querySelector("#gifts-for-occasion ul[data-role='listview']");
	var modalList = document.querySelector("#occasion-gift #list-per-occ");

	while (occasionGiftList.firstChild) {
		occasionGiftList.removeChild(occasionGiftList.firstChild);
	}

	db.transaction(function (trans) {
		trans.executeSql('SELECT * FROM people', [], transSuccess, transErr);

		function transSuccess(trans, results) {
			modalList.innerHTML = "";

			for (var i = 0; i < results.rows.length; i++) {

				var option = document.createElement("option");

				option.innerHTML = results.rows.item(i).person_name;
				option.value = occ_id;
				modalList.appendChild(option);
			}
		}
	});

	db.transaction(function (trans) {
		trans.executeSql('SELECT g.gift_idea, p.person_name, o.occ_name FROM gifts AS g INNER JOIN people AS p INNER JOIN occasions AS o WHERE g.person_id = p.person_id AND g.occ_id = o.occ_id', [], transSuccess, transErr);

		function transSuccess(trans, results) {
			for (var i = 0; i < results.rows.length; i++) {
				if (results.rows.item(i).occ_name === personName) {

					var li = document.createElement("li");

					li.innerHTML = results.rows.item(i).gift_idea + " - " + results.rows.item(i).person_name;
					li.id = results.rows.item(i).gift_idea;

					var mc = new Hammer.Manager(li);
					mc.add(new Hammer.Tap({
						event: 'doubletap',
						taps: 2
					}));
					mc.add(new Hammer.Tap({
						event: 'singletap'
					}));
					mc.get('doubletap').recognizeWith('singletap');
					mc.get('singletap').requireFailure('doubletap');

					mc.on("doubletap", function (ev) {
						db.transaction(function (tr) {
							tr.executeSql("DELETE FROM gifts WHERE gift_idea = '" + ev.target.id + "'", [],
								function (tx, rs) {
									console.info(ev.target.innerHTML + " " + "has been deleted from the list.")
									loadGiftsForOccasion(personName, occ_id);
								},
								function (tx, err) {
									console.info(err.message);
								});
						});
					});
					mc.on("singletap", function (ev) {
						var p = ev.target;
						console.log(p);
					});
					occasionGiftList.appendChild(li);
				}
			}
		}
	});
}

function addPerson() {
	var saveButton = document.querySelector("#add-person .btnSave");
	var personName = document.querySelector("#add-person #new-per-occ");

	var ap = new Hammer(saveButton);
	ap.on('tap', function (ev) {

		db.transaction(function (trans) {
			trans.executeSql("INSERT INTO people(person_name) VALUES('" + personName.value + "')", [],
				function (tx, rs) {
					console.info(personName.value + " " + "has been added to the list.");
					personName.value = null;
					loadPeople();
				},
				function (tx, err) {
					console.info(err.message);
				});
		});
	});
}

function addOccasion() {
	var saveButton = document.querySelector("#add-occasion .btnSave");
	var occasionName = document.querySelector("#add-occasion #new-per-occ");

	var ao = new Hammer(saveButton);
	ao.on('tap', function (ev) {
		db.transaction(function (trans) {
			trans.executeSql("INSERT INTO occasions(occ_name) VALUES('" + occasionName.value + "')", [],
				function (tx, rs) {
					console.info(occasionName.value + " " + "has been added to the list.");
					loadOccasions();
				},
				function (tx, err) {
					console.info(err.message);
				});
		});
	});
}

function addGiftForPerson() {
	var saveButton = document.querySelector("#person-gift .btnSave");
	var giftIdea = document.querySelector("#person-gift #new-idea");
	var modalList = document.querySelector("#person-gift #list-per-occ");

	var ao = new Hammer(saveButton);
	ao.on('tap', function (ev) {
		var gift_idea = giftIdea.value;
		var occ_id = modalList.options[modalList.selectedIndex].value;

		db.transaction(function (trans) {
			trans.executeSql("INSERT INTO gifts(person_id, occ_id, gift_idea, purchased) VALUES('" + person_id + "', '" + occ_id + "', '" + gift_idea + "', 0)", [],
				function (tx, rs) {
					loadGiftsForPerson();
				},
				function (tx, err) {
					console.info(err.message);
				});
		});
	});
}

function addGiftForOccasion() {
	var saveButton = document.querySelector("#occasion-gift .btnSave");
	var giftIdea = document.querySelector("#occasion-gift #new-idea");
	var modalList = document.querySelector("#occasion-gift #list-per-occ");

	var ao = new Hammer(saveButton);
	ao.on('tap', function (ev) {
		var gift_idea = giftIdea.value;
		var occ_id = modalList.options[modalList.selectedIndex].value;
		var person_name = modalList.options[modalList.selectedIndex].innerHTML;
		var person_id;

		db.transaction(function (trans) {
			trans.executeSql("SELECT * FROM people", [],
				function (tx, rs) {
					for (var i = 0; i < rs.rows.length; i++) {
						if (rs.rows.item(i).person_name === person_name) {
							person_id = rs.rows.item(i).person_id;
						}
					}
				},
				function (tx, err) {
					console.info(err.message);
				});
		});

		db.transaction(function (trans) {
			trans.executeSql("INSERT INTO gifts(person_id, occ_id, gift_idea, purchased) VALUES('" + person_id + "', '" + occ_id + "', '" + gift_idea + "', 0)", [],
				function (tx, rs) {
					loadGiftsForOccasion(occ_nameGlobal, occ_id);
				},
				function (tx, err) {
					console.info(err.message);
				});
		});
	});
}

function addGiftStatus(evTarg) {
	var saveButton = document.querySelector("#gift-status .btnSave");
	var radioYes = document.querySelectorAll("#gift-status #radioy");
	var radioNo = document.querySelectorAll("#gift-status #radion");
	
	var ao = new Hammer(saveButton);
	ao.on('tap', function (ev) {

		if (radioYes[0].checked) {
			db.transaction(function (trans) {
				trans.executeSql("UPDATE gifts SET purchased = 1 WHERE gift_idea = '" + evTarg.id + "'", [],
					function (tx, rs) {
						console.log(evTarg.id + " " + "has been purchased!");
						loadGiftsForPerson();
					},
					function (tx, err) {
						console.info(err.message);
					});
			});

		} else if (radioNo[0].checked) {
			db.transaction(function (trans) {
				trans.executeSql("UPDATE gifts SET purchased = 0 WHERE gift_idea = '" + evTarg.id + "'", [],
					function (tx, rs) {
						console.log(evTarg.id + " " + "is not yet purchased!");
						loadGiftsForPerson();
					},
					function (tx, err) {
						console.info(err.message);
					});
			});
		}
	});
}

// Database transaction errors
function transErr(err) {
	console.log(err);
}

app.init();