var countER;
SEARCH_TYPE = "path-subresults";	//second step is "path-final-results"

var input, selectBar;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "inputbar");
	
	makeSTypes("selectBar", false);
	makeSTypes("triType", false);

	input = document.getElementById("inputbar");
	selectBar = document.getElementById("selectBar");	
});

var _subterms; //flag for if subterms are included
var _type; //type of B terms

var triangleTerm;
function triangleSearch(){
	if (input.value == ""){
		return;
	}
	$(displayText).text("");
	$("#results").hide();
	$("#show-subterms").hide();
	showLoader();
	$("#path-subresults").hide();

	triangleTerm = getSelfOrSynonym(input.value);
	_type = selectBar.value;
	
	//console.log(term); console.log(type);	
	
	_subterms = checkbox.checked;
	if(_subterms){
		queryNeo4j(getSubtermsPayload(triangleTerm),findTriangleSubTerms);
	}else{
		queryNeo4j(getMentionsByTypePayload(triangleTerm, _type),triangleSearchOnSuccess);
	}	
}
var stack, newStack;

function triangleSearchOnSuccess(data){
	console.log("Finished Search");
	
	stack = new ThornStack();
		
	addTermOrSubterm(stack, data);

	showSubresults();
}	
	
function setFinishSearchHandler(){
	var selectBar2 = document.getElementById("triType");
	
	var button = document.getElementById("finish-search");
	button.onclick = function(){
		if ($(tableform).find(":checked").length ==0){
			return;
		}
		showLoader()
	
		var checkedTerms = [];
		var checkedString = "Your B Terms: ";
		var term = stack.first;
		var csvName = "";
		for(var i=0; i <stack.length;i++){
			if(term.isSelected){
				checkedTerms.push(term);
				checkedString = checkedString + term.name + ", ";
				csvName = csvName + "_" + term.name;
			}
			if(term.right==null){
				break;
			}
			term = term.right;
		}
		checkedString += " Your C Term Type: " + selectBar2.value;
		$(displayText).text(checkedString);
		countER = checkedTerms.length;
		console.log(countER);
		for(var j=0;j<checkedTerms.length;j++){
			console.log("Post Request");
			term = checkedTerms[j];
			postRequest(term.name,selectBar2.value,newStack,csvName)
		}
	};
}
	
	
function showSubresults(){
	SEARCH_TYPE = "path-subresults";
	//makeFilters(stack, "");
	makeTables(stack,tableLimit,0, SEARCH_TYPE);

	$(loader).hide();
	$("#results").show();
	$("#path-subresults").show();
	$("#downloadform").hide();
	//$("#filterSection").hide();
	$(displayText).text("Choose the B Terms you want to search with");

	newStack = new ThornStack();
	setFinishSearchHandler();	
}


function findTriangleSubTerms(data){
	//console.log(data);
	subTerms = [];
	subTermCount = 0;
	var data2=data["results"][0]["data"];
	subTermMax = data2.length + 1;
	
	stack = new ThornStack();


	queryNeo4j(getMentionsByTypePayload(triangleTerm, _type), addTriangleSubTerm);
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		subTerms.push(name);
		queryNeo4j(getMentionsByTypePayload(name, _type), addTriangleSubTerm);
	}	
}


function getMentionsByTypePayload(name, type){
	var statement;
	if(type == "Disease" || type == "Other" || type == "Chemical"){
		statement = "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{type:{type}}) return m, a";			
	}else if (type=="Drug"){
		statement = "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{isDrug:{type}}) return m, a";
		type="true";
	}else{
		statement = "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{stype:{type}}) return m, a";
	}	
	
	return JSON.stringify({
		"statements" : [{
			"statement" : statement,
			"parameters" : {"name": name, "type":type}
		}]			
	});
}

function addTriangleSubTerm(data){	
	addTermOrSubterm(stack, data);
	console.log("FINISHED SUBTERM or TERM");
	subTermCount++;
	
	if(subTermCount==subTermMax){
		showSubresults();
	}
}

function postRequest(term,type,stack,csvName){
	var input = document.getElementById("inputbar");
	var selectBar = document.getElementById("selectBar");
	var downloadform = document.getElementById("downloadform");
	
	var data = "";
	if(type == "Disease" || type == "Other" || type == "Chemical"){		
		data = JSON.stringify({		
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[]-(a)-[]-(m:Term{type:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
			}]       
		});
	}else{
		data = JSON.stringify({			
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[]-(a)-[]-(m:Term{stype:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
			}]       
		});
	}
		
	$.ajax({ //443 works.
		url: CORS+"http://chemotext.mml.unc.edu:7474/db/data/transaction/commit", //GITHUB PAGES			
		accepts: "application/json; charset=UTF-8",
		dataType:"json",
		contentType:"application/json",		
		data: data,
		type:"POST",
		success:function(data,xhr,status)
		{
			console.log("Finished Search");
			addTermOrSubterm(stack, data);
			
			countER--;
			//$(displayText).text("Percent Done: " + (100-(countER*20))); 
			//console.log("Count: "+countER);
			if(countER==0){
				console.log("FINISHED: "+stack.length)
				SEARCH_TYPE = "path-final-results";
				showResult(stack, input.value+"_Path"+csvName, _subterms, SEARCH_TYPE);
				$("#path-subresults").hide();
				$("#downloadform").show();
				$("#show-subterms").hide();
			}	
		 },
		error:function(xhr,err,msg){
			console.log(err+": "+msg);	
		}
	});
}

function makePathSubresultsTable(stack, index, indexLimit){
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}
	
	var $tbody = $(tableform).find("tbody");
	$(tableform).find("tr").remove();	
	
	$tbody.append('<tr><th class="countCol"></th><th>Terms</th><th class="countCol">Count</th></tr>');
	
	/*append TR: 
		<tr>
			<td class="countCol">
				<input type="checkbox" [checked] name="name">		
			</td>
			<td>name</td>
			<td class="countCol">
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/

	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		
		$tr = $("<tr/>");
		$tr.append('<td class="countCol"><input '+
			(node.isSelected?'checked ':'') +
			'type="checkbox" name="'+node.name+'"></td>');
		$tr.append('<td>'+node.name+'</td>');
		$tr.append('<td>'+node.count+'</td>');
		$tbody.append($tr);
		
		node = node.right;
	}
	
	$("td input[type='checkbox']").click(function(){
		var term = stack.get(this.name);
		term.isSelected = this.checked;
	});
}	


function makePathFinalResultsTable(stack, index, indexLimit){
	
	//skip up to 'index'
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	
	}
	
	$(tableform).find("tr").remove();	
	var $tbody = $("#tableform").find("tbody");
	
	$tbody.append('<tr><th>Terms</th><th class="countCol">Count</th></tr>');
	
	/*append TR: 
		<tr>
			<td>name</td>
			<td class="countCol">
				<button type="button" class="articleButton">count</button>
			</td>
		</tr>
	*/
	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		
		$tr = $("<tr/>");
		$tr.append('<td>'+node.name+'</td>');
		$buttonTd = $("<td/>", {"class": "countCol"}).append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: node.count, 
			click: function(node){ return function(){openArticleList(node);} }(node)
		}));
		$tbody.append($tr.append($buttonTd));

		node = node.right;
	}
}

