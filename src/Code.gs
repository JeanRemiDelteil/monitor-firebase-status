
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
 * @typedef {{
 *   title: string
 *   service: string
 *   link: string
 *   content: string
 *   updated: Date
 *   id: string
 * }} feedEntry
 */

/**
 * Check the XML issue feed and email if needed 
 */
function checkXML_feed(){
	var _self = _init_();
	
	// fetch the XML feed
	var response = UrlFetchApp.fetch(_self.FIREBASE_ISSUE_FEED, {
		muteHttpExceptions: true
	});
	
	// Parse XML
	var xmlDoc = XmlService.parse(response.getContentText());
	var xmlFeed = xmlDoc.getRootElement();
	var xmlContent = xmlFeed.getAllContent();
	
	
	var lastUpdated;
	/** @type {Array.<feedEntry>} */
	var entries = [];
	
	for (var i = 0; i < xmlContent.length; i++){
		var element = xmlContent[i].asElement();
		
		if (!element) continue;
		
		switch (element.getName()){
			case 'updated':
				lastUpdated = new Date(element.getValue());
				
				break;
				
			case 'entry':
				_parseXmlFeedEntries_(element, entries);
				
				break;
				
			default:
				
		}
	}
	
	// Load existing entries
	var data = _self.sheets.xmlFeed.getDataRange().getValues();
	var existingIssues = {};
	
	for (var row = 3; row < data.length; row++){
		existingIssues[ data[row][_self.FEED_HEADERS.id] ] = data[row][_self.FEED_HEADERS.updated] || true;
	}
	
	var index,
		entry;
	
	// Examine new entries
	for (index = 0; index < entries.length; index ++){
		entry = entries[index];
		
		// entry was already processed
		if (!existingIssues[entry.id]) continue;
		
		entries.splice(index, 1);
		index -= 1;
	}
	
	/**@type {{issueCount: number, mailBody: string, content: Array.<feedEntry>}}*/
	var mails = {};
	var savedIssues = [];
	
	// Build mails
	for (index = 0; index < entries.length; index ++){
		entry = entries[index];
		var emails = _self.services[ entry.service ];
		
		// Nobody registered for those issues
		if (!emails){
			entries.splice(index, 1);
			index -= 1;
			
			continue;
		}
		
		for (var email in emails){
			mails[email] = mails[email] || {
				issueCount: 0,
				mailBody: '',
				content: []
			};
			
			mails[email].content.push(entry);
			
			mails[email].issueCount += 1;
			mails[email].mailBody += '<div><div>'+ entry.title +'</div><div>'+ entry.updated +'</div><div>'+ entry.content +'</div></div>';
		}
		
		// Save new issues
		savedIssues.push([
			entry.id,
			entry.updated,
			entry.service,
			entry.title,
			entry.link,
			entry.content
		]);
	}
	
	// send mails
	for (var recipient in mails){
		var mailTemplate = HtmlService.createTemplateFromFile('mail_template');
		mailTemplate.issues = mails[recipient].content;
		
		
		GmailApp.sendEmail(
			recipient,
			'Firebase Status monitoring', '',
			{
				name: 'The mysterious Firebase status monitoring script',
				htmlBody: mailTemplate.evaluate().getContent() //mails[recipient].mailBody
			}
		)
	}
	
	// Save sent incident in the spreadsheet
	_self.sheets.xmlFeed.insertRowsAfter(3, savedIssues.length);
	SpreadsheetUtils.writeArray(_self.sheets.xmlFeed, 'A4', savedIssues);
	
	_self.sheets.xmlFeed.getRange('B1')
		.setValue(lastUpdated);
}

/**
 * Parse the entry in the XML feed,
 * Directly update the entries array
 * 
 * @param {XmlService.Element} entry
 * @param {Array.<feedEntry>} entries
 * @private
 */
function _parseXmlFeedEntries_(entry, entries){
	
	var content = entry.getAllContent();
	var newEntry = {};
	
	for (var i = 0; i < content.length; i++){
		var element = content[i].asElement();
		
		if (!element) continue;
		
		newEntry[ element.getName() ] = element.getValue() || element.getAttribute('href').getValue();
	}
	
	var res = /^http:\/\/status\.firebase\.google\.com\/incident\/([^\/]+)\//.exec(newEntry.link);
	newEntry.service = res && decodeURIComponent(res[1]) || 'unknown service';
	
	entries.push(newEntry);
}