// ✅ Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCLRpi50-Tn0JVUqowd3wR11hg9XZ1zCQc",
  authDomain: "anique-dialer.firebaseapp.com",
  databaseURL: "https://anique-dialer-default-rtdb.firebaseio.com",
  projectId: "anique-dialer",
  storageBucket: "anique-dialer.appspot.com",
  messagingSenderId: "105864685118",
  appId: "1:105864685118:web:2d32f8a0fc47ff77d8136f",
  measurementId: "G-PKHZF7JCVH",
};

// ✅ Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 🎥 Create New Playlist
window.createPlaylist = async () => {
  const nameInput = document.getElementById("playlistName");
  const name = nameInput.value.trim().toLowerCase();
  if (!name) return alert("Enter playlist name.");

  const refDoc = doc(db, "playlists", name);
  const docSnap = await getDoc(refDoc);
  if (docSnap.exists()) {
    alert("Playlist already exists.");
    return;
  }

  await setDoc(refDoc, { videos: [] });
  alert("Playlist created.");
  nameInput.value = "";
  await refreshPlaylists();
};

// 📤 Upload Video
window.uploadVideo = async () => {
  const fileInput = document.getElementById("videoFile");
  const titleInput = document.getElementById("videoTitle");
  const playlist = document.getElementById("playlistSelect").value;
  const file = fileInput.files[0];
  const title = titleInput.value.trim();

  if (!file || !title || !playlist) {
    alert("Fill all fields.");
    return;
  }

  const validTypes = ["video/mp4", "video/webm"];
  if (!validTypes.includes(file.type)) {
    alert("Only MP4 or WebM video files are allowed.");
    return;
  }

  const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${file.name.slice(-40)}`;
  const storageRef = ref(storage, `videos/${uniqueName}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const percent = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      console.log(`Uploading: ${percent}%`);
    },
    (error) => {
      console.error("Upload failed:", error);
      alert("Upload failed.");
    },
    async () => {
      const videoURL = await getDownloadURL(uploadTask.snapshot.ref);

      const refDoc = doc(db, "playlists", playlist);
      const docSnap = await getDoc(refDoc);
      const data = docSnap.data();
      const videos = data.videos || [];

      videos.push({ title, url: videoURL, path: `videos/${uniqueName}` });
      await updateDoc(refDoc, { videos });

      alert("Video uploaded.");
      fileInput.value = "";
      titleInput.value = "";
      await refreshPlaylists();
    }
  );
};

// 🔁 Refresh Playlist UI
async function refreshPlaylists() {
  const select = document.getElementById("playlistSelect");
  const manager = document.getElementById("playlistManager");

  const previousSelection = select.value;
  select.innerHTML = '<option value="">-- Select Playlist --</option>';
  manager.innerHTML = "";

  const snap = await getDocs(collection(db, "playlists"));
  const names = [];

  for (const docSnap of snap.docs) {
    const name = docSnap.id;
    names.push(name);
    const data = docSnap.data();
    const videos = data.videos || [];

    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);

    const div = document.createElement("div");
    div.className = "playlist-block";
    div.innerHTML = `<h3>${name}</h3>`;

    videos.forEach((vid, index) => {
      const safeID = `title-${encodeURIComponent(name)}-${index}`;
      const vDiv = document.createElement("div");
      vDiv.className = "video-item";
      vDiv.innerHTML = `
        <video src="${vid.url}" controls width="250"></video>
        <input type="text" value="${vid.title}" id="${safeID}" />
        <div class="video-controls">
          <button onclick="saveEdit('${name}', ${index})">💾 Save</button>
          <button onclick="deleteVideo('${name}', ${index})">🗑 Delete</button>
        </div>
      `;
      div.appendChild(vDiv);
    });

    manager.appendChild(div);
  }

  if (previousSelection && names.includes(previousSelection)) {
    select.value = previousSelection;
  }
}

// 💾 Edit Title
window.saveEdit = async (playlist, index) => {
  const input = document.getElementById(`title-${encodeURIComponent(playlist)}-${index}`);
  const newTitle = input.value.trim();
  if (!newTitle) return alert("Title cannot be empty.");

  const refDoc = doc(db, "playlists", playlist);
  const docSnap = await getDoc(refDoc);
  const data = docSnap.data();
  const videos = data.videos || [];

  videos[index].title = newTitle;
  await updateDoc(refDoc, { videos });

  alert("Title updated.");
};

// ❌ Delete Video
window.deleteVideo = async (playlist, index) => {
  if (!confirm("Delete this video?")) return;

  const refDoc = doc(db, "playlists", playlist);
  const docSnap = await getDoc(refDoc);
  const data = docSnap.data();
  const videos = data.videos || [];

  const videoPath = videos[index]?.path;
  if (videoPath) {
    const storageRef = ref(storage, videoPath);
    await deleteObject(storageRef).catch((err) =>
      console.warn("Warning: Video deleted from Firestore, but file not found in storage.")
    );
  }

  videos.splice(index, 1);
  await updateDoc(refDoc, { videos });

  await refreshPlaylists();
};

// 🚀 Init
window.onload = refreshPlaylists;
