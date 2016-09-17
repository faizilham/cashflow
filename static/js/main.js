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

}

function buildTimelineChart(){
	var data_daily_debit = [0];
	var data_labels = [entries[0].entry_date];
	var lastDate = entries[0].entry_date;
	var n = 0;

	for (i in entries){
		var entry = entries[i];

		if ((entry.flow === -1) && (entry.category_id !== 20000)) {
			if (entry.entry_date === lastDate){
				data_daily_debit[n] += entry.amount;
			} else {
				data_daily_debit.push(entry.amount);
				lastDate = entry.entry_date;
				data_labels.push(lastDate);
				n++;
			}
		}
	}

	new Chart($("#stat"), {
		"type":"line",
		"data": {
			"labels": data_labels,
			"datasets":[
				{
					"label": "expense",
					"data": data_daily_debit,
					"backgroundColor": "rgba(0,0,0,0)",
					"borderColor": "rgba(255,0,0,0.5)"
				}
			]
		},
		"options": statChartOptions				
	});
}