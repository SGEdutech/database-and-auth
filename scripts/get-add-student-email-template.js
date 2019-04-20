function getAddStudentEmailTemplate(instituteName) {
	return `
	<p>Dear Student,</p>
	<p>Greetings from <a href="https://eduatlas.com">EDUATLAS.COM</a></p>
	<p>
		<b>${instituteName}</b> has added you as a student to their STUDY MONITOR APP. We request you to kindly download
		the app from the Google Play store if you have an android phone or login to <a
			href="https://eduatlas.com">https://eduatlas.com</a> to access all information related to your institute.
	</p>
	<p>
		<b>
			Steps to Download Mobile App (ANDROID only)
		</b>
		<ol>
			<li>From your phone go the PLAY STORE</li>
			<li>Search for ${instituteName} App</li>
			<li>Download the app</li>
			<li>Signup for a FREE account by clicking on the signup button in the app <b>(Please remember to signup with
					this email id only, else request may not be accepted)</b></li>
		</ol>
	</p>
	<p><i>(In case, you cannot find the app on the PLAY STORE, please contact your institute for the custom link)</i>
	</p>
	<p>
		<b>Steps to use ${instituteName} from website</b>
		<br>
		(Advised for students with iOS phones or who wish to access without phone)
		<ol>
			<li>Visit <a href="https://eduatlas.com">https://eduatlas.com</a></li>
			<li>Click on Login button on top right corner</li>
			<li>Click Signup button</li>
			<li>Create a FREE account <b>(Please remember to signup with this email id only, else request may not be accepted)</b></li>
		</ol>
	</p>
	<p>
		<b>Your institute is delighted to become a 21st Century institute and now you can access the following information at the click of a button</b>
		<ol>
			<li>Weekly Class Schedules</li>
			<li>Attendance</li>
			<li>Any communication from your institute</li>
			<li>Study Material</li>
			<li>Test Score</li>
			<li>Performance Reports</li>
		</ol>
	</p>
	<p><b>We hope you will benefit from the above features and wish you all the very best for your future</b></p>
	<p>
		STUDY HARD!
		<br>
		Team EDUATLAS
	</p>
	`;
}

module.exports = getAddStudentEmailTemplate;
