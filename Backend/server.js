require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB database.');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    throw err;
  });

// Define a schema and model for emails
const emailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
});

const Email = mongoose.model('Email', emailSchema);

// Root route
app.get('/', (req, res) => {
  res.send('Server is running successfully!');
});

// Serve static files from the papers directory
app.use('/papers', express.static(path.join(__dirname, 'papers')));

// Route to handle email submissions and respond with PDF URL
app.post('/submit-email', async (req, res) => {
  const { email, paper } = req.body;

  // Validate email
  if (!email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
    return res.status(400).send('Invalid email address.');
  }

  try {
    // Save email to database
    const newEmail = new Email({ email });
    await newEmail.save();
    console.log('Email saved to database.');

    // Respond with the appropriate PDF URL
    let pdfPath;
    switch (paper) {
      case 'Open Source Language Models':
        pdfPath = 'AI-METHODLOGY.pdf';
        break;
      case 'Unifying Knowledge Graphs with Language Models':
        pdfPath = 'KGs+LLMs.pdf';
        break;
      case 'Differentially-Private Offsite Prompt Tuning (DP-OPT)':
        pdfPath = 'DP-OPT.pdf';
        break;
      default:
        return res.status(400).send('Invalid paper selection.');
    }

    // Create the full URL for the PDF
    const pdfUrl = `${req.protocol}://${req.get('host')}/papers/${pdfPath}`;
    res.json({ pdfUrl });
  } catch (err) {
    console.error('Error saving email to database:', err);
    res.status(500).send('Error saving email.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
