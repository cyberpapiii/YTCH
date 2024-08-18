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
let isMin = false, isMuted = true, isOn = true, showInfo = false;

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
        playChannel(channelNumber, true);
    }
}

function toggleControl() {
    let min = document.querySelectorAll(".min");
    let minimize = document.querySelector(".minimize");
    let minimizeImg = document.querySelector(".minimize img");
    if (isMin) {
        min[0].style.display = "flex";
        min[1].style.display = "flex";
        min[2].style.display = "flex";
        minimize.style.margin = "0 0 1rem auto";
        minimizeImg.src = "icons/minimize-2.svg";
        isMin = false;
    } else {
        min[0].style.display = "none";
        min[1].style.display = "none";
        min[2].style.display = "none";
        minimize.style.margin = "0";
        minimizeImg.src = "icons/maximize.svg";
        isMin = true;
    }
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
