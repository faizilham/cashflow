// functions

function formatMoney(amount){
	var negative = false;
	if (amount < 0){
		negative = true;
		amount = -amount;
	}

	stramount = "";
	while (amount >= 1000) {
		thousands = String(amount % 1000)

		if (thousands.length == 2) thousands = "0" + thousands
		else if (thousands.length == 1) thousands = "00" + thousands

		stramount = "," + thousands + stramount
		amount = Math.floor(amount / 1000)
	}

	stramount = "Rp. " + amount + stramount;

	if (negative){
		stramount = "(" + stramount + ")";
	}

	return stramount;
}

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

function scrollCashflow(last){
	$(".cashflow").scrollTop(last.position().top);
}

function resetInsertForm(){
	$("#dateinput").datepicker("setDate", new Date());
	$("#amountinput").val("");
	$("#detailsinput").val("");

	var categoryinput = $("#categoryinput");
	categoryinput.val("");
	changeFlowChoice();

	categoryinput.data('selectpicker').$button.focus();
	categoryinput.parent().find("input").val("");
}

function reloadList(last_id, last_date, new_date){
	var data = null;

	if (new_date && (new Date(last_date) <= new Date(new_date))){
		data = {"minid": last_id, "datefirst": last_date}
	}

	$.get("/entrylist", data || {}, function(result){
		if (!data) $(".entry").remove();

		var newEntry = $(result);

		newEntry.insertBefore($("#tranchor"));
		scrollCashflow(newEntry);
	});
}

function deleteRow(_id){
	$("#entry" + _id).remove();
}

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

	$("#entryForm").prop("disabled", true);

	$.post("/api/entries", {
		"date": date, "account": account, "flow": flow,
		"category": category, "amount": amount, "details": details
	}, function(data){
		$("#entryForm").prop("disabled", false);

		if (data.message) {
			alert("Error: " + data.message);
		} else {
			var absoluteAmount = flow * amount;

			calculateSummary(account, absoluteAmount);
			resetInsertForm();

			var firstEntry = $(".entry").last();
			var minid = firstEntry.data("id");
			var datefirst = firstEntry.find(".entry-date").text();

			reloadList(minid, datefirst, date);
		}
					
	}, "json");



	return false;
}

function deleteEntry(_id, account, absoluteAmount){
	if (confirm("Delete this entry?")){
		$.post("/api/entries/" + _id + "/delete", {}, function(data){
			if (data.message) {
				alert(data.message);
			} else {
				calculateSummary(account, -absoluteAmount);
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
			calculateSummary(account_from, -amount);
			calculateSummary(account_to, amount);
			resetInsertForm();

			$("#date-transfer").datepicker("setDate", new Date());
			$("#amount-transfer").val("").focus();
			$("#details-transfer").val("");
			$("#account-from-transfer").val("From: Cash").selectpicker('refresh');
			$("#account-to-transfer").val("To: Cash").selectpicker('refresh');

			var firstEntry = $(".entry").last();
			var minid = firstEntry.data("id");
			var datefirst = firstEntry.find(".entry-date").text();

			reloadList(minid, datefirst, date);
		}
					
	}, "json");



	return false;
}

function chooseAction(actiontype){
	$(".traction").addClass("hidden");
	$("#tr"+actiontype).removeClass("hidden");
}