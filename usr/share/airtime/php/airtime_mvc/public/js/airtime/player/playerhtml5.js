function getRandomIdPlayer(max) {
  return "playerHtml5Libretime_"+Math.floor(Math.random() * Math.floor(max));
}

function playerhtml5_insert(settings)
  { 
  atp='';  
  if(settings.autoplay==true) atp='autoplay';              
  if(settings.forceHTTPS==true&&settings.url.indexOf('https')==-1) settings.url=settings.url.replace(/http/g, 'https');
  if(settings.replacePort!=''&&settings.replacePort!=false&&settings.replacePort!='false') 
    {
    if(settings.replacePortTo!='') settings.replacePortTo=':'+settings.replacePortTo; 
    settings.url=settings.url.replace(':'+settings.replacePort, settings.replacePortTo);
    }
  if(settings.codec=='mp3') settings.codec='mpeg';
  document.getElementById('muses_skin').innerHTML += '<div id="div_'+settings.elementId+'" style="" ><audio loop controls id="'+settings.elementId+'" src="'+settings.url+'" '+atp+' type="audio/'+settings.codec+'" >'
    +'Votre navigateur ne supporte pas l\'élément <code>audio</code>'
    +'<\/audio><\/div>';  
  }
  
Html5Player.prototype.mobileDetect = function() {
            return (screen.width <= MAX_MOBILE_SCREEN_WIDTH);
        }

        // This function is called if an error occurs while a client is
        // attempting to connect to a stream (An error would occur if
        // the streams listener count has been maxed out or if the stream is down).
        // It checks if the client is a mobile device or not and returns the next
        // best available stream.
        Html5Player.prototype.getNextAvailableStream = function() {
            if (this.mobileDetect && this.availableMobileStreamQueue.length > 0) {
                return this.getNextAvailableMobileStream();
            }

            if (!this.mobileDetect && this.availableDesktopStreamQueue.length > 0) {
                return this.getNextAvailableDesktopStream();
            }

            // If we get to this point there are no available streams for the
            // type of device the client has connected with so just return
            // the next available stream - first we'll try the desktop streams
            var desktopStream = this.getNextAvailableDesktopStream();
            if (desktopStream) {
                return desktopStream;
            } else {
                return this.getNextAvailableMobileStream();
            }

        }

        // Gets and returns the next available mobile stream from the queue,
        // but adds it back to the end of the queue to be recycled.
        Html5Player.prototype.getNextAvailableMobileStream = function() {
            var stream = this.availableMobileStreamQueue.shift();
            //add to end of queue
            this.availableMobileStreamQueue.push(stream);
            return stream;
        }

        // Gets and returns the next available desktop stream from the queue,
        // but adds it back to the end of the queue to be recycled.
        Html5Player.prototype.getNextAvailableDesktopStream = function() {
            var stream = this.availableDesktopStreamQueue.shift();
            //add to end of queue
            this.availableDesktopStreamQueue.push(stream);
            return stream;
        }

        Html5Player.prototype.play = function() {
            console.log('play');
            playerhtml5_audio.src = this.settings.url+'?'+Math.floor(Math.random() * Math.floor(100000));
            playerhtml5_audio.play();
            togglePlayStopButton();
        };

        Html5Player.prototype.stop = function() {
            console.log('stop');
            playerhtml5_audio.pause();
            togglePlayStopButton();
        };
        function togglePlayStopButton() {
            document.getElementById("play_button").classList.toggle("hide_button");
            document.getElementById("stop_button").classList.toggle("hide_button");
        }

        $(document).ready(function() {
            $(".play").click(function () {
                if ($(this).hasClass("pause")) {
                    html5Player.stop();
                } else {
                    html5Player.play();
                }

                $(this).toggleClass("pause");
            });
        });

        // variables for updating the player's metadata
        var time_to_next_track_starts = 0;
        var metadataTimer = null;

        // Fetches the streams metadata from the Airtime live-info API
        // and attaches it to the player UI.
        //
        // The metadata is fetched when the current track is about to end.
        function attachStreamMetadataToPlayer(){
            $.ajax({url: "<?php echo $this->metadata_api_url?>",
                data: {type:"interval",limit:"5"},
                dataType: "jsonp",
                success: function(data) {

                    if (data.current === null) {
                        if (data.currentShow != null && data.currentShow.length > 0) {
                            //Master/show source have no current track but they do have a current show.
                            $("p.now_playing").html($.i18n._("On Air") + "<span>" + data.currentShow[0].name + "</span>");
                        } else {
                            $("p.now_playing").html($.i18n._("Off Air") + "<span>"+ $.i18n._("Offline") + "</span>");
                        }
                        time_to_next_track_starts = 20000;
                    } else {
                        var artist = data.current.name.split(" - ")[0];
                        var track = data.current.name.split(" - ")[1];
                        var nowPlayingHtml = "";
                        if (artist) {
                            nowPlayingHtml += artist;
                        }
                        if (track) {
                            nowPlayingHtml += "<span>" + track + "</span>";
                        }
                        $("p.now_playing").html(nowPlayingHtml);

                        var current_track_end_time = new Date(data.current.ends);
                        if (current_track_end_time == "Invalid Date" || isNaN(current_track_end_time)) {
                            // If the conversion didn't work (since the String is not in ISO format)
                            // then change it to be ISO-compliant. This is somewhat hacky and may break
                            // if the date string format in live-info changes!
                            current_track_end_time = new Date((data.current.ends).replace(" ", "T"));
                        }
                        var current_time = new Date();
                        //convert current_time to UTC to match the timezone of time_to_next_track_starts
                        current_time = new Date(current_time.getTime() + current_time.getTimezoneOffset() * 60 * 1000);
                        time_to_next_track_starts = current_track_end_time - current_time;
                    }

                    if (data.next === null) {
                        $("ul.schedule_list").find("li").html($.i18n._("Nothing scheduled"));
                    } else {
                        $("ul.schedule_list").find("li").html(data.next.name);
                    }
                }
            });

            //Preventative code if the local and remote clocks are out of sync.
            if (isNaN(time_to_next_track_starts) || time_to_next_track_starts < 0) {
                time_to_next_track_starts = 0;
            }

            // Add 3 seconds to the timeout so Airtime has time to update the metadata before we fetch it
            metadataTimer = setTimeout(attachStreamMetadataToPlayer, time_to_next_track_starts+3000);


        }
