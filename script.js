// ✅ Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCLRpi50-Tn0JVUqowd3wR11hg9XZ1zCQc",
  authDomain: "anique-dialer.firebaseapp.com",
  projectId: "anique-dialer",
  storageBucket: "anique-dialer.appspot.com",
  messagingSenderId: "105864685118",
  appId: "1:105864685118:web:2d32f8a0fc47ff77d8136f",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ DOM Elements
const playlistSelect = document.getElementById("playlistSelect");
const videoList = document.getElementById("videoList");
const searchInput = document.getElementById("searchInput");

let allPlaylists = [];
let currentPlaylist = null;

// 🔁 Load All Playlists
async function loadPlaylists() {
  try {
    const snap = await getDocs(collection(db, "playlists"));
    playlistSelect.innerHTML = `<option value="">-- Select Playlist --</option>`;

    allPlaylists = snap.docs.map(docSnap => ({
      id: docSnap.id,
      videos: docSnap.data().videos || [],
    }));

    allPlaylists.forEach(({ id }) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = id;
      playlistSelect.appendChild(opt);
    });

    if (allPlaylists.length > 0) {
      playlistSelect.value = allPlaylists[0].id;
      currentPlaylist = allPlaylists[0].id;
      await loadVideos(currentPlaylist);
    }
  } catch (err) {
    console.error("Error loading playlists:", err);
    videoList.innerHTML = "<p>⚠️ Failed to load playlists.</p>";
  }
}

// ▶️ Load Videos from Selected Playlist
async function loadVideos(playlistName) {
  if (!playlistName) return;
  videoList.innerHTML = "<p>Loading videos...</p>";

  try {
    const docRef = doc(db, "playlists", playlistName);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      videoList.innerHTML = "<p>No videos found.</p>";
      return;
    }

    const data = docSnap.data();
    const videos = data.videos || [];

    if (videos.length === 0) {
      videoList.innerHTML = "<p>No videos available in this playlist.</p>";
      return;
    }

    renderVideos(playlistName, videos);
  } catch (err) {
    console.error("Error loading videos:", err);
    videoList.innerHTML = "<p>⚠️ Failed to load videos.</p>";
  }
}

// 🎞 Render Filtered or Full Video List
function renderVideos(playlistName, videos) {
  videoList.innerHTML = "";

  videos.forEach((video, index) => {
    const title = video.title || "Untitled";
    const url = video.url || "";
    const likes = video.likes || 0;

    const likedKey = `liked-${playlistName}-${index}`;
    const isLiked = localStorage.getItem(likedKey) === "true";

    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <video controls src="${url}" preload="metadata"></video>
      <h3>${title}</h3>
      <button class="like-btn ${isLiked ? 'liked' : ''}" data-index="${index}">
        👍 ${likes}
      </button>
    `;
    videoList.appendChild(card);
  });

  setupLikeEvents(playlistName);
}

// 💖 Setup Like Button Events
function setupLikeEvents(playlistName) {
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      const btnEl = e.currentTarget;
      const likedKey = `liked-${playlistName}-${index}`;

      if (localStorage.getItem(likedKey) === "true") {
        alert("You've already liked this video.");
        return;
      }

      try {
        btnEl.disabled = true;

        const docRef = doc(db, "playlists", playlistName);
        const docSnap = await getDoc(docRef);
        const updated = docSnap.data().videos || [];

        updated[index].likes = (updated[index].likes || 0) + 1;
        await updateDoc(docRef, { videos: updated });

        localStorage.setItem(likedKey, "true");
        btnEl.textContent = `👍 ${updated[index].likes}`;
        btnEl.classList.add("liked");
      } catch (err) {
        console.error("Failed to like video:", err);
        alert("⚠️ Error while liking the video.");
      } finally {
        btnEl.disabled = false;
      }
    });
  });
}

// 🔍 Handle Search Input
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    loadVideos(currentPlaylist);
    return;
  }

  const matches = [];
  for (const playlist of allPlaylists) {
    const filtered = playlist.videos.filter(v =>
      v.title.toLowerCase().includes(query) || playlist.id.toLowerCase().includes(query)
    );
    if (filtered.length) {
      matches.push({ playlist: playlist.id, videos: filtered });
    }
  }

  if (matches.length === 0) {
    videoList.innerHTML = `<p>😔 No results found for "${query}".</p>`;
    return;
  }

  videoList.innerHTML = "";
  matches.forEach(({ playlist, videos }) => {
    const label = document.createElement("h2");
    label.textContent = `🎞 ${playlist}`;
    label.style.margin = "1rem 0 0.5rem 0";
    videoList.appendChild(label);
    renderVideos(playlist, videos);
  });
});

// 🔁 Change Playlist
playlistSelect.addEventListener("change", () => {
  const selected = playlistSelect.value;
  if (selected !== currentPlaylist) {
    currentPlaylist = selected;
    loadVideos(selected);
  }
});

// 🚀 Init
loadPlaylists();
