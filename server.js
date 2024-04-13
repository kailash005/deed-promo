const express = require('express');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./google-credentials.json');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize Google Sheets
async function init() {
    await creds;
}

// Calculate payment based on the number of days and reels submitted
function calculatePayment(days, totalVideos) {
    const paymentPerVideo = days > 10 ? 4.5 : 3;
    return totalVideos * paymentPerVideo;
}

// Handle form submission
app.post('/submit', async (req, res) => {
    const { userName, linkToReel1, linkToReel2, days } = req.body;
    const totalVideos = 2; // Assuming 2 reels submitted

    try {
        // Load credentials for Google Sheets API
        const creds = require('./google-credentials.json');

        // Create a new instance of Google Sheets document
        const doc = new GoogleSpreadsheet();
        await doc.useServiceAccountAuth(creds);

        // Create a new spreadsheet for the user if not exists
        const [existingSheet] = await doc.sheetsByTitle(userName);
        const sheet = existingSheet || await doc.addSheet({ title: userName });

        // Get the current date
        const currentDate = new Date().toLocaleDateString();

        // Append data to the user's sheet
        await sheet.setHeaderRow(['Day', 'Link to Reel 1', 'Link to Reel 2']);
        await sheet.addRow([currentDate, linkToReel1, linkToReel2]);

        // Calculate payment
        const toBePaid = calculatePayment(days, totalVideos);

        // Append payment data to summary spreadsheet
        const summarySheet = await doc.sheetsByTitle('Summary');
        await summarySheet.addRow({ 'User': userName, 'Date': currentDate, 'ToBePaid': toBePaid });

        res.status(200).send('Form submitted successfully!');
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).send('Internal server error');
    }
});

// Start the server
init().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(error => {
    console.error('Error starting server:', error);
});
