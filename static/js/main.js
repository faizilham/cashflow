// functions

/**** TEXTBOX VALIDATE ****/
function validateDateTextbox(e){
	if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57) && e.which != 45) {
		return false;
	} else {
		return true;
	}
}

function validateNumberTextbox(e){
	if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
		return false;
	} else {
		return true;
	}
}

/**** VIEW CHANGER ****/
function calculateSummary(account, absoluteAmount){
	var monthly = $("#" + account + "-monthly");

	accounts[account].fund += absoluteAmount;
	accounts[account].current += absoluteAmount;

	$("#" + account + "-total").html(formatMoney(accounts[account].fund));
	monthly.html(formatMoney(accounts[account].current));

	
	if (accounts[account].current < 0){
		monthly.addClass("debit");
	} else {
		monthly.removeClass("debit");
	}
}

function changeFlowChoice() {
	var enabledType = $("#flowinput").val();
	var disabledType = -enabledType;

	var categoryinput = $("#categoryinput");


	categoryinput.find("[data-flowtype='" + enabledType + "']").prop("disabled", false)
				 .show();

	categoryinput.find("[data-flowtype='" + disabledType + "']").prop("disabled", true)
				 .hide();

	categoryinput.val("");
	categoryinput.selectpicker('refresh');
}

function scrollCashflow(last){
	$(".cashflow").scrollTop(last.position().top);
}

function refreshEntries(last_id, last_date, new_date){
	var data = null;

	if (new_date && (new Date(last_date) <= new Date(new_date))){
		data = {"minid": last_id, "datefirst": last_date}
	}

	$.get("/api/entries", data || {}, function(result){

		if(!result.data) { return alert("Error: " + result.message);}

		if (!data) {
			$(".entry").remove();
			entries = result.data;
		} else {
			Array.prototype.push.apply(entries, result.data);
		}

		var newEntry = $(Handlebars.templates.cashflow({
			"categories": categories, "entries": result.data
		}));

		newEntry.insertBefore($("#tranchor"));
		scrollCashflow(newEntry);

		redrawChart();
	});
}

function deleteRow(_id){
	$("#entry" + _id).remove();
	var i = findWithAttr(entries, "id", _id);

	if (i > -1) entries.splice(i, 1);

	redrawChart();
}

function chooseAction(actiontype){
	$(".traction").addClass("hidden");
	$("#tr"+actiontype).removeClass("hidden");
}

/**** API CALL ****/

function submitInsert(){
	var date = $("#dateinput").val();
	var account = $("#accountinput").val();
	var flow = $("#flowinput").val();
	var category = $("#categoryinput").val();
	var amount = $("#amountinput").val();
	var details = $("#detailsinput").val();

	if (!$.isNumeric(amount) || amount <= 0){
		alert("Invalid amount");
		return false;
	} else if (isNaN(new Date(date).getTime())) {
		alert("Invalid date format");
		return false;
	} else if (!category) {
		alert("Category must not empty");
		return false;
	}

	amount = parseInt(amount);

	//console.log(date, account, flow, category, amount, details);

	$("#entryForm").prop("disabled", true);

	$.post("/api/entries", {
		"date": date, "account": account, "flow": flow,
		"category": category, "amount": amount, "details": details
	}, function(data){
		$("#entryForm").prop("disabled", false);

		if (data.message) {
			alert("Error: " + data.message);
		} else {
			// recalculate summary
			calculateSummary(account, flow * amount);

			// reset form
			$("#dateinput").val(moment().format("YYYY-MM-DD"));
			$("#amountinput").val("");
			$("#detailsinput").val("");

			var categoryinput = $("#categoryinput");
			categoryinput.val("");
			changeFlowChoice();

			categoryinput.data('selectpicker').$button.focus();
			categoryinput.parent().find("input").val("");

			// reload list
			var firstEntry = $(".entry").last();
			var minid = firstEntry.data("id");
			var datefirst = firstEntry.find(".entry-date").text();

			refreshEntries(minid, datefirst, date);
		}
					
	}, "json");

	return false;
}

function deleteEntry(_id, account, flow, amount){
	if (confirm("Delete this entry?")){
		$.post("/api/entries/" + _id + "/delete", {}, function(data){
			if (data.message) {
				alert(data.message);
			} else {
				calculateSummary(account, -(flow * amount));
				deleteRow(_id);
			}
						
		}, "json");	
	}
}

function submitTransfer(){
	var date = $("#date-transfer").val();
	var account_from = $("#account-from-transfer").val();
	var account_to = $("#account-to-transfer").val();
	var amount = $("#amount-transfer").val();
	var details = $("#details-transfer").val();

	if (!$.isNumeric(amount) || amount <= 0){
		alert("Invalid amount");
		return false;
	} else if (isNaN(new Date(date).getTime())) {
		alert("Invalid date format");
		return false;
	} else if (account_from === account_to) {
		alert("Account 'from' and 'to' must be different");
		return false;
	}

	amount = parseInt(amount);

	//console.log(date, account_from, account_to, amount, details);

	$("#transferForm").prop("disabled", true);

	$.post("/api/entries/transfer", {
		"date": date, "account_from": account_from, "account_to": account_to,
		"amount": amount, "details": details
	}, function(data){
		$("#transferForm").prop("disabled", false);

		if (data.message) {
			alert("Error: " + data.message);
		} else {
			// recalculate summary
			calculateSummary(account_from, -amount);
			calculateSummary(account_to, amount);

			// reset transfer form
			$("#date-transfer").val(moment().format("YYYY-MM-DD"));
			$("#amount-transfer").val("").focus();
			$("#details-transfer").val("");
			$("#account-from-transfer").val("From: Cash").selectpicker('refresh');
			$("#account-to-transfer").val("To: Cash").selectpicker('refresh');


			// reload list
			var firstEntry = $(".entry").last();
			var minid = firstEntry.data("id");
			var datefirst = firstEntry.find(".entry-date").text();

			refreshEntries(minid, datefirst, date);
		}
					
	}, "json");

	return false;
}

/**** CHART BUILDER ****/
var statChartOptions = {
	"scales": {
		"yAxes": [{
			"ticks": {
				"beginAtZero":true,
				"callback": formatMoney
			}
		}]
	},

	"tooltips": {
		"callbacks": {
			"label": function(tooltipItems, data) { return formatMoney(tooltipItems.yLabel);}
		}
	}
};


function redrawChart(){
	$("#stat").remove();
	$("#canvas-wrapper").html('<canvas id="stat"></canvas>');

	switch($("#chart-picker").val()){
		case "timeline": buildTimelineChart(); break;
		case "timedist": buildTimeDistChart(); break;
		case "category": buildCategoryChart(); break;
	}
}



function hsv_to_rgb(h, s, v){
	var h_i = Math.floor(h*6);
	var f = h*6 - h_i;

	var p = v * (1 - s);
	var q = v * (1 - f*s);
	var t = v * (1 - (1 - f) * s);
	var rgb;

	switch(h_i){
		case 0: rgb = [v, t, p]; break;
		case 1: rgb = [q, v, p]; break;
		case 2: rgb = [p, v, t]; break;
		case 3: rgb = [p, q, v]; break;
		case 4: rgb = [t, p, v]; break;
		case 5: rgb = [v, p, q]; break;
	}

	return "#" + rgb.map(function(c){return Math.floor(c*256).toString(16);}).join("");
}

function getRandomColor() {
    var phi_conjugate = 0.618033988749895;
    var h = (Math.random() + phi_conjugate) % 1;
    var s = 0.7
    var v = 0.8 + (Math.random()*0.1);

    return hsv_to_rgb(h, s, v);
}

function createAggregate(entries, aggregate_function, label_function, color_function, value_function){
	var aggregate = {};
	var sum = 0;

	if (!color_function) color_function = getRandomColor;
	if (!value_function) value_function = function(entry){return entry.amount;};

	for (var i in entries){
		var entry = entries[i];
		
		if ((entry.flow === -1) && (entry.category_id !== 20000)) {
			
			var a_id = aggregate_function(entry);
			var val = value_function(entry);

			if (aggregate[a_id]){
				aggregate[a_id].value += val;
			} else {
				aggregate[a_id] = {
					"label": label_function(entry),
					"value": val
				};
			}

			sum += val;
		}
	}

	var result = {
		"labels": [],
		"data": [],
		"colors": [],
		"sum": sum
	};


	var ids = Object.keys(aggregate).sort();

	for (var x in ids){
		var id = ids[x];

		result.labels.push(aggregate[id].label);
		result.data.push(aggregate[id].value);
		result.colors.push(color_function(aggregate[id], sum));
	}

	return result;
}

function createSortedAggregate(entries, aggregate_function, label_function, value_function){
	if (!value_function) value_function = function(entry){return entry.amount;};

	var data = [0];
	var last_id= aggregate_function(entries[0]);
	var labels = [label_function(entries[0])];
	var sum = 0; n = 0;

	for (var i in entries){
		var entry = entries[i];

		if ((entry.flow === -1) && (entry.category_id !== 20000)) {
			var a_id = aggregate_function(entry);
			var val = value_function(entry);

			if (last_id === a_id){
				data[n] += val;
			} else {
				data.push(val);
				last_id = a_id;
				labels.push(label_function(entry));
				n++;
			}

			sum += val;
		}
	}

	return {
		"labels": labels,
		"data": data,
		"sum": sum
	};
}

function buildTimelineChart(){
	var color = hsv_to_rgb(0, 0.6, 0.9);
	var result = createSortedAggregate(entries, function(entry){ 
					return entry.entry_date;
				}, function (entry){
					return entry.entry_date;
				});

	new Chart($("#stat"), {
		"type":"line",
		"data": {
			"labels": result.labels,
			"datasets":[
				{
					"label": "expense",
					"data": result.data,
					"backgroundColor": "rgba(0,0,0,0)",
					"borderColor": color
				}
			]
		},
		"options": statChartOptions				
	});
}

function buildTimeDistChart(){
	var color = hsv_to_rgb(0, 0.6, 0.9);
	var result = createAggregate(entries, function(entry){ 
					return moment(entry.entry_date).format("d");
				}, function (entry){
					return moment(entry.entry_date).format("dddd");
				});

	new Chart($("#stat"), {
		"type":"bar",
		"data": {
			"labels": result.labels,
			"datasets":[
				{
					"label": "Expense",
					"data": result.data,
					"backgroundColor": color,
				}
			]
		},
		"options": statChartOptions				
	});
}

function buildCategoryChart(){

	var result = createAggregate(entries, function(entry){
					return entry.category_id;
				}, function(entry){
					return categories[entry.category_id].name;
				});

	new Chart($("#stat"), {
		"type":"doughnut",
		"data": {
			"labels": result.labels,
			"datasets":[
				{
					"data": result.data,
					"backgroundColor": result.colors,
					"sum": result.sum
				}
			]
		},
		"options": {
			"tooltips": {
				"callbacks": {
					"label": function(tooltipItems, data) { 
						var dataset = data.datasets[tooltipItems.datasetIndex];
						var amount = dataset.data[tooltipItems.index];
						var percentage = Math.round(100 * amount / dataset.sum);
						var label = data.labels[tooltipItems.index];

						return label + ": " + formatMoney(amount) + " (" + percentage +"%)";
					}
				}
			}
		}
	});
}