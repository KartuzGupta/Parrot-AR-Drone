var arDrone = require('ar-drone');
var client = arDrone.createClient();
var fs = require('fs');

var start_time = process.hrtime();
var trial = 0;
var imageCounter = 4;
// console.log("hrtime", hrtime[0], hrtime[1]);
// access the bottom camera
client.config('video:video_channel', 0);
function storeImages() {
    var pngStream = client.getPngStream();
    pngStream
    .on('error', console.log)
    .on('data', function(pngBuffer) {
        var curTime = process.hrtime(start_time);
        // if (curTime[0] == imageCounter) {
            console.log(curTime[0], curTime[1]);
            console.log('Saving frame');
            fs.writeFile(`Trial/Trial${trial}/images/frame` + curTime[0] + '.png', pngBuffer, function(err) {
            if (err) {
                console.log('Error saving PNG: ' + err);
            }
            imageCounter++;
        });
    //   }
    });
}

storeImages();