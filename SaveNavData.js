var arDrone = require('ar-drone');
var client  = arDrone.createClient();
var fs = require('fs');

// Get time in microseconds
var start_time = process.hrtime()
var navDataCounter = 1;

function getNavData() {
    client.on('navdata', (data)=>{
        //Handle drone data processing here...
        var curTime = process.hrtime(start_time);
        //console.log(processTime);
        if(curTime[0] == navDataCounter){
            // console.log(curTime[0], curTime[1]);
            fs.readFile(`tempNav.json`, function(err, prevData){
                if(err) throw err;
                const dat = JSON.parse(prevData);
                const time = {time: curTime[0]}
                const drone_data = data;
                var gps_data;
                fs.readFile("GPS-Data.txt", 'utf-8', function (err, gpsdata) {
                  if (err) throw err;
                  var tempGpsData = gpsdata.toString().split('\r\n');
                  gps_data = tempGpsData[tempGpsData.length - 1].split(",");
                  // console.log(gps_data);
                  if(drone_data.hasOwnProperty('demo')){
                    processNavData(time, drone_data, gps_data)
                    // const newData = []
                    // newData.push(time)
                    // newData.push(drone_data)
                    // dat.push(newData);
                    //dat.push(time);
                    dat[curTime[0]] = { 'drone_data': {} , 'longitude':-1, 'latitude':-1, 'altitude':-1};
                    dat[curTime[0]]['drone_data'] = drone_data;
                    dat[curTime[0]]['latitude'] = gps_data[0];
                    dat[curTime[0]]['longitude'] = gps_data[1];
                    dat[curTime[0]]['altitude'] = gps_data[2];
  
                    fs.writeFile(`./Trial/Trial${trial}/nav.json`, JSON.stringify(dat), err =>{
                        if(err) throw err;
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
    var gps_data = gps_data
    // console.log(gps_data)
    var processedNavData = []
    var battery = drone_data.demo.batteryPercentage
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
    processedNavData += '\n'+'Camera:\n'+'Translation - x: '+ftrans_x +' y:'+ftrans_y+' z:'+ftrans_z+'\n';
    processedNavData += 'Velocity :' + drone_data.demo.velocity.x + ' ' + drone_data.demo.velocity.y + ' '+ drone_data.demo.velocity.z+ '\n';
    //processedNavData += 'Velocity Outside :' + drone_data.demo.xVelocity + ' ' + drone_data.demo.yVelocity + ' '+ drone_data.demo.zVelocity+ '\n';
    processedNavData += "GPS Data \n Latitude :" + gps_data[0] + "\tLongitude: " + gps_data[1] + "\tAltitude: " + gps_data[2]+ '\n'; 
    fs.writeFile('Processed_Navdata.txt', processedNavData, function(err) {
      if (err) {
        console.log('Error saving processed data ' + err);
      }
    });
}
fs.writeFile('tempNav.json', '{}', function (err) {
  if (err) {
    console.log("Error in initializing file.", err);
  }
});
getNavData();