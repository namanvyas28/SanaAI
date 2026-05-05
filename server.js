const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const upload = multer({ dest: "uploads/" });

let pdfText = "";

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// PDF Upload
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ message: "No file uploaded" });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    pdfText = data.text;

    console.log("PDF LOADED:", pdfText.substring(0, 100));

    res.json({ message: "PDF uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.json({ message: "Error reading PDF" });
  }
});

// Chat Route
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.json({ reply: "Please enter a message" });
    }

    let prompt = "";

    if (!pdfText || pdfText.length < 50) {
      prompt = `Answer this clearly:\n${userMessage}`;
    } else {
      prompt = `
You are a helpful study assistant.

PDF Content:
${pdfText}

Question: ${userMessage}
`;
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt
    });

    const reply = response.output[0].content[0].text;

    res.json({ reply });

  } catch (err) {
    console.log("FULL ERROR:", err);
    res.json({ reply: "Error: " + err.message });
  }
});

// PORT FIX (IMPORTANT for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});