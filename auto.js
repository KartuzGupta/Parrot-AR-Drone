var arDrone = require('ar-drone');
var client  = arDrone.createClient();
var fs = require('fs');

//client.createRepl();

var keypress = require('keypress');
keypress(process.stdin);

// Get time in microseconds
var start_time = process.hrtime()
var imageCounter = 4;
var navDataCounter = 1;
var trial = 17;

function bottomCamera(){
  // access the bottom camera
  client.config('video:video_channel', 3);
  //require('ar-drone-png-stream')(client, { port: 8000 });
}

function frontCamera(){
  // access the front camera
  client.config('video:video_channel', 0);
  //require('ar-drone-png-stream')(client, { port: 3000 });
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function storeImages() {
  var pngStream = client.getPngStream();
  pngStream
  .on('error', console.log)
  .on('data', function(pngBuffer) {
      var curTime = process.hrtime(start_time);
      if (curTime[0] == imageCounter) {
          // console.log(curTime[0], curTime[1]);
          console.log('Saving frame');
          fs.writeFile(`Trial/Trial${trial}/images/frame` + curTime[0] + '.png', pngBuffer, function(err) {
          if (err) {
              console.log('Error saving PNG: ' + err);
          }
          imageCounter++;
      });
    }
  });
}

function getNavData(){
  client.on('navdata', (data)=>{
      //Handle drone data processing here...
      var curTime = process.hrtime(start_time);
      if(curTime[0] == navDataCounter){
          fs.readFile(`./Trial/Trial${trial}/nav.json`, function(err, prevData){
            if(err) throw err;
            const dat = JSON.parse(prevData);
            const time = {time: curTime[0]}
            const drone_data = data;
            var gps_data;
            fs.readFile("GPS-Data.txt", 'utf-8', function (err, gpsdata) {
              if (err) throw err;
              var tempGpsData = gpsdata.toString().split('\r\n');
              gps_data = tempGpsData[tempGpsData.length - 2].split(",");
              // console.log(gps_data);
              if (drone_data.hasOwnProperty('demo')) {
                processNavData(time, drone_data, gps_data)
                // const newData = []
                // newData.push(time)
                // newData.push(drone_data)
                // dat.push(newData);
                //dat.push(time);
                dat[curTime[0]] = { 'drone_data': {}, 'longitude': -1, 'latitude': -1, 'altitude': -1 };
                dat[curTime[0]]['drone_data'] = drone_data;
                dat[curTime[0]]['latitude'] = gps_data[0];
                dat[curTime[0]]['longitude'] = gps_data[1];
                dat[curTime[0]]['altitude'] = gps_data[2];
                fs.writeFile(`./Trial/Trial${trial}/nav.json`, JSON.stringify(dat), err => {
                  if (err) throw err;
                  //console.log("Done");
                });
              }
            });
          });
          navDataCounter++;
      }
  });
}

function processNavData(time_json, data_json, gps_data){
  var time = time_json
  var drone_data = data_json
  var processedNavData = []
  //console.log("Time", time.time)
  var battery = drone_data.demo.batteryPercentage
  //console.log("Battery Percetage: ", battery)
  var rotation = drone_data.demo.rotation
  var pitch = rotation.pitch
  var roll = rotation.roll
  var yaw = rotation.yaw
  var alt = drone_data.demo.altitude
  var fcamera_rot = drone_data.demo.drone.camera.rotation
  var bcamera_rot = drone_data.demo.detection.camera.rotation
  
  //console.log("Pitch: ", pitch, " Roll: ", roll, " Yaw:", yaw, " Altitude: ", alt);
  //console.log("Camera Rotation: ", camera_rot);
  var btrans_x = drone_data.demo.detection.camera.translation.x;
  var btrans_y = drone_data.demo.detection.camera.translation.y;
  var btrans_z = drone_data.demo.detection.camera.translation.z;

  var ftrans_x = drone_data.demo.drone.camera.translation.x;
  var ftrans_y = drone_data.demo.drone.camera.translation.y;
  var ftrans_z = drone_data.demo.drone.camera.translation.z;

  processedNavData = 'Time: '+time.time+'\n'+'Battery: '+battery+"\n"+"Pitch: "+ pitch+ " Roll: "+ roll+ " Yaw:"+ yaw+ "\nAltitude: "+ alt;
  //processedNavData += '\n'+'Bottom Camera:\n'+'Translation - x: '+btrans_x +' y:'+btrans_y+' z:'+btrans_z+'\n';
  processedNavData += '\n'+'Camera:\n'+'Translation - x: '+ftrans_x +' y:'+ftrans_y+' z:'+ftrans_z+'\n\n';
  processedNavData += 'Velocity :' + drone_data.demo.velocity.x + ' ' + drone_data.demo.velocity.y + ' '+ drone_data.demo.velocity.z+ '\n';
  //processedNavData += 'Velocity Outside :' + drone_data.demo.xVelocity + ' ' + drone_data.demo.yVelocity + ' '+ drone_data.demo.zVelocity+ '\n';
  processedNavData += "GPS Data \n Latitude :" + gps_data[0] + "\tLongitude: " + gps_data[1] + "\tAltitude: " + gps_data[2]+ '\n'; 
   
  fs.writeFile('Processed_Navdata.txt', processedNavData, function(err) {
    if (err) {
      console.log('Error saving processed data ' + err);
    }
  });
}
function key_detect(){
  process.stdin.on('keypress', function (ch, key) {
    // console.log("here's the key object", key);
   if(key.name=='l'){
      console.log("Landing...");
      client.land();
    }
    /*else if(key.name=='s'){
      console.log("Stopping....");
      client.stop();
    }
    else if(key.name=='f'){
      console.log("Moving Forward...")
      client.front(0.1);
    }
    else if(key.name=='b'){
      console.log('Moving Back..');
      client.back(0.1);
    }
    else if(key.name=='t'){
      console.log("Taking off...");
      client.takeoff();
    }*/  
  });  
}
function rdFile(){
  fs.readFile("instructions.txt", 'utf-8', function(err, data){
    if(err) throw err;
    console.log(data.toString());
    var cmd = data.toString();
    var ins = cmd.split(" ");
    if(ins[0]=='blred'){
      console.log("Blink Red", ins[1], ins[2]);
      client.animateLeds('blinkRed', ins[1], ins[2]);
    }
    else if(ins[0]=='blgreen'){
      console.log("Blink Green", ins[1], ins[2]);
      client.animateLeds('blinkGreen', ins[1], ins[2]);
    }
    else if(ins[0]=='t'){
      console.log("Taking Off..");
      client.takeoff();
    }
    else if(ins[0]=='f_s'){
      console.log("Moving Front...");
      client.front(ins[1]);
      client
      .after(1000, function(){
        this.stop();
      });
    }
    else if(ins[0]=='f'){
      console.log("Moving Front...");
      client.front(0.05);
    }
    
    else if(ins[0]=='s'){
      console.log("Stopping....");
      client.stop();
    }
    else if(ins[0]=='b'){
      console.log("Moving Back..");
      client.back(0.05);
    }
    else if(ins[0]=='l'){
      console.log("Landing...");
      client.land();
    }
    else if(ins[0]=='bcam'){
      console.log("Bottom Camera..")
      bottomCamera();
    }
    else if(ins[0]=='fcam'){
      console.log("Front Camera..");
      frontCamera();
    }
    else if(ins[0]=='le'){
      console.log("Moving Left..");
      client.counterClockwise(ins[1]);
      client
      .after(1000, function(){
        this.front(0.05);
      })
      .after(1000, function(){
        this.stop();
      });

    }
    else if(ins[0]=='r'){
      console.log("Moving Right..");
      client.clockwise(ins[1]);
      client
      .after(1000, function(){
        this.front(0.05);
      })
      .after(1000, function(){
        this.stop();
      });
    }
    else if(ins[0]=='u'){
      console.log("Moving Up..");
      client.up(ins[1]);
    }
    else if(ins[0]=='d'){
      console.log("Moving Right..");
      client.down(ins[1]);
    }
  });
}

// Function to detect sticker

function sticker(){
  var hrTime = process.hrtime(start_time);
    fs.readFile("instructions.txt", 'utf-8', function(err, data){
      if(err) throw err;
      var cmd = data.toString();
      var ins = cmd.split(" ");
      // console.log(cmd);
      if(ins[0]=='f_land'){
        b_exe = true;
        console.log("Landing...");
        client.land();
      }
      // else if(ins[0]=='gf_land'){
      //   b_exe = true;
      //   console.log("Detected Green..");
      //   client.land();
      //   // client.front(0);
      //   // client.back(0.03);
      //   // client
      //   // .after(1000, function(){
      //   //   this.land();
      //   // })
      // }
      // else if(ins[0]=='bf_land'){
      //   b_exe = true;
      //   console.log("Detected Blue..");
      //   client.land();
      //   // client.front(0);
      //   // client.back(0.03);
      //   // client
      //   // .after(1000, function(){
      //   //   this.land();
      //   // })
      // }
      // else if(!b_exe && ins[0]=='red'){
      //   console.log("Red Color Detected...")
      //   // client.stop();
      //   var hrTime = process.hrtime()
      //   start_time = hrTime[0]*1000000 + hrTime[1] / 1000;
      //   start_time = start_time/1000000;

      //   client
      //   .after(1000, function(){
      //     this.front(0.08);
      //   });
        
      // }
      // else if(!b_exe && ins[0]=='land' && process_time > 3){
      //   console.log("Waiting for further command....")
      //   client
      //   .after(1000, function(){
      //     client.land();
      //   });
      // }
    
    });
}

function file_instructions(){
  fs.watch("instructions.txt", (eventType, filename) => {
    sticker();
  });
}
function path() {
  // console.log(client);
  client.takeoff();
  client.calibrate();
  client
  .after(5000, function () {
    // this.stop();
    // this.front(0.3);
    this.up(0.4);
    console.log("uypar")
  })
  .after(14000, function () {
    this.stop();
    // this.front(0.3);
    this.front(0.1);
    console.log("aage")
  })
    .after(12000, function () {
      this.stop();
      this.right(0.1);
      // this.land();
      console.log("daaye")
    })
    // .after(2000, function () {
    //   // this.stop();
    //   // this.front(0.3);
    //   this.front(0.1);
    // })
    .after(3000, function () {
      // this.stop();
      this.stop();
      this.back(0.1);
      console.log("peeche")
      
    })
    // .after(2000, function () {
    //   this.stop();
    //   this.front(0.1);
    // })
    .after(11000, function () {
      this.stop();
      this.left(0.1);
      console.log("baaye")
    })
    .after(2000, function () {
      this.stop();
      this.land();
      console.log("baithjaa!")
    });
}
// Calling Functions --------------------

bottomCamera();
storeImages();
key_detect();
path();
file_instructions();
getNavData();