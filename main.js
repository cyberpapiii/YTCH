let staticNoise = document.querySelector(".static-noise");
let smpte = document.querySelector(".smpte");
let channelName = document.querySelector(".channel-name");
let muteIcon = document.querySelector(".muteIcon");
let videoId = document.querySelector(".video-id");
let control = document.querySelector(".control");
let powerScreen = document.querySelector(".power-screen");
let info = document.querySelector(".info");
let player, playingNow, playingNowOrder, startAt, vids;
let channelNumber = 1;
let isMin = false, isMuted = true, isOn = true, showInfo = false, showChat = false;
let chatMessages = [];
let userName = '';
let socket;
let reconnectAttempts = 0;
let userCountElement = document.querySelector(".user-count");

if (localStorage.getItem("storedChannelNumber") === null) {
    channelNumber = 1;
    localStorage.setItem("storedChannelNumber", 1);
} else {
    channelNumber = Number(localStorage.getItem("storedChannelNumber"));
}

control.addEventListener("mouseover", function () {
    control.style.animation = 0;
});

control.addEventListener("mouseleave", function () {
    if (isMin) {
        control.style.animation = "fadeout 3s forwards";
    }
});

function resizePlayer() {
    let p = document.querySelector("#player");
    p.style.top = - window.innerHeight * 0.5 + "px";
    p.style.left = (window.innerWidth - Math.min(window.innerHeight * 1.777, window.innerWidth)) / 2 + "px";
    player.setSize(Math.min(window.innerHeight * 1.777, window.innerWidth), window.innerHeight * 2);
}

function getList() {
    console.log("Getting video list");
    vids = {};
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            console.log("Video list received");
            r = JSON.parse(this.responseText);
            vids = r;
            console.log("Video list:", vids);
            playChannel(channelNumber, false);
        }
    };
    xhttp.open("GET", "list.json?t=" + Date.now());
    xhttp.send();
}

function playChannel(ch, s) {
    console.log("Playing channel:", ch);
    (ch < 10) ? channelName.textContent = "CH 0" + ch : channelName.textContent = "CH " + ch;
    control.style.display = "flex";
    smpte.style.opacity = 0;
    if (sync(ch)) {
        console.log("Synced successfully. Loading video:", playingNow, "at", startAt);
        player.loadVideoById(playingNow, startAt);
        player.setVolume(100);
        player.setPlaybackRate(1);
        // Static noise will be hidden by the switchChannel function
    } else if (s) {
        console.log("Sync failed, getting new list");
        getList();
    } else {
        console.log("Sync failed, showing SMPTE");
        smpte.style.opacity = 1;
        staticNoise.style.opacity = 1;
        videoId.textContent = "NO SIGNAL";
    }
}

function sync(ch) {
    console.log("Syncing channel:", ch);
    playingNow = 0;
    let t = Math.floor(Date.now() / 1000);
    console.log("Current time:", t);
    if (!vids[ch]) {
        console.error("No videos for channel", ch);
        return false;
    }
    console.log("Videos for channel", ch, ":", vids[ch]);
    for (let i in vids[ch]) {
        console.log("Checking video", i, ":", vids[ch][i]);
        if (t >= vids[ch][i].playAt && t < vids[ch][i].playAt + vids[ch][i].duration) {
            playingNowOrder = i;
            playingNow = vids[ch][i].id;
            if (player && player.getCurrentTime) {
                startAt = player.getCurrentTime();
            } else {
                startAt = t - vids[ch][i].playAt;
            }
            console.log("Synced to video:", playingNow, "at", startAt);
            return true;
        }
    }
    console.log("No current video found for channel", ch);
    // If no current video is found, play the first video in the channel
    if (vids[ch] && Object.keys(vids[ch]).length > 0) {
        let firstVideoKey = Object.keys(vids[ch])[0];
        playingNowOrder = firstVideoKey;
        playingNow = vids[ch][firstVideoKey].id;
        if (player && player.getCurrentTime) {
            startAt = player.getCurrentTime();
        } else {
            startAt = 0;
        }
        console.log("Playing first video in channel:", playingNow);
        return true;
    }
    return false;
}

var scriptUrl = 'https:\/\/www.youtube.com\/s\/player\/d2e656ee\/www-widgetapi.vflset\/www-widgetapi.js'; try { var ttPolicy = window.trustedTypes.createPolicy("youtube-widget-api", { createScriptURL: function (x) { return x } }); scriptUrl = ttPolicy.createScriptURL(scriptUrl) } catch (e) { } var YT; if (!window["YT"]) YT = { loading: 0, loaded: 0 }; var YTConfig; if (!window["YTConfig"]) YTConfig = { "host": "https://www.youtube.com" };
if (!YT.loading) {
    YT.loading = 1; (function () {
        var l = []; YT.ready = function (f) { if (YT.loaded) f(); else l.push(f) }; window.onYTReady = function () { YT.loaded = 1; var i = 0; for (; i < l.length; i++)try { l[i]() } catch (e) { } }; YT.setConfig = function (c) { var k; for (k in c) if (c.hasOwnProperty(k)) YTConfig[k] = c[k] }; var a = document.createElement("script"); a.type = "text/javascript"; a.id = "www-widgetapi-script"; a.src = scriptUrl; a.async = true; var c = document.currentScript; if (c) {
            var n = c.nonce || c.getAttribute("nonce"); if (n) a.setAttribute("nonce",
                n)
        } var b = document.getElementsByTagName("script")[0]; b.parentNode.insertBefore(a, b)
    })()
};

function onYouTubeIframeAPIReady() {
    console.log("YouTube API Ready");
    try {
        player = new YT.Player('player', {
            height: 400,
            width: 700,
            playerVars: {
                'playsinline': 1,
                'disablekb': 1,
                'enablejsapi': 1,
                'iv_load_policy': 3,
                'cc_load_policy': 0,
                'controls': 0,
                'rel': 0,
                'autoplay': 1,
                'mute': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onAutoplayBlocked': onAutoplayBlocked,
                'onError': onErrorOccured
            }
        });
        console.log("Player object created:", player);
        resizePlayer();
        window.addEventListener('resize', function (event) {
            resizePlayer();
        }, true);
    } catch (error) {
        console.error("Error initializing YouTube player:", error);
    }
}

// Ensure the function is called when the API is ready
if (typeof YT !== 'undefined' && YT.loaded) {
    console.log("YT is already loaded, calling onYouTubeIframeAPIReady immediately");
    onYouTubeIframeAPIReady();
} else {
    console.log("YT not loaded yet, setting onYouTubeIframeAPIReady as callback");
    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
}

// Add a fallback to ensure the function is called
window.addEventListener('load', function() {
    console.log("Window loaded, checking if onYouTubeIframeAPIReady has been called");
    if (typeof player === 'undefined') {
        console.log("Player not initialized, calling onYouTubeIframeAPIReady");
        onYouTubeIframeAPIReady();
    }
});

function onErrorOccured(event) {
    console.error("YouTube player error:", event.data);
}

function onPlayerReady(event) {
    console.log("YouTube player ready");
    getList();
}

function onPlayerStateChange(event) {
    staticNoise.style.opacity = 1;
    if (event.data == -1) {
        videoId.textContent = "UNSTARTED";
    } else if (event.data == 0) {
        videoId.textContent = "ENDED";
        if (Object.keys(vids[channelNumber]).length == playingNowOrder) {
            getList();
        } else {
            playChannel(channelNumber, false);
        }
    } else if (event.data == 1) {
        let _startAt = startAt;
        let _playingNow = playingNow;
        let _playingNowOrder = playingNowOrder;
        if (sync(channelNumber)) {
            if (_playingNow == playingNow && _playingNowOrder == playingNowOrder) {
                if (Math.abs(_startAt - startAt) > 7) {
                    player.seekTo(startAt);
                }
            } else {
                player.loadVideoById(playingNow, startAt);
            }
        } else {
            getList();
        }
        staticNoise.style.opacity = 0;
        videoId.textContent = playingNow;
    } else if (event.data == 2) {
        videoId.textContent = "PAUSED";
    } else if (event.data == 3) {
        videoId.textContent = "BUFFERING";
    } else if (event.data == 5) {
        videoId.textContent = "VIDEO CUED";
    }
}

function onAutoplayBlocked() {
    console.log("Autoplay blocked!");
}

function toggleMute() {
    if (player.isMuted()) {
        player.unMute();
        isMuted = false;
        muteIcon.src = "icons/volume-2.svg";
    } else {
        muteIcon.src = "icons/volume-x.svg";
        player.mute();
        isMuted = true;
    }
}

function switchChannel(a) {
    if (isOn) {
        player.stopVideo();
        channelNumber += a;
        if (channelNumber < 1) {
            channelNumber = Object.keys(vids).length;
        }
        if (channelNumber > Object.keys(vids).length) {
            channelNumber = 1;
        }
        localStorage.setItem("storedChannelNumber", channelNumber);
        
        // Show static overlay
        let staticOverlay = document.querySelector(".static-overlay");
        staticOverlay.style.display = "block";
        staticOverlay.style.opacity = "1";
        
        // Hide static overlay after 500ms
        setTimeout(() => {
            staticOverlay.style.opacity = "0";
            setTimeout(() => {
                staticOverlay.style.display = "none";
            }, 500); // Additional delay to allow fade-out
        }, 500);
        
        playChannel(channelNumber, true);
    }
}

function toggleControl() {
    let min = document.querySelectorAll(".min");
    let minimize = document.querySelector(".minimize");
    let minimizeImg = document.querySelector(".minimize img");
    if (isMin) {
        min.forEach(el => el.style.display = "flex");
        minimize.style.margin = "0 0 1rem auto";
        minimizeImg.src = "icons/minimize-2.svg";
        isMin = false;
    } else {
        min.forEach(el => el.style.display = "none");
        minimize.style.margin = "0";
        minimizeImg.src = "icons/maximize.svg";
        isMin = true;
    }
    control.style.animation = "none";
}


function togglePower() {
    if (isOn) {
        isOn = false;
        player.pauseVideo();
        videoId.textContent = "POWER OFF";
        powerScreen.style.display = "block";
    } else {
        isOn = true;
        powerScreen.style.display = "none";
        playChannel(channelNumber, true);
    }
}
function toggleInfo() {
    if (showInfo) {
        showInfo = false;
        info.style.display = "none";
    } else {
        showInfo = true;
        info.style.display = "flex";
    }
}

function initializeChat() {
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.style.display = 'none';
    chatContainer.innerHTML = `
        <div class="chat-header">
            <span>Chat</span>
            <button class="chat-minimize-btn"><img src="icons/minimize-2.svg" alt="Minimize"></button>
        </div>
        <div class="chat-messages"></div>
        <input type="text" class="chat-input" placeholder="Type your message...">
    `;
    chatContainer.style.position = 'absolute';
    document.body.appendChild(chatContainer);

    const chatInput = chatContainer.querySelector('.chat-input');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    const minimizeBtn = chatContainer.querySelector('.chat-minimize-btn');
    minimizeBtn.addEventListener('click', minimizeChat);
    updateMinimizeButton();

    connectWebSocket();
}

function connectWebSocket() {
    socket = new WebSocket('wss://ytch.onrender.com'); // Updated URL

    socket.addEventListener('open', function (event) {
        console.log('Connected to WebSocket server');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });

    socket.addEventListener('message', function (event) {
        const chatMessage = JSON.parse(event.data);
        displayChatMessage(chatMessage);
    });

    socket.addEventListener('close', function (event) {
        console.log('Disconnected from WebSocket server');
        attemptReconnect();
    });

    socket.addEventListener('error', function (event) {
        console.error('WebSocket error:', event);
        socket.close(); // Close the socket to trigger the reconnect logic
    });
}

function attemptReconnect() {
    if (reconnectAttempts < 5) { // Limit the number of reconnection attempts
        const timeout = Math.pow(2, reconnectAttempts) * 1000; // Exponential backoff
        console.log(`Attempting to reconnect in ${timeout / 1000} seconds...`);
        setTimeout(() => {
            reconnectAttempts++;
            connectWebSocket();
        }, timeout);
    } else {
        console.error('Max reconnect attempts reached. Could not reconnect to WebSocket server.');
    }
}

function updateMinimizeButton() {
    const chatContainer = document.querySelector('.chat-container');
    const minimizeBtn = chatContainer.querySelector('.chat-minimize-btn img');
    if (chatContainer.classList.contains('minimized')) {
        minimizeBtn.src = "icons/maximize.svg";
        minimizeBtn.alt = "Maximize";
    } else {
        minimizeBtn.src = "icons/minimize-2.svg";
        minimizeBtn.alt = "Minimize";
    }
}

function sendChatMessage() {
    const chatInput = document.querySelector('.chat-input');
    const message = chatInput.value.trim();
    if (message && userName) {
        const chatMessage = {
            channel: channelNumber,
            user: userName,
            message: message,
            timestamp: new Date().toLocaleTimeString()
        };
        chatInput.value = ''; // Clear the input field

        // Send message to WebSocket server
        socket.send(JSON.stringify(chatMessage));
    }
}

function displayChatMessage(message) {
    const chatMessagesElement = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
        <span class="chat-timestamp">[${message.timestamp}]</span>
        <span class="chat-user">${message.user}:</span>
        <span class="chat-text">${message.message}</span>
    `;
    chatMessagesElement.appendChild(messageElement);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

function toggleChat() {
    const chatContainer = document.querySelector('.chat-container');
    if (showChat) {
        showChat = false;
        chatContainer.style.display = 'none';
    } else {
        showChat = true;
        chatContainer.style.display = 'flex';
        chatContainer.classList.remove('minimized');
        if (!userName) {
            promptForUserName();
        }
    }
}

function minimizeChat() {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.classList.toggle('minimized');
    updateMinimizeButton();
}

function promptForUserName() {
    userName = prompt("Enter your name for the chat:", "");
    if (!userName) {
        userName = "Anonymous";
    }
}

// Initialize chat when the page loads
window.addEventListener('load', initializeChat);
