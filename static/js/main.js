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
function calculateSummary(account, absoluteAmount, del){
	accounts[account].fund += absoluteAmount;
	accounts[account].current += absoluteAmount;

	var target;

	if (!del){
		target = absoluteAmount > 0 ? "credit" : "debit";
	} else {
		target = absoluteAmount < 0 ? "credit" : "debit";
	}

	accounts[account]["current-"+target] += absoluteAmount;

	$("#" + account + "-total").html(formatMoney(accounts[account].fund));

	function formatSummaryTab(tabname){
		var amount = accounts[account][tabname];

		var tab = $("#" + account + "-" + tabname);
		tab.html(formatMoney(amount));

		if (amount < 0) tab.addClass("debit");
		else tab.removeClass("debit");
	}

	formatSummaryTab("current");
	formatSummaryTab("current-"+target);
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
				calculateSummary(account, -(flow * amount), true);
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

function createAggregate(entries, id_function, label_function, aggregate_function, value_function){
	var aggregate = {};

	if (!value_function) value_function = function(entry){return entry.amount;};
	if (!aggregate_function) aggregate_function = function(agg) {return agg.value;};

	for (var i in entries){
		var entry = entries[i];
		
		if ((entry.flow === -1) && (entry.category_id !== 20000)) {
			
			var a_id = id_function(entry);
			var val = value_function(entry);

			if (aggregate[a_id]){
				aggregate[a_id].value += val;
				aggregate[a_id].count++;
			} else {
				aggregate[a_id] = {
					"label": label_function(entry),
					"value": val,
					"count": 1,
					"id": a_id
				};
			}
		}
	}

	var result = {
		"labels": [],
		"data": [],
		"ids": [],
		"colors": []
	};


	var ids = Object.keys(aggregate).sort();

	for (var x in ids){
		var id = ids[x];

		result.labels.push(aggregate[id].label);
		result.ids.push(id);
		result.data.push(aggregate_function(aggregate[id]));
		result.colors.push(getRandomColor());
	}

	return result;
}

function createSortedAggregate(entries, id_function, label_function, value_function){
	if (!value_function) value_function = function(entry){return entry.amount;};

	var data = [0];
	var last_id= id_function(entries[0]);
	var labels = [label_function(entries[0])];
	var n = 0;

	for (var i in entries){
		var entry = entries[i];

		if ((entry.flow === -1) && (entry.category_id !== 20000)) {
			var a_id = id_function(entry);
			var val = value_function(entry);

			if (last_id === a_id){
				data[n] += val;
			} else {
				data.push(val);
				last_id = a_id;
				labels.push(label_function(entry));
				n++;
			}
		}
	}

	return {
		"labels": labels,
		"data": data,
	};
}

function buildTimelineChart(){
	var color = hsv_to_rgb(0, 0.6, 0.9);
	var result = createSortedAggregate(entries, function(entry){ 
					return entry.entry_date;
				}, function (entry){
					return entry.entry_date;
				});

	 TimelineChart(result.labels, result.data);
}

function getAmountOfWeekDays(date1, date2, weekday) {
	var dif = (7 + (weekday - date1.weekday())) % 7 + 1;
	var n = date2.diff(date1, "days") + 1;

	return Math.floor((n - dif) / 7) + 1;
}

function buildTimeDistChart(){
	var startDate = new moment(entries[0].entry_date);
	var endDate = new moment(entries[entries.length - 1].entry_date);

	var result = createAggregate(entries, function(entry){ 
					return moment(entry.entry_date).weekday();
				}, function (entry){
					return moment(entry.entry_date).format("dddd");
				}, function (agg){
					return Math.round(agg.value / getAmountOfWeekDays(startDate, endDate, agg.id));
				});
	BarChart(result.labels, result.data);
}

function buildCategoryChart(){
	var valueOption = $("#category-value-picker").val();
	var aggregate_function = null; 
	var chartType = "doughnut"; var formatFunction = null;
	var title; var groupCategory = false; var drilldown;

	switch(valueOption){
		case "total": title = "Category Distribution"; break;
		case "group": {
			groupCategory = true;
			title = "Group Category Distribution"; 
		}
		break;
		case "daily": {

			var startDate = new moment(entries[0].entry_date);
			var endDate = new moment(entries[entries.length - 1].entry_date);
			var days = endDate.diff(startDate, 'days') + 1;

			chartType = "bar";
			aggregate_function = function (agg){
				return agg.value / days;
			};

			title = "Daily Average";
		} break;
		case "price": {
			aggregate_function = function (agg){
				return agg.value / agg.count;
			};
			chartType = "bar";
			title = "Average Price Per Purchase";
		}
		break;
		case "frequency": {
			var startDate = new moment(entries[0].entry_date);
			var endDate = new moment(entries[entries.length - 1].entry_date);
			var days = endDate.diff(startDate, 'days') + 1;


			aggregate_function = function (agg){
				return agg.count / days;
			};
			chartType = "bar";
			formatFunction = "freq.day";
			title = "Purchase Frequency";
		}
		break;
	}

	var result = createAggregate(entries, function(entry){
					return entry.category_id;
				}, function(entry){
					return categories[entry.category_id].name;
				}, aggregate_function);	

	if (chartType === "bar"){
		BarChart(result.labels, result.data, formatFunction);
	} else {
		

		if (groupCategory){
			var data = result.data.map(function(v, i){ return [result.labels[i], v]; });


			var lastGroupId = null; var n = -1; var grouplist = []; drilldown = [];

			for (var x in result.ids){
				var id = result.ids[x];
				var g_id = Math.floor(id/100);

				if (g_id !== lastGroupId){
					lastGroupId = g_id;
					grouplist.push({
						"name": category_groups[g_id].name,
						"y": data[x][1],
						"drilldown": g_id
					});

					drilldown.push({
						"id": g_id,
						"data": [data[x]]
					});
					n++;
				} else {
					grouplist[n].y+=data[x][1];
					drilldown[n].data.push(data[x]);
				}
			}

			result.data = grouplist;
		} else {
			result.data = result.data.map(function(v, i){ return {name: result.labels[i], y: v}; });
		}

		DoughnutChart(result.data, formatFunction, drilldown);	
	}
}

function TimelineChart(labels, data, formatFunction){
	var yAxisOpt = {};
	var seriesName, labelFormatter = undefined;

	if (!formatFunction) formatFunction = "expense";

	var formats = formatFunction.split(".");

	switch (formats[0]){
		case "expense": {
			seriesName = "Expense";
			yAxisOpt.title = {
				text: "Rupiah"
			};

			labelFormatter =  function () { return formatMoney(this.y);};
		}
		break;
	}


	$('#chart-wrapper').highcharts({
		chart: {
			zoomType: 'x'
		},
		title: {
			text: ""
		},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats: {
	           day: '%d %b %Y'    //ex- 01 Jan 2016
	        }
		},
		yAxis: yAxisOpt,
		//tooltip: {enabled: false},
		plotOptions: {
			line:{
				marker: {
                    radius: 2
                },
                lineWidth: 1,
			}
		},
		series: [
			{
				name: seriesName,
				data: data.map(function(v,i){ 
					return [moment.utc(labels[i]).valueOf(), v];
				})
			}
		]
	});

	$("#chart-wrapper svg>text").last().hide();
}


function BarChart(labels, data, formatFunction){
	var yAxisOpt = {};
	var seriesName, labelFormatter;

	if (!formatFunction) formatFunction = "expense";

	var formats = formatFunction.split(".");

	switch (formats[0]){
		case "expense": {
			seriesName = "Expense";
			yAxisOpt.title = {
				text: "Rupiah"
			};

			labelFormatter = formatMoney;
		}
		break;
		case "freq": {
			seriesName = "Frequency";
			yAxisOpt.labels = {
				formatter: function () { return frequencyFormat(this.value, formats[1]);}
			};

			labelFormatter =  function (val) { return frequencyFormatShort(val, formats[1]);};

			yAxisOpt.title = {
				text: ""
			};
		}
		break;
	}


	$('#chart-wrapper').highcharts({
		chart: {
			type: 'column'
		},

		title: {
			text: ""
		},

		xAxis: {
			categories: labels
		},
		yAxis: yAxisOpt,
		plotOptions: {
			column:{
				dataLabels: {
					enabled: true,
					formatter: function () { return labelFormatter(this.y);},
				}
			}
		},

		tooltip: {
			// formatter: function() {
			// 	return this.x + '<br/><span style="color:'+ this.series.color +'">\u25CF</span> ' + this.series.name + ": <b>" + labelFormatter(this.y) + "</b>" ;
			// }
			enabled: false
		},


		series: [
			{
				name: seriesName,
				data: data
			}
		]
	});
	$("#chart-wrapper svg>text").last().hide();
}

function DoughnutChart(data, formatFunction, drilldown){
	var seriesName, labelFormatter = undefined;

	if (!formatFunction) formatFunction = "expense";

	var formats = formatFunction.split(".");

	switch (formats[0]){
		case "expense": {
			seriesName = "Expense";
			labelFormatter = percentageFormat;
		}
		break;
	}


	var options = {
		chart: {
			type: 'pie'
		},
		title: {
			text: "",
		},
		plotOptions: {
			pie:{
				dataLabels: {
					enabled: true,
					formatter: function () { return this.point.name + ": " + labelFormatter(this.point.percentage);},
				},
				showInLegend: true
			}
		},

		tooltip: {
			enabled: false
		},

		series: [
			{
				name: seriesName,
				data: data,
			}
		]
	};

	if (drilldown){
		options.drilldown = {
			series: drilldown
		};
	}

	$('#chart-wrapper').highcharts(options);
	$("#chart-wrapper svg>text").last().hide();
}