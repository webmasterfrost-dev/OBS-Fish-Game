const ws = new WebSocket("ws://127.0.0.1:8080/");
let displayTimeout;
let sequenceTimeout;

ws.onopen = () => {
    console.log("Connected to Streamer.bot WebSocket!");
    ws.send(JSON.stringify({
        "request": "Subscribe",
        "events": {
            "General": ["*"],
            "Custom": ["*"]
        },
        "id": "FishingOverlay"
    }));
};

ws.onmessage = (event) => {
    try {
        const rawData = JSON.parse(event.data);
        const payload = rawData.data || rawData;

        // Triggers if it's our fishing event or has catch data
        if (payload.type === 'FishingCatch' || payload.catchData || payload.randomLine) {
            const username = payload.user || payload.userName || "Streamer";
            const catchResult = payload.catchData || payload.randomLine || "A fish";
            const points = payload.pts !== undefined ? payload.pts : (payload.fishPoints || 0);
            const total = payload.total !== undefined ? payload.total : (payload.totalPoints || 0);
            
            // Grabs the position from the C# script (defaults to top-right if not set)
            const gridPosition = payload.pos || "pos-top-right";
            
            startCinematicSequence(username, catchResult, points, total, gridPosition);
        }
    } catch (err) {
        console.error("Parse error:", err);
    }
};

function playVideo(filename) {
    const videoElement = document.getElementById("fishing-video");
    if (!videoElement) return;
    videoElement.src = filename;
    videoElement.load(); 
    videoElement.currentTime = 0;
    videoElement.muted = true; 
    videoElement.play().catch(e => console.log("Autoplay error:", e));
}

function startCinematicSequence(username, catchResult, points, total, gridPosition) {
    const container = document.getElementById("catch-container");
    const textElement = document.getElementById("catch-text");

    if (!container || !textElement) return;

    clearTimeout(displayTimeout);
    clearTimeout(sequenceTimeout);

    // --- APPLY GRID POSITION ---
    // Remove all old position classes before adding the new one
    const allPositions = [
        "pos-top-left", "pos-top-center", "pos-top-right", 
        "pos-mid-left", "pos-mid-center", "pos-mid-right", 
        "pos-bot-left", "pos-bot-center", "pos-bot-right"
    ];
    container.classList.remove(...allPositions);
    container.classList.add(gridPosition); // Apply the chosen position

    const lowerCatch = catchResult.toLowerCase();
    let chosenVideo = "empty.mp4";
    let isTrash = false;

    // --- YOUR EXACT VIDEO MAPPING RULES ---
    if (lowerCatch.includes("stick")) {
        chosenVideo = "stick.mp4";
        isTrash = true;
    } else if (lowerCatch.includes("bass")) {
        chosenVideo = "Bass.mp4";
    } else if (lowerCatch.includes("carp")) {
        chosenVideo = "carp.mp4";
    } else if (lowerCatch.includes("catfish")) {
        chosenVideo = "catfish.mp4";
    } else if (lowerCatch.includes("pike")) {
        chosenVideo = "northernpike.mp4";
    } else if (lowerCatch.includes("sunfish")) {
        chosenVideo = "sunfish.mp4";
    } else if (lowerCatch.includes("kraken")) {
        chosenVideo = "kraken.mp4";
    } else if (lowerCatch.includes("sturgeon")) {
        chosenVideo = "sturgeon.mp4";
    } else if (lowerCatch.includes("turtle")) {
        chosenVideo = "turtle.mp4";
    } else if (lowerCatch.includes("bluegill")) {
        chosenVideo = "bluegill.mp4";
    } else if (lowerCatch.includes("walleye")) {
        chosenVideo = "walleye.mp4";
    } else if (lowerCatch.includes("crappie")) {
        chosenVideo = "crappie.mp4";
    } else if (lowerCatch.includes("gar")) {
        chosenVideo = "alligatorgar.mp4";
    } else if (lowerCatch.includes("empty")) {
        chosenVideo = "empty.mp4";
    } else if (lowerCatch.includes("snagged")) {
        chosenVideo = "empty.mp4";
        isTrash = true;
    } else {
        if (
            points > 0 || 
            lowerCatch.includes("shiner") || 
            lowerCatch.includes("musky")
        ) {
            chosenVideo = "catch-fish.mp4";
        } else {
            chosenVideo = "empty.mp4";
            isTrash = true;
        }
    }

    // --- STAGE 1: INSTANT PLAY & CAST TEXT ---
    container.classList.remove("hidden");
    playVideo(chosenVideo); 
    textElement.innerText = `${username} cast their line...`;

    // --- STAGE 2: THE REVEAL (After 7 seconds) ---
    sequenceTimeout = setTimeout(() => {
        if (isTrash) {
            const trashReveals = [
                `Tough luck, ${username}...\n`,
                `${username}'s line came up empty...\n`,
                `Oh no, ${username}...\n`,
                `Better luck next time, ${username}...\n`,
                `Oof, ${username}...\n`
            ];
            const randomReveal = trashReveals[Math.floor(Math.random() * trashReveals.length)];
            textElement.innerText = `${randomReveal}${catchResult}\n(+${points} pts | Total: ${total})`;
        } else {
            textElement.innerText = `${username} caught:\n${catchResult}\n(+${points} pts | Total: ${total})`;
        }

        // Hide overlay after showing the catch details for another 5 seconds
        displayTimeout = setTimeout(() => {
            container.classList.add("hidden");
            const videoElement = document.getElementById("fishing-video");
            if (videoElement) videoElement.pause();
        }, 5000); 

    }, 7000); 
}