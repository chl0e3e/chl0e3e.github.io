
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
        })
    ]
});
var responsiveWave = wavesurfer.util.debounce(function() {
  //wavesurfer.empty();
  wavesurfer.drawBuffer();
}, 150);

window.addEventListener('resize', responsiveWave);
wavesurfer.load('music/little_dark_age.mp3');
wavesurfer.on('ready', function () {
    wavesurfer.play();
});

// lyric storage manipulation

const lyricsStore = localStorage.getItem('lyrics', []);

for(var i = 0; i < lyricsStore.length; i++) {
    addLyricHTML(lyricsStore[i]);
}

function addLyricHTML(lyricObj) {
    var lyricsTable = document.querySelector("#lyrics table");
    for (var i = 0; i < lyricsTable.children.length; i++) {
        var tableChild = lyricsTable.children[i];

        if (tableChild.tagName == "TBODY") {
            const lyricRow = document.createElement("tr");

            {
                const lyricStart = document.createElement("td");
                const lyricLine = document.createElement("td");
                
                {
                    const lyricStartInput = document.createElement("input");
                    const lyricLineInput = document.createElement("input");
    
                    lyricStartInput.value = formatValue;
                    lyricLineInput.value = "Test";

                    lyricStart.appendChild(lyricStartInput);
                    lyricLine.appendChild(lyricLineInput);
                }

                lyricRow.appendChild(lyricStart);
                lyricRow.appendChild(lyricLine);
            }
    
            tableChild.appendChild(lyricRow);
        }
    }
}


document.querySelector('#slider').oninput = function () {
    wavesurfer.zoom(Number(this.value));
};

document.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 32) {
        wavesurfer.playPause();
    }
});

const lyricsTable = new Vue({
    el: '#lyrics',
    data: {
      lyrics: []
    },
    mounted() {
        if (localStorage.lyrics) {
            this.lyrics = localStorage.lyrics;
        }
    },
    watch: {
        lyrics(newLyrics) {
            localStorage.lyrics = newLyrics;
        }
    },
    methods : {
        addItem(lyricObj) {
            this.lyrics.push(lyricObj)
        }
    }
  });

document.getElementById("waveform").addEventListener('contextmenu', function(e) {
    function outerWidth(element) {
        if (!element) {
            return 0;
        }

        let width = element.offsetWidth;
        let style = getComputedStyle(element);

        width += parseInt(style.marginLeft + style.marginRight);
        return width;
    }

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
        "start": formatValue,
        "line": "Test",
    };

    lyricsTable.addItem(lyricObj);

    return false;
}, false);