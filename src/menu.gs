
/**
 * Add UI menu
 */
function onOpen(){
	// Add start menu
	SpreadsheetApp.getUi().createMenu('Monitor Firebase')
		.addItem('Check XML feed', 'checkXML_feed')
		.addItem('List issues', 'updateIssueList')
		.addToUi();
	
}

