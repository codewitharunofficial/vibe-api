import axios from 'axios';
import { connectToDatabase } from '../lib/mongodb.js';
import Song from '../models/Song.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

export default async function streamSong(req, res) {
    const { videoId, email } = req.query;

    dotenv.config();

    console.log(`[stream] Requested: ${videoId} by ${email || "guest"}`);

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        // Connect to MongoDB (singleton)
        await connectToDatabase();

        let songData;
        let songDoc = await Song.findOne({ id: videoId });

        const isExpired = (url) => {
            try {
                const u = new URL(url);
                const expire = parseInt(u.searchParams.get('expire'), 10);
                return !expire || expire <= Math.floor(Date.now() / 1000);
            } catch {
                return true;
            }
        };

        if (songDoc && !isExpired(songDoc.song.adaptiveFormats.at(-1)?.url)) {
            songData = songDoc.song;
        } else {
            console.log('[stream] Fetching new data from source');
            songData = await getSongFromSource(videoId);
            if (songData) {
                await Song.findOneAndUpdate(
                    { id: videoId },
                    { song: songData },
                    { upsert: true, new: true }
                );
            } else {
                return res.status(404).json({ error: 'Song not found' });
            }
        }

        if (email) {
            await updateUserHistory(email, songData, videoId);
        }

        const streamUrl = songData.adaptiveFormats.at(-1)?.url;

        if (!streamUrl) {
            return res.status(500).json({ error: 'Streaming URL not found' });
        }

        console.log('[stream] Redirecting to:', streamUrl);
        return res.redirect(streamUrl);

    } catch (err) {
        console.error('[stream] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Fetch song data from external source (e.g. RapidAPI)
async function getSongFromSource(id) {

    try {
        const { data } = await axios.get(process.env.RAPID_API_BASE_URL, {
            params: { id, cgeo: 'IN' },
            headers: {
                'x-rapidapi-key': process.env.RAPID_API_KEY,
                'x-rapidapi-host': process.env.RAPID_API_HOST,
            },
        });
        return data.status === 'OK' ? data : null;
    } catch (err) {
        console.error('[stream] Error fetching from source:', err.message);
        return null;
    }
}

// Save history
async function updateUserHistory(email, song, videoId) {
    try {
        const user = await User.findOne({ email });
        if (!user) return;

        const songData = {
            videoId,
            title: song.title,
            author: song.keywords?.at(-1) || 'Unknown',
            thumbnail: song.thumbnail?.at(-1)?.url || '',
            duration: song.duration,
            isExplicit: song.isExplicit || false,
        };

        const recentlyPlayed = (user.recently_played || []).filter(s => s.videoId !== videoId);
        recentlyPlayed.unshift(songData);

        const mostPlayed = user.most_played || [];
        const idx = mostPlayed.findIndex(s => s.videoId === videoId);
        if (idx !== -1) mostPlayed[idx].count += 1;
        else mostPlayed.push({ ...songData, count: 1 });

        await User.findOneAndUpdate(
            { email },
            { recently_played: recentlyPlayed.slice(0, 20), most_played: mostPlayed },
            { new: true }
        );
    } catch (err) {
        console.error('[stream] Error updating history:', err.message);
    }
}
