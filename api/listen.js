import { connectToDatabase } from "../lib/mongodb.js";
import Song from "../models/Song.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: "Invalid or missing song ID" });
    }

    const song = await Song.findOne({ id: id });

    if (!song) {
      return res.status(404).json({ success: false, message: "No such song found" });
    }

    // Sanitize data
    const safeTitle = song.song.title;
    const safeAuthor = song.song.keywords[0];
    const safeThumbnail = encodeURIComponent(song.song.thumbnail[song.song.thumbnail.length - 1].url);

    const appLink = `com.codewitharun.vibe:/?id=${id}&title=${safeTitle}&author=${safeAuthor}&thumbnail=${safeThumbnail}`;

    console.log("Redirecting to: ", appLink);

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta property="og:title" content="${safeTitle}" />
          <meta property="og:description" content="🎵 Listen to ${safeTitle} by ${safeAuthor} on Vibe!" />
          <meta property="og:image" content="${song.song.thumbnail[0].url}" />
          <meta property="og:url" content="${appLink}" />
          <meta property="og:type" content="music.song" />
          <meta name="twitter:card" content="summary_large_image" />
          <title>Redirecting to Vibe...</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #1A1A1A;
              color: #fff;
              text-align: center;
            }
            h3 {
              font-size: 24px;
              margin-bottom: 20px;
            }
            .download-button {
              display: none;
              padding: 12px 24px;
              background-color: #00F5D4;
              color: #1A1A1A;
              text-decoration: none;
              border-radius: 5px;
              font-size: 16px;
              font-weight: bold;
              transition: background-color 0.3s;
            }
            .download-button:hover {
              background-color: #00ffcc;
            }
            .song-info {
              margin-bottom: 20px;
            }
            .song-info img {
              width: 150px;
              height: 150px;
              border-radius: 10px;
              margin-bottom: 10px;
              object-fit: fill;
            }
            .song-info p {
              margin: 5px 0;
              font-size: 16px;
            }
            .app-logo {
              width: 80px;
              height: 80px;
              margin-bottom: 20px;
              border-radius: 15px;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img 
            src="https://res.cloudinary.com/dhlr0ufcb/image/upload/v1742872099/icon_ebgvfw.png" 
            alt="Vibe App Logo" 
            class="app-logo" 
          />
          <div class="song-info">
            <img src="${song.song.thumbnail[0].url}" alt="${safeTitle} thumbnail" />
            <p>Listen To ${safeTitle}</p>
            <p>by ${safeAuthor} On Vibe</p>
            <p>© codewitharun (Ravi)</p>
          </div>
          <h3>Redirecting to Vibe...</h3>
          <a id="downloadButton" class="download-button" href="${process.env.APP_URL}" target="_blank" rel="noopener noreferrer">
            Download Vibe App
          </a>
          <script>
            let redirected = false;
            window.location.href = "${appLink}";
            
            setTimeout(() => {
              if (!document.hidden) {
                document.querySelector('h3').innerText = "Couldn't redirect to Vibe?";
                document.getElementById('downloadButton').style.display = 'inline-block';
              }
            }, 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in listen handler:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}