
/**
 * Update the issue list
 */
function updateIssueList(){
	var _self = _init_();
	
	// Get last update time
	var lastUpdate = (function() {
		try{  return new Date(_self.range.lastUpdate.getValue()) }
		catch(e){ return null }
	})();
	
	Logger.log(_self.FIREBASE_ISSUE_FEED);
	
	// Get Firebase status feed
	var response = UrlFetchApp.fetch(_self.FIREBASE_ISSUE_FEED, {
		muteHttpExceptions: true
	});
	
	/**
	 * @type {IssueFeed}
	 */
	var issues;
	
	// Decode response
	try {
		issues = JSON.parse(response.getContentText());
	}
	catch(e){
		return new Error('Invalid JSON feed');
	}
	
	// Build response update since last update
	var issueArray = [];
	var latestUpdate = 0;
	
	for (var i = 0; i < issues.length; i++){
		var issue = issues[i];
		
		// Aggregate issues
		var info = '';
		for (var j = 0; j < issue.updates.length; j++){
			info += issue.updates[j].when +' - '+ issue.updates[j].text +'\n'
		}
		
		
		issueArray.push([
			issue.begin,
			issue.external_desc,
			_self.FIREBASE_BASE_LINK + issue.uri,
			issue.service_name,
			info
		]);
		
		var date = new Date(issue.modified);
		
		if (date > latestUpdate){
			latestUpdate = date;
		}
	}
	
	// Write the result
	SpreadsheetUtils.writeArray(_self.sheets.issues, 'A4', issueArray);
	
	// Update timestamp
	_self.range.lastUpdate.setValue(latestUpdate.toISOString());
}


/**
 * Check the XML issue feed and email if needed 
 */
function checkXML_feed(){
	var _self = _init_();
	
	// fetch the XML feed
	UrlFetchApp.fetch(_self.FIREBASE_ISSUE_FEED, {
		muteHttpExceptions: true
	});
	
	
	
	
}

