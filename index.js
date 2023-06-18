const express = require('express');
const mongoose = require('mongoose');
const AdmZip = require('adm-zip');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Connect to MongoDB
mongoose
    .connect(`mongodb+srv://${process.env.DBUSERNAME}:${process.env.DBPASSWORD}@chat-app.xvurvda.mongodb.net`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    });

// Channel Model
const Channel = mongoose.model('Channel', {
    name: { type: String, required: true },
    channelDescription: { type: String, required: true },
    users: [{ type: String, required:true}],
    chat: [{ type: Array,required:true }],
});

// User Model
const User = mongoose.model('User', {
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    channels: [
        {
            channelId: { type: mongoose.Types.ObjectId, ref: 'Channel', required: true },
            channelName: { type: String, required: true },
            channelDescription: { type: String, required: true },
        },
    ],
});



// Define a function to store data in a zip
const storeDataInZip = async () => {
    try {
        // Retrieve data from MongoDB
        const channels = await Channel.find().populate('users').populate('chat');
        const users = await User.find();

        // Create a new ZIP file
        const zip = new AdmZip();

        // Add data to the ZIP (modify as per your data structure)
        zip.addFile('channels.json', Buffer.from(JSON.stringify(channels), 'utf-8'));
        zip.addFile('users.json', Buffer.from(JSON.stringify(users), 'utf-8'));

        // Generate a ZIP buffer
        const zipBuffer = zip.toBuffer();

        // Get the current date and time
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const date = now.getDate();

        // Save the ZIP file to the output directory with the current hour in the file name
        const outputDir = path.join(__dirname, 'data');
        const zipFileName = `data-${date}-${hour}-${minutes}.zip`;
        const zipFilePath = path.join(outputDir, zipFileName);
        zip.writeZip(zipFilePath);

        console.log('Data stored in ZIP successfully');
    } catch (error) {
        console.error('Failed to store data in ZIP:', error);
    }
};
// Schedule the function to run every hour
cron.schedule('0 * * * *', () => {
    console.log('running')
    storeDataInZip();
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
