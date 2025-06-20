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

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ DOM Elements
const playlistSelect = document.getElementById("playlistSelect");
const videoList = document.getElementById("videoList");

let currentPlaylist = null;

// 🔁 Load Playlists
async function loadPlaylists() {
  const playlistsCol = collection(db, "playlists");
  const snapshot = await getDocs(playlistsCol);

  playlistSelect.innerHTML = `<option value="">-- Select Playlist --</option>`;

  snapshot.forEach((docSnap) => {
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = docSnap.id;
    playlistSelect.appendChild(opt);
  });

  if (snapshot.docs.length > 0) {
    playlistSelect.value = snapshot.docs[0].id;
    currentPlaylist = snapshot.docs[0].id;
    loadVideos(currentPlaylist);
  }
}

// ▶️ Load Videos
async function loadVideos(playlistName) {
  if (!playlistName) return;
  videoList.innerHTML = "<p>Loading videos...</p>";

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

  videoList.innerHTML = "";

  videos.forEach((video, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const safeTitle = video.title || "Untitled";
    const videoURL = video.url || "";

    card.innerHTML = `
      <video controls src="${videoURL}" preload="metadata"></video>
      <h3>${safeTitle}</h3>
      <button class="like-btn" data-index="${index}">👍 Like (${video.likes || 0})</button>
    `;

    videoList.appendChild(card);
  });

  // 🧠 Add Like Button Events
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      const docRef = doc(db, "playlists", playlistName);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      const videos = data.videos || [];

      videos[index].likes = (videos[index].likes || 0) + 1;
      await updateDoc(docRef, { videos });

      e.currentTarget.textContent = `👍 Like (${videos[index].likes})`;
    });
  });
}

// 🔁 Playlist Change
playlistSelect.addEventListener("change", () => {
  const selected = playlistSelect.value;
  if (selected !== currentPlaylist) {
    currentPlaylist = selected;
    loadVideos(selected);
  }
});

// 🚀 Init
loadPlaylists();
