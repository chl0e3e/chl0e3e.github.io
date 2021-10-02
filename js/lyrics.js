const lyricsTable = new Vue({
    el: '#lyrics',
    data: {
        lyrics: []
    },
    watch: {
        lyrics: {
            handler(val) {
                console.log(val);
                this.lyrics = val;
                localStorage.lyrics = JSON.stringify(val);
                populateMarkers();
            }
        }
    },
    computed: {
        renderedLyrics: function() {
            function compare(a, b) {
                if (a.start < b.start) {
                    return -1;
                }
                if (a.start > b.start) {
                    return 1;
                }

                return 0;
            }
      
            return this.lyrics.sort(compare);
        }
    },
    mounted() {
        if(localStorage.lyrics) {
            this.lyrics = JSON.parse(localStorage.lyrics);
        }
    },
    methods: {
        addItem(lyricObj) {
            lyricObj["id"] = this.lyrics.length;
            this.lyrics.push(lyricObj);
        },
        removeLyric(id) {
            var index = 0;
            for(var i = 0; i < this.lyrics.length; i++) {
                if(this.lyrics[i]["id"] == id) {
                    index = i;
                    break;
                }
            }

            this.lyrics.splice(index, 1); 
            localStorage.lyrics = JSON.stringify(this.lyrics);
        },
        check(id, event) {
            for(var i = 0; i < this.lyrics.length; i++) {
                if(this.lyrics[i]["id"] == id) {
                    this.lyrics[i]["append"] = event.target.checked;
                    break;
                }
            }

            localStorage.lyrics = JSON.stringify(this.lyrics);
        },
        css(id) {

            for(var i = 0; i < this.lyrics.length; i++) {
                if(this.lyrics[i]["id"] == id) {
                    const newCSS = prompt("Enter CSS", this.lyrics[i]["css"]);
                    if(!newCSS) {
                        return;
                    }
                    this.lyrics[i]["css"] = newCSS;
                    break;
                }
            }

            localStorage.lyrics = JSON.stringify(this.lyrics);
        }
    }
});

function populateMarkers() {
    wavesurfer.clearMarkers();
    for(var i = 0; i < lyricsTable.renderedLyrics.length; i++) {
        wavesurfer.addMarker({
            "time": lyricsTable.renderedLyrics[i]["start"],
            "label": (i + 1).toString(),
            "position": "top",
            "color": "red"
        });
    }
}

var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'violet',
    progressColor: 'purple',
    plugins: [
        WaveSurfer.cursor.create({
            showTime: true,
            opacity: 1,
                customShowTimeStyle: {
                'background-color': '#000',
                color: '#fff',
                padding: '2px',
                'font-size': '10px'
            }
        }),
        WaveSurfer.markers.create({})
    ]
});

var responsiveWave = wavesurfer.util.debounce(function() {
    wavesurfer.drawBuffer();
    populateMarkers();
}, 0);

window.addEventListener('resize', responsiveWave);
wavesurfer.load('music/little_dark_age.mp3');
wavesurfer.on('ready', function () {
    wavesurfer.play();
});

wavesurfer.on('audioprocess', function() {
    const currentTime = wavesurfer.getCurrentTime();
    const renderedLyrics = lyricsTable.renderedLyrics;

    var appending = false;
    var currentLyrics = [{"start": "error", "line": "", "startFormatted": "error"}];

    // pick out lyrics including append in a row
    // go through all the lyrics
    for (var i = 0; i < renderedLyrics.length; i++) {
        if (currentTime > renderedLyrics[i]["start"]) {
            if(renderedLyrics[i]["append"]) {
                if(appending) {
                    appending = true;
                    currentLyrics.push(renderedLyrics[i]);
                } else {
                    appending = true;
                    currentLyrics = [renderedLyrics[i]];
                }
            } else if(appending) {
                appending = false;
                currentLyrics = [renderedLyrics[i]];
            } else { 
                currentLyrics = [renderedLyrics[i]];
            }
        }
    }

    // concoct an output
    // TODO: map these to a single line string
    var output = "";
    var css = "";
    for (var i = 0; i < currentLyrics.length; i++) {
        output += currentLyrics[i]["line"];
        css += currentLyrics[i]["css"];

        if(i != (currentLyrics.length - 1)) {
            output += " ";
            css += " ";
        }
    }

    // set the output in the HTML
    document.getElementById("player").innerText = output;
    document.getElementById("player").style = css;
});

document.getElementById("load-example").addEventListener("click", function() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                localStorage.lyrics = xmlhttp.responseText;
                lyricsTable.lyrics = localStorage.lyrics;
            }
            else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            }
            else {
                alert('something else other than 200 was returned');
            }
        }
    };

    xmlhttp.open("GET", "example.json", true);
    xmlhttp.send();
});

// lyric storage manipulation

document.querySelector('#slider').oninput = function () {
    wavesurfer.zoom(Number(this.value));
};

document.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 32) {
        wavesurfer.playPause();
    }
});

document.getElementById("waveform").addEventListener('contextmenu', function(e) {
    function formatTime(cursorTime) {
        cursorTime = isNaN(cursorTime) ? 0 : cursorTime;

        return [cursorTime].map(time =>
            [
                Math.floor((time % 3600) / 60), // minutes
                ('00' + Math.floor(time % 60)).slice(-2), // seconds
                ('000' + Math.floor((time % 1) * 1000)).slice(-3) // milliseconds
            ].join(':')
        );
    }

    e.preventDefault();
    const bbox = wavesurfer.container.getBoundingClientRect();
    let y = 0;
    let x = e.clientX - bbox.left;

    const duration = wavesurfer.getDuration();
    const elementWidth =
        wavesurfer.drawer.width /
        wavesurfer.params.pixelRatio;
    const scrollWidth = wavesurfer.drawer.getScrollX();

    const scrollTime =
        (duration / wavesurfer.drawer.width) * scrollWidth;

    const timeValue =
        Math.max(0, (x / elementWidth) * duration) + scrollTime;
    const formatValue = formatTime(timeValue);

    var lyricObj = {
        "startFormatted": formatValue,
        "start": timeValue,
        "line": "enter lyric",
        "append": false
    };

    lyricsTable.addItem(lyricObj);

    return false;
}, false);