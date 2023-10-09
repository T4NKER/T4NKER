const express = require('express');
const path = require('path');
const app = express();

// Serve the static files (main.js, index.html, index.css) from the "frontend" folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Define a route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running....");
});