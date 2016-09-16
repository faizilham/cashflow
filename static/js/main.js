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

function resetForm(){
	$("#dateinput").datepicker("setDate", new Date());
	$("#amountinput").val("");
	$("#detailsinput").val("");

	var categoryinput = $("#categoryinput");
	categoryinput.val("");
	changeFlowChoice();
}

function reloadList(data){
	$.get("/entrylist", data || {}, function(result){
		if (!data) $(".entry").remove();

		$(result).insertAfter($("#trform"));
	});
}

function deleteRow(_id){
	$("#entry" + _id).remove();
}

function submitForm(){

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
			resetForm();

			var firstEntry = $(".entry").first();
			var minid = firstEntry.data("id");
			var datefirst = firstEntry.find(".entry-date").text();

			reloadList({"minid": minid, "datefirst": datefirst});
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

function toggleSummary(btn){
	var closedText = "Open Summary";
	var openText = "Close Summary";

	var btn = $(btn);
	var summary = $(".summary");

	if (btn.html() === closedText){
		btn.html(openText);
		summary.removeClass("hidden");
	} else {
		btn.html(closedText);
		summary.addClass("hidden");
	}
}